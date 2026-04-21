// app/_layout.js
import { Stack } from "expo-router";
import { AlertProvider } from "../context/AlertContext";

export default function Layout() {
  return (
    <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
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
    </AlertProvider>
  );
}