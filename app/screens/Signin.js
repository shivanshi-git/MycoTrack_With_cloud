/**
 * app/signin.js
 *
 * MUST be at app/signin.js (root level inside app/) so that
 * the deep link  myapp://signin?code=XXX  maps to this screen.
 *
 * Flow:
 *   1. User confirms email in Cognito Hosted UI
 *   2. Cognito redirects → myapp://signin?code=ABC123
 *   3. Android opens the app and Expo Router loads this screen
 *   4. We read the code from the URL, exchange it for tokens
 *   5. Navigate to /screens/Welcome
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { exchangeCodeForTokens } from "../../src/AWS/cognitoConfig";

const C = {
  bg:    "#0d0702",
  amber2:"#f0a535",
  cream: "#f0e6d8",
  muted: "#7a6050",
};

export default function SigninCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    handleDeepLink();
  }, []);

  const extractCode = (url) => {
    // url looks like: myapp://signin?code=ABC123&...
    try {
      // Use URL parsing — works for standard query strings
      const queryString = url.split("?")[1];
      if (!queryString) return null;
      const params = {};
      queryString.split("&").forEach((pair) => {
        const [key, val] = pair.split("=");
        params[decodeURIComponent(key)] = decodeURIComponent(val || "");
      });
      return params.code || null;
    } catch {
      return null;
    }
  };

  const handleDeepLink = async () => {
    try {
      // Get the URL that launched this screen
      const initialUrl = await Linking.getInitialURL();
      console.log("Deep link URL:", initialUrl);

      const code = initialUrl ? extractCode(initialUrl) : null;

      if (!code) {
        setStatus("No auth code found…");
        Alert.alert(
          "Sign-in Error",
          "No authorisation code was received. Please try again.",
          [{ text: "Back to Login", onPress: () => router.replace("/screens/Login") }]
        );
        return;
      }

      setStatus("Exchanging code with AWS Cognito…");
      const tokens = await exchangeCodeForTokens(code);

      // Persist tokens
      await AsyncStorage.multiSet([
        ["access_token",  tokens.access_token],
        ["id_token",      tokens.id_token],
        ["refresh_token", tokens.refresh_token ?? ""],
      ]);

      setStatus("Signed in! Loading your farm…");

      setTimeout(() => {
        router.replace("/screens/Welcome");
      }, 600);

    } catch (err) {
      console.error("Signin callback error:", err);
      Alert.alert(
        "Authentication Failed",
        err.message || "Something went wrong. Please try signing in again.",
        [{ text: "Try Again", onPress: () => router.replace("/screens/Login") }]
      );
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>
        <ActivityIndicator size="large" color={C.amber2} style={{ marginBottom: 24 }} />
        <Text style={s.status}>{status}</Text>
        <Text style={s.sub}>AWS Cognito · eu-north-1</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  inner:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  status: { fontSize: 16, color: C.cream, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  sub:    { fontSize: 12, color: C.muted, textAlign: "center" },
});