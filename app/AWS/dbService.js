/**
 * dbService.js
 * Replaces all Firebase Realtime DB calls (ref, onValue, set, update, push)
 *
 * Uses:
 *   - DynamoDB for persistent data (scans, alerts, sensor history)
 *   - AWS IoT Core MQTT for real-time updates (replaces onValue listeners)
 *
 * Install:
 *   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *               @aws-sdk/client-iot-data-plane mqtt
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { DYNAMO, IOT } from "./awsConfig";

// ─── Clients ──────────────────────────────────────────────────────────────────
// In production, credentials come from Cognito Identity Pool (no hardcoded keys)
// See: https://docs.amplify.aws/react-native/build-a-backend/auth/grant-access-to-auth-users/

const dynamo = new DynamoDBClient({ region: DYNAMO.region });
const iotData = new IoTDataPlaneClient({ region: IOT.region, endpoint: `https://${IOT.endpoint}` });

// ─────────────────────────────────────────────────────────────────────────────
//  SCANS — mushroom AI detection results
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save a scan result to DynamoDB
 * Replaces: push(ref(db, 'mushroom_farm/house_1/scans'), data)
 */
export const saveScan = async ({ userId, healthy, confidence, timestamp, processTime }) => {
  const item = {
    scanId:      `${userId}-${Date.now()}`,
    userId,
    healthy,
    confidence,
    timestamp:   timestamp || new Date().toISOString(),
    processTime: processTime || "0s",
    createdAt:   Date.now(),
  };
  await dynamo.send(new PutItemCommand({
    TableName: DYNAMO.scansTable,
    Item:      marshall(item),
  }));
  return item;
};

/**
 * Get recent scans for a user
 * Replaces: onValue(ref(db, 'mushroom_farm/house_1/scans'), ...)
 */
export const getRecentScans = async (userId, limit = 10) => {
  const result = await dynamo.send(new QueryCommand({
    TableName:                 DYNAMO.scansTable,
    KeyConditionExpression:    "userId = :uid",
    ExpressionAttributeValues: marshall({ ":uid": userId }),
    ScanIndexForward:          false, // newest first
    Limit:                     limit,
  }));
  return (result.Items || []).map(unmarshall);
};

// ─────────────────────────────────────────────────────────────────────────────
//  ALERTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all alerts
 * Replaces: onValue(ref(db, 'mushroom_farm/house_1/alerts'), ...)
 */
export const getAlerts = async (houseId = "house_1") => {
  const result = await dynamo.send(new QueryCommand({
    TableName:                 DYNAMO.alertsTable,
    KeyConditionExpression:    "houseId = :hid",
    ExpressionAttributeValues: marshall({ ":hid": houseId }),
    ScanIndexForward:          false,
    Limit:                     50,
  }));
  return (result.Items || []).map(unmarshall);
};

/**
 * Mark alert as read
 * Replaces: update(ref(db, `mushroom_farm/house_1/alerts/${id}`), { read: true })
 */
export const markAlertRead = async (houseId, alertId) => {
  await dynamo.send(new UpdateItemCommand({
    TableName: DYNAMO.alertsTable,
    Key:       marshall({ houseId, alertId }),
    UpdateExpression:          "SET #r = :true",
    ExpressionAttributeNames:  { "#r": "read" },
    ExpressionAttributeValues: marshall({ ":true": true }),
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
//  SENSOR DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get latest sensor readings
 * Replaces: onValue(ref(db, 'mushroom_farm/house_1/sensors'), ...)
 */
export const getSensorData = async (houseId = "house_1") => {
  const result = await dynamo.send(new QueryCommand({
    TableName:                 DYNAMO.sensorsTable,
    KeyConditionExpression:    "houseId = :hid",
    ExpressionAttributeValues: marshall({ ":hid": houseId }),
    ScanIndexForward:          false,
    Limit:                     1,
  }));
  return result.Items?.length ? unmarshall(result.Items[0]) : null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ACTUATOR CONTROL via IoT Core MQTT
//  Replaces: set(ref(db, 'actuators/fan'), value)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send actuator command to Pi/ESP32 via IoT Core
 * Replaces: set(ref(db, `actuators/${device}`), value)
 */
export const setActuator = async (device, value) => {
  const payload = JSON.stringify({ device, value, timestamp: Date.now() });
  await iotData.send(new PublishCommand({
    topic:   IOT.topics.actuatorCmd,
    payload: Buffer.from(payload),
    qos:     1,
  }));
};

/**
 * Set actuator mode (Auto/Manual)
 * Replaces: set(ref(db, `actuators/${device}Mode`), mode)
 */
export const setActuatorMode = async (device, mode) => {
  const payload = JSON.stringify({ device, mode, timestamp: Date.now() });
  await iotData.send(new PublishCommand({
    topic:   IOT.topics.actuatorCmd,
    payload: Buffer.from(payload),
    qos:     1,
  }));
};

/**
 * Trigger manual Pi camera capture
 * Replaces: set(ref(db, `/triggers/pi_cam_001/manualCapture`), true)
 */
export const triggerManualCapture = async (deviceId = "pi_cam_001") => {
  const payload = JSON.stringify({ trigger: true, deviceId, timestamp: Date.now() });
  await iotData.send(new PublishCommand({
    topic:   IOT.topics.manualCapture,
    payload: Buffer.from(payload),
    qos:     1,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
//  REAL-TIME SUBSCRIPTIONS via AWS IoT WebSocket MQTT
//  Replaces: onValue() Firebase listeners
//
//  Usage:
//    const unsub = subscribeToSensors("house_1", (data) => setSensors(data));
//    return () => unsub();
// ─────────────────────────────────────────────────────────────────────────────

let mqttClient = null;
const topicCallbacks = {};

async function getMqttClient() {
  if (mqttClient) return mqttClient;

  // Uses mqtt.js with AWS IoT WebSocket signed URL
  // Install: npm install mqtt
  const mqtt = await import("mqtt");
  mqttClient = mqtt.connect(`wss://${IOT.endpoint}/mqtt`, {
    clientId: `mycotrack-app-${Math.random().toString(36).slice(2)}`,
    // Credentials: use Cognito Identity Pool credentials in production
  });

  mqttClient.on("message", (topic, message) => {
    const cbs = topicCallbacks[topic] || [];
    const data = JSON.parse(message.toString());
    cbs.forEach((cb) => cb(data));
  });

  return mqttClient;
}

export const subscribeToSensors = async (houseId, callback) => {
  const topic = `mycotrack/${houseId}/sensors`;
  const client = await getMqttClient();
  topicCallbacks[topic] = [...(topicCallbacks[topic] || []), callback];
  client.subscribe(topic);
  return () => {
    topicCallbacks[topic] = (topicCallbacks[topic] || []).filter((cb) => cb !== callback);
  };
};

export const subscribeToActuators = async (houseId, callback) => {
  const topic = `mycotrack/${houseId}/actuators/state`;
  const client = await getMqttClient();
  topicCallbacks[topic] = [...(topicCallbacks[topic] || []), callback];
  client.subscribe(topic);
  return () => {
    topicCallbacks[topic] = (topicCallbacks[topic] || []).filter((cb) => cb !== callback);
  };
};