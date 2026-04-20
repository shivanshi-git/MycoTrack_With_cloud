import { StyleSheet, Text, View, Button, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function Page() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Home</Text>

      <Button title="Alerts" onPress={() => router.push("/screens/Alerts")} />
      <Button title="Camera AI" onPress={() => router.push("/screens/CameraAI")} />
      <Button title="Dashboard" onPress={() => router.push("/screens/Dashboard")} />
      <Button title="Disease Result" onPress={() => router.push("/screens/DiseaseResult")} />
      <Button title="Forgot Password" onPress={() => router.push("/screens/ForgotPassword")} />
      <Button title="Login" onPress={() => router.push("/screens/Login")} />
      <Button title="Monitoring" onPress={() => router.push("/screens/Monitoring")} />
      <Button title="OTP Verification" onPress={() => router.push("/screens/OtpsVerification")} />
      <Button title="Reset Success" onPress={() => router.push("/screens/ResetSuccess")} />
      <Button title="Settings" onPress={() => router.push("/screens/Settings")} />
      <Button title="Signup" onPress={() => router.push("/screens/Signup")} />
      <Button title="Welcome" onPress={() => router.push("/screens/Welcome")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});