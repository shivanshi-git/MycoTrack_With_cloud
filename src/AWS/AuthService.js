/**
 * authService.js
 * AWS Cognito Authentication Service
 * Replace placeholder functions with real Amplify/Cognito calls when ready.
 */

// TODO: import { Auth } from 'aws-amplify'; when Amplify is configured

export const loginUser = async (email, password) => {
  // return await Auth.signIn(email, password);
  throw new Error("AWS Cognito not configured yet.");
};

export const registerUser = async (email, password) => {
  // return await Auth.signUp({ username: email, password });
  throw new Error("AWS Cognito not configured yet.");
};

export const resetPassword = async (email) => {
  // return await Auth.forgotPassword(email);
  throw new Error("AWS Cognito not configured yet.");
};

export const confirmResetPassword = async (email, code, newPassword) => {
  // return await Auth.forgotPasswordSubmit(email, code, newPassword);
  throw new Error("AWS Cognito not configured yet.");
};

export const logoutUser = async () => {
  // return await Auth.signOut();
  throw new Error("AWS Cognito not configured yet.");
};

// ⚠️ Expo Router requires a default React component export for all files
// inside the app/ folder. Since this is a service file (not a screen),
// move it OUTSIDE the app/ folder (e.g. into src/AWS/ or services/AWS/)
// to avoid the "missing default export" warning.