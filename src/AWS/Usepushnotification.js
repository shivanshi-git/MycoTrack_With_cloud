import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { registerPushToken } from "./dbService";

// How alerts appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  useEffect(() => {

    // 🚨 Skip push notifications in Expo Go
    if (Constants.appOwnership === "expo") {
      console.log("Push notifications disabled in Expo Go");
      return;
    }

    _registerDevice();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[Push] Tapped:", data);
    });

    return () => sub.remove();
  }, []);
}