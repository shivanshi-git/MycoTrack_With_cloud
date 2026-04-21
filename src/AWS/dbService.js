// /**
//  * dbService.js
//  * AWS DynamoDB / IoT Core Service
//  * Replace placeholder functions with real AWS SDK calls when ready.
//  */

// // TODO: import { DynamoDBClient, ... } from "@aws-sdk/client-dynamodb"; when configured

// export const getAlerts = async (houseId) => {
//   console.warn("dbService: getAlerts not connected to AWS yet.");
//   return [];
// };

// export const markAlertRead = async (houseId, alertId) => {
//   console.warn("dbService: markAlertRead not connected to AWS yet.");
// };

// export const getActuatorStates = async (houseId) => {
//   console.warn("dbService: getActuatorStates not connected to AWS yet.");
//   return null;
// };

// export const setActuator = async (houseId, key, value) => {
//   console.warn(`dbService: setActuator [${key}=${value}] not connected to AWS yet.`);
// };

// export const getSettings = async (houseId) => {
//   console.warn("dbService: getSettings not connected to AWS yet.");
//   return null;
// };

// export const saveThresholds = async (houseId, thresholds) => {
//   console.warn("dbService: saveThresholds not connected to AWS yet.");
// };

// export const saveAutomation = async (houseId, automation) => {
//   console.warn("dbService: saveAutomation not connected to AWS yet.");
// };

// // ⚠️ Expo Router requires a default React component export for all files
// // inside the app/ folder. Since this is a service file (not a screen),
// // move it OUTSIDE the app/ folder (e.g. into src/AWS/ or services/AWS/)
// // to avoid the "missing default export" warning.



/**
 * dbService.js
 * AWS DynamoDB service — fully implemented
 * Location: src/AWS/dbService.js   (OUTSIDE app/ folder)
 *
 * Install: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 * IAM note: The Cognito Identity Pool (or your IAM user) must have
 * dynamodb:GetItem, PutItem, Query, UpdateItem on the tables below.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { fetchAuthSession } from "aws-amplify/auth";
import { DYNAMO, ALERT_BACKEND_URL } from "./Awsconfig";

// ─── DynamoDB client (uses Cognito session credentials) ───────────────────────

async function getDocClient() {
  const session     = await fetchAuthSession();
  const credentials = session.credentials;

  const raw = new DynamoDBClient({
    region:      DYNAMO.region,
    credentials: {
      accessKeyId:     credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken:    credentials.sessionToken,
    },
  });

  return DynamoDBDocumentClient.from(raw);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

/**
 * Fetch all alerts for a house, sorted newest first.
 * DynamoDB table: MycoTrack_Alerts  PK=houseId  SK=alertId
 */
export const getAlerts = async (houseId = "house_1") => {
  try {
    const client = await getDocClient();
    const result = await client.send(
      new QueryCommand({
        TableName:                 DYNAMO.alertsTable,
        KeyConditionExpression:    "houseId = :hid",
        ExpressionAttributeValues: { ":hid": houseId },
        ScanIndexForward:          false,   // newest first
        Limit:                     50,
      })
    );
    return result.Items || [];
  } catch (err) {
    console.warn("[dbService] getAlerts failed:", err.message);
    return [];
  }
};

/**
 * Mark a single alert as read.
 */
export const markAlertRead = async (houseId = "house_1", alertId) => {
  try {
    const client = await getDocClient();
    await client.send(
      new UpdateCommand({
        TableName:                 DYNAMO.alertsTable,
        Key:                       { houseId, alertId },
        UpdateExpression:          "SET #r = :t",
        ExpressionAttributeNames:  { "#r": "read" },
        ExpressionAttributeValues: { ":t": true },
      })
    );
  } catch (err) {
    console.warn("[dbService] markAlertRead failed:", err.message);
  }
};

// ─── Sensor readings ──────────────────────────────────────────────────────────

/**
 * Fetch the most recent N sensor readings for a house.
 * DynamoDB table: MycoTrack_Sensors  PK=houseId  SK=timestamp (Number)
 */
