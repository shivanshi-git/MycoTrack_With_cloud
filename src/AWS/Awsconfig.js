/**
 * awsConfig.js
 * Central AWS configuration — replaces firebase/firebaseConfig.js
 *
 * Services used:
 *   Auth      → AWS Cognito (replaces Firebase Auth)
 *   Database  → AWS IoT Core + DynamoDB (replaces Firebase Realtime DB)
 *   Storage   → AWS S3 (replaces Firebase Storage)
 *
 * Setup steps:
 *   1. npm install aws-amplify @aws-amplify/auth @aws-sdk/client-dynamodb
 *      @aws-sdk/client-s3 @aws-sdk/client-iot-data-plane
 *   2. Fill in YOUR values below (from AWS Console)
 *   3. Replace every  import { db } from "../../firebase/firebaseConfig"
 *      with            import { iotPublish, queryScans } from "../../aws/awsConfig"
 */

import { Amplify } from "aws-amplify";

// ─── 1. Cognito — paste from AWS Console → Cognito → User Pool ───────────────
export const COGNITO = {
  region:              "eu-north-1",           // ← your region
  userPoolId:          "eu-north-1_n61OKWd0o",  // ← User Pool ID
  userPoolWebClientId: "3mgmm695ofhku6ffdkidommvos"// ← App client ID
};

// ─── 2. DynamoDB table names ──────────────────────────────────────────────────
export const DYNAMO = {
  region:       "us-east-1",
  scansTable:   "MycoTrack_Scans",     // stores mushroom scan results
  alertsTable:  "MycoTrack_Alerts",    // stores alert events
  sensorsTable: "MycoTrack_Sensors",   // stores sensor readings from Pi/ESP32
  actuatorsTable: "MycoTrack_Actuators",
};

// ─── 3. S3 bucket ────────────────────────────────────────────────────────────
export const S3 = {
  region: "us-east-1",
  bucket: "mycotrack-images",          // ← your bucket name
};

// ─── 4. AWS IoT Core (replaces Firebase Realtime DB live updates) ─────────────
export const IOT = {
  endpoint: "a12i78alo13mj4-ats.iot.eu-north-1.amazonaws.com",
  region: "eu-north-1",
  topics: {
    sensorData: "mycotrack/house_1/sensors",
    actuatorCmd: "mycotrack/house_1/actuators/cmd",
    actuatorState: "mycotrack/house_1/actuators/state",
    manualCapture: "mycotrack/pi_cam_001/trigger",
    alerts: "mycotrack/house_1/alerts",
  },
};

// ─── 5. EC2 FastAPI backend (replaces local Wi-Fi IP) ────────────────────────
export const BACKEND_URL = "http://16.170.250.107:8001";

// ─── Amplify init (call once in app entry point) ─────────────────────────────
export function initAWS() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId:       COGNITO.userPoolId,
        userPoolClientId: COGNITO.userPoolWebClientId,
        region:           COGNITO.region,
      },
    },
  });
}

export default { COGNITO, DYNAMO, S3, IOT, BACKEND_URL, initAWS };