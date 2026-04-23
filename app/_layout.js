/**
 * _layout.js
 * Root Expo Router layout — initialises AWS Amplify and push notifications
 * Location: app/_layout.js
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import { initAWS } from "../src/AWS/Awsconfig";
import usePushNotifications from "../src/AWS/Usepushnotification";

export default function RootLayout() {
  // Initialise AWS Amplify once at startup
  useEffect(() => {
    initAWS();
  }, []);

  // Register device for Expo push notifications + send token to backend
  usePushNotifications();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/Dashboard" />
      <Stack.Screen name="screens/Alerts" />
      <Stack.Screen name="screens/Monitoring" />
      <Stack.Screen name="screens/CameraAI" />
      <Stack.Screen name="screens/Settings" />
      <Stack.Screen name="screens/Login" />
      <Stack.Screen name="screens/Signup" />
      <Stack.Screen name="screens/Signin" />
      <Stack.Screen name="screens/ForgotPassword" />
      <Stack.Screen name="screens/ResetSuccess" />
      <Stack.Screen name="screens/Welcome" />
    </Stack>
  );
}