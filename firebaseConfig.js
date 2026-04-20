import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replace all values below with your Firebase project credentials
// Firebase Console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
    apiKey: "AIzaSyDqVPhgVkdDyqJ4HOuW6eUR7Gu7qAGz5Bw",
    authDomain: "mushroomfarm-bb044.firebaseapp.com",
    databaseURL: "https://mushroomfarm-bb044-default-rtdb.firebaseio.com",
    projectId: "mushroomfarm-bb044",
    storageBucket: "mushroomfarm-bb044.firebasestorage.app",
    messagingSenderId: "933576780474",
    appId: "1:933576780474:web:189eff7b2eeabad5b03083",
    measurementId: "G-KYFC9H2V4P"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ─── Firebase Realtime DB structure ───────────────────────────────────────────
//
// mushroom_farm/
//   house_1/
//     status:      "online"            ← ESP32 sets this
//     lastUpdated:  1700000000000      ← Unix ms timestamp
//     sensors/
//       temperature/
//         value:   23                  ← current reading (float)
//         unit:    "°C"
//         status:  "normal"            ← "normal" | "warning" | "danger"
//         history: [22,22.5,23,...]    ← last 24 readings (array)
//       humidity/   { value, unit, status, history }
//       soilMoisture/ { value, unit, status, history }
//       co2/          { value, unit, status, history }