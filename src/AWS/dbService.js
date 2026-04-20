/**
 * dbService.js
 * AWS DynamoDB / IoT Core Service
 * Replace placeholder functions with real AWS SDK calls when ready.
 */

// TODO: import { DynamoDBClient, ... } from "@aws-sdk/client-dynamodb"; when configured

export const getAlerts = async (houseId) => {
  console.warn("dbService: getAlerts not connected to AWS yet.");
  return [];
};

export const markAlertRead = async (houseId, alertId) => {
  console.warn("dbService: markAlertRead not connected to AWS yet.");
};

export const getActuatorStates = async (houseId) => {
  console.warn("dbService: getActuatorStates not connected to AWS yet.");
  return null;
};

export const setActuator = async (houseId, key, value) => {
  console.warn(`dbService: setActuator [${key}=${value}] not connected to AWS yet.`);
};

export const getSettings = async (houseId) => {
  console.warn("dbService: getSettings not connected to AWS yet.");
  return null;
};

export const saveThresholds = async (houseId, thresholds) => {
  console.warn("dbService: saveThresholds not connected to AWS yet.");
};

export const saveAutomation = async (houseId, automation) => {
  console.warn("dbService: saveAutomation not connected to AWS yet.");
};

// ⚠️ Expo Router requires a default React component export for all files
// inside the app/ folder. Since this is a service file (not a screen),
// move it OUTSIDE the app/ folder (e.g. into src/AWS/ or services/AWS/)
// to avoid the "missing default export" warning.