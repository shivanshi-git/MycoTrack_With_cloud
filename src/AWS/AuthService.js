// /**
//  * authService.js
//  * AWS Cognito Authentication Service
//  * Replace placeholder functions with real Amplify/Cognito calls when ready.
//  */

// // TODO: import { Auth } from 'aws-amplify'; when Amplify is configured

// export const loginUser = async (email, password) => {
//   // return await Auth.signIn(email, password);
//   throw new Error("AWS Cognito not configured yet.");
// };

// export const registerUser = async (email, password) => {
//   // return await Auth.signUp({ username: email, password });
//   throw new Error("AWS Cognito not configured yet.");
// };

// export const resetPassword = async (email) => {
//   // return await Auth.forgotPassword(email);
//   throw new Error("AWS Cognito not configured yet.");
// };

// export const confirmResetPassword = async (email, code, newPassword) => {
//   // return await Auth.forgotPasswordSubmit(email, code, newPassword);
//   throw new Error("AWS Cognito not configured yet.");
// };

// export const logoutUser = async () => {
//   // return await Auth.signOut();
//   throw new Error("AWS Cognito not configured yet.");
// };

// // ⚠️ Expo Router requires a default React component export for all files
// // inside the app/ folder. Since this is a service file (not a screen),
// // move it OUTSIDE the app/ folder (e.g. into src/AWS/ or services/AWS/)
// // to avoid the "missing default export" warning.


/**
 * authService.js
 * AWS Cognito Authentication — fully implemented with Amplify v6
 * Location: src/AWS/authService.js   (OUTSIDE app/ folder)
 *
 * Install: npm install aws-amplify
 * Make sure initAWS() is called in app/_layout.js before any of these run.
 */

import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

// ─── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const result = await signIn({ username: email, password });
  return result;
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (email, password) => {
  const result = await signUp({
    username: email,
    password,
    options: {
      userAttributes: { email },
    },
  });
  return result;
};

// ─── Confirm registration (OTP from email) ────────────────────────────────────
export const confirmRegistration = async (email, code) => {
  const result = await confirmSignUp({ username: email, confirmationCode: code });
  return result;
};

// ─── Forgot password — sends code to email ────────────────────────────────────
export const forgotPassword = async (email) => {
  const result = await resetPassword({ username: email });
  return result;
};

// ─── Confirm new password with the emailed code ───────────────────────────────
export const confirmNewPassword = async (email, code, newPassword) => {
  const result = await confirmResetPassword({
    username:        email,
    confirmationCode: code,
    newPassword,
  });
  return result;
};

// ─── Logout ────────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  await signOut();
};

// ─── Get current logged-in user ────────────────────────────────────────────────
export const getCurrentLoggedInUser = async () => {
  try {
    const user = await getCurrentUser();
    return user;   // { username, userId, signInDetails }
  } catch {
    return null;   // not logged in
  }
};

// ─── Get JWT tokens (for API calls that need Authorization header) ────────────
export const getAuthTokens = async () => {
  const session = await fetchAuthSession();
  return {
    idToken:      session.tokens?.idToken?.toString(),
    accessToken:  session.tokens?.accessToken?.toString(),
  };
};