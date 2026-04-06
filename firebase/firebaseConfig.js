import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXJlupPEnL9B_alze4mVo5sn1qU5ZpehY",
  authDomain: "mycotrack-9cc24.firebaseapp.com",
  projectId: "mycotrack-9cc24",
  storageBucket: "mycotrack-9cc24.firebasestorage.app",
  messagingSenderId: "524337915828",
  appId: "1:524337915828:android:504abb13b0c49bb88e74e1",
  measurementId: "G-EGNVRW3Q15",
  // ← THIS WAS MISSING — required for Realtime Database
  databaseURL:"https://mycotrack-9cc24-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

export const firebaseStorage = getStorage(app);   // for image uploads
export const database = getDatabase(app);         // for /captures, /alerts, /triggers