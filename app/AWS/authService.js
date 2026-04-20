/**
 * authService.js  (AWS version)
 * Replaces: firebase/authService.js
 *
 * Uses AWS Amplify + Cognito for:
 *   - login / signup / logout
 *   - password reset (real email, not mock)
 *   - auth state subscription
 *
 * Drop-in replacement — same function names as the old Firebase version.
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
  Hub,
} from "aws-amplify/auth";

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const result = await signIn({ username: email, password });
  if (result.isSignedIn) {
    const user = await getCurrentUser();
    return { email: user.signInDetails?.loginId || email, uid: user.userId };
  }
  throw new Error("Sign-in incomplete: " + result.nextStep?.signInStep);
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (email, password) => {
  const result = await signUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  });
  // If auto-confirm is off in Cognito, nextStep will be CONFIRM_SIGN_UP
  // Return enough info for the caller to decide whether to show OTP screen
  return {
    email,
    uid:          result.userId,
    needsConfirm: result.nextStep?.signUpStep === "CONFIRM_SIGN_UP",
  };
};

// ─── Confirm OTP (Cognito sends a 6-digit code to email) ─────────────────────
export const confirmOtp = async (email, code) => {
  await confirmSignUp({ username: email, confirmationCode: code });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  await signOut();
};

// ─── Forgot Password — sends real reset code via Cognito ─────────────────────
export const sendPasswordReset = async (email) => {
  await resetPassword({ username: email });
};

// ─── Confirm new password with the code Cognito emailed ──────────────────────
export const confirmPasswordReset = async (email, code, newPassword) => {
  await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
};

// ─── Get current user (sync-safe wrapper) ────────────────────────────────────
export const getCurrentAuthUser = async () => {
  try {
    const user    = await getCurrentUser();
    const session = await fetchAuthSession();
    return {
      email: user.signInDetails?.loginId,
      uid:   user.userId,
      token: session.tokens?.idToken?.toString(),
    };
  } catch {
    return null;
  }
};

// ─── Auth state subscription (same API as old Firebase version) ──────────────
// callback(user) is called immediately and on every auth change
export const subscribeToAuthChanges = (callback) => {
  // Fire immediately with current user
  getCurrentAuthUser().then(callback);

  // Listen for Cognito Hub events
  const unsubscribe = Hub.listen("auth", ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
        getCurrentAuthUser().then(callback);
        break;
      case "signedOut":
        callback(null);
        break;
    }
  });

  return unsubscribe; // call this to unsubscribe
};