export const getLatestSensorReadings = async (houseId = "house_1", limit = 24) => {
  try {
    const client = await getDocClient();
    const result = await client.send(
      new QueryCommand({
        TableName:                 DYNAMO.sensorsTable,
        KeyConditionExpression:    "houseId = :hid",
        ExpressionAttributeValues: { ":hid": houseId },
        ScanIndexForward:          false,
        Limit:                     limit,
      })
    );
    return result.Items || [];
  } catch (err) {
    console.warn("[dbService] getLatestSensorReadings failed:", err.message);
    return [];
  }
};

// ─── Actuators ────────────────────────────────────────────────────────────────

/**
 * Get current actuator states (fan, humidifier, pump, lights).
 * DynamoDB table: MycoTrack_Actuators  PK=houseId
 */
export const getActuatorStates = async (houseId = "house_1") => {
  try {
    const client = await getDocClient();
    const result = await client.send(
      new GetCommand({
        TableName: DYNAMO.actuatorsTable,
        Key:       { houseId },
      })
    );
    return result.Item || null;
  } catch (err) {
    console.warn("[dbService] getActuatorStates failed:", err.message);
    return null;
  }
};

/**
 * Update one actuator key (e.g. fan: true).
 * Also publishes to IoT Core via the Lambda backend.
 */
export const setActuator = async (houseId = "house_1", key, value) => {
  try {
    const client = await getDocClient();
    await client.send(
      new UpdateCommand({
        TableName:                 DYNAMO.actuatorsTable,
        Key:                       { houseId },
        UpdateExpression:          "SET #k = :v, updatedAt = :ts",
        ExpressionAttributeNames:  { "#k": key },
        ExpressionAttributeValues: {
          ":v":  value,
          ":ts": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.warn("[dbService] setActuator failed:", err.message);
  }
};

// ─── Settings / Thresholds ────────────────────────────────────────────────────

/**
 * Get settings for a house (thresholds, automation flags, etc.).
 * DynamoDB table: MycoTrack_Sensors  PK=houseId  SK="settings"
 */
export const getSettings = async (houseId = "house_1") => {
  try {
    const client = await getDocClient();
    const result = await client.send(
      new GetCommand({
        TableName: DYNAMO.sensorsTable,
        Key:       { houseId, timestamp: 0 },   // timestamp=0 reserved for settings
      })
    );
    return result.Item || null;
  } catch (err) {
    console.warn("[dbService] getSettings failed:", err.message);
    return null;
  }
};

export const saveThresholds = async (houseId = "house_1", thresholds) => {
  try {
    const client = await getDocClient();
    await client.send(
      new UpdateCommand({
        TableName:                 DYNAMO.sensorsTable,
        Key:                       { houseId, timestamp: 0 },
        UpdateExpression:          "SET thresholds = :t, updatedAt = :ts",
        ExpressionAttributeValues: {
          ":t":  thresholds,
          ":ts": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.warn("[dbService] saveThresholds failed:", err.message);
  }
};

export const saveAutomation = async (houseId = "house_1", automation) => {
  try {
    const client = await getDocClient();
    await client.send(
      new UpdateCommand({
        TableName:                 DYNAMO.sensorsTable,
        Key:                       { houseId, timestamp: 0 },
        UpdateExpression:          "SET automation = :a, updatedAt = :ts",
        ExpressionAttributeValues: {
          ":a":  automation,
          ":ts": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.warn("[dbService] saveAutomation failed:", err.message);
  }
};

// ─── Push token registration (posts to Lambda backend) ────────────────────────

/**
 * Register an Expo push token with the alert backend.
 * Call this once after getting the token in usePushNotifications.js.
 */
export const registerPushToken = async (token) => {
  try {
    const resp = await fetch(`${ALERT_BACKEND_URL}/register-token`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    });
    const json = await resp.json();
    console.log("[dbService] Push token registered:", json.message);
    return json;
  } catch (err) {
    console.warn("[dbService] registerPushToken failed:", err.message);
  }
};