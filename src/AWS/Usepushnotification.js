import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { registerPushToken } from "./dbService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  useEffect(() => {
    // Skip on web
    if (Platform.OS === "web") return;

    // Skip in Expo Go
    if (Constants.appOwnership === "expo") {
      console.log("Push notifications disabled in Expo Go");
      return;
    }

    const _registerDevice = async () => {
      try {
        if (!Device.isDevice) {
          console.log("Push notifications only work on physical devices");
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Push notification permission denied");
          return;
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        console.log("Push token:", token.data);

        // Send token to backend
        await registerPushToken("house_1", token.data);

      } catch (err) {
        console.log("Push notification error:", err.message);
      }
    };

    _registerDevice();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[Push] Tapped:", data);
    });

    return () => sub.remove();
  }, []);
}