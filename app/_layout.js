// app/_layout.js
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      {/* myapp://signin → app/signin.js — catches Cognito redirect */}
      <Stack.Screen name="Signin" />

      {/* Auth */}
      <Stack.Screen name="screens/Login" />
      <Stack.Screen name="screens/Welcome" />
      <Stack.Screen name="screens/Signup" />
      <Stack.Screen name="screens/ForgotPassword" />
      <Stack.Screen name="screens/OtpsVerification" />
      <Stack.Screen name="screens/ResetSuccess" />

      {/* App */}
      <Stack.Screen name="screens/Dashboard" />
      <Stack.Screen name="screens/Monitoring" />
      <Stack.Screen name="screens/CameraAI" />
      <Stack.Screen name="screens/Alerts" />
      <Stack.Screen name="screens/Settings" />
      <Stack.Screen name="screens/DiseaseResult" />
    </Stack>
  );
}