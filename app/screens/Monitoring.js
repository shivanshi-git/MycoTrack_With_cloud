import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomNav } from "../screens/Dashboard";

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:      "#f9fafb",
  card:    "#ffffff",
  border:  "#e5e7eb",
  border2: "#d1d5db",
  amber:   "#d97706",
  amber2:  "#f59e0b",
  brown:   "#92400e",
  cream:   "#1f2937",
  cream2:  "#374151",
  cream3:  "#6b7280",
  muted:   "#9ca3af",
  healthy: "#16a34a",
  warning: "#f59e0b",
  danger:  "#dc2626",
};

// ─── AWS API CALL ─────────────────────────────────────────────────────────────
const API_URL = "https://lvcnlqo6wa.execute-api.ap-south-1.amazonaws.com/prod/control";

const sendCommand = async (topic, message) => {
  console.log("📤 Sending command:", { topic, message });
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, message }),
    });
    console.log("✅ Response status:", response.status);
    console.log("✅ Response body:", await response.text());
  } catch (err) {
    console.log("❌ AWS control error:", err.message);
  }
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const saveLocal = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log("Storage save error:", e);
  }
};

const loadLocal = async (key) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val != null ? JSON.parse(val) : null;
  } catch (e) {
    console.log("Storage load error:", e);
    return null;
  }
};

// ─── ACTUATOR CARD ────────────────────────────────────────────────────────────
function ActuatorCard({ icon, title, subtitle, value, onToggle, mode, onModeToggle, disabled }) {
  const isOn = value;
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.left}>
          <Ionicons name={icon} size={18} color={isOn ? C.amber2 : C.muted} />
          <View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.sub}>{subtitle}</Text>
          </View>
        </View>
        <Switch value={isOn} onValueChange={onToggle} disabled={disabled} />
      </View>

      <View style={s.divider} />

      <View style={s.row}>
        <Text style={{ color: isOn ? C.healthy : C.muted }}>
          {isOn ? "ON" : "OFF"}
        </Text>
        <TouchableOpacity onPress={onModeToggle}>
          <Text style={{ color: C.amber2 }}>Mode: {mode}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function Monitoring() {
  const router = useRouter();

  const [master, setMaster] = useState(true);
  const [fan, setFan]       = useState(false);
  const [motor, setMotor]   = useState(false);
  const [fanMode, setFanMode]     = useState("Auto");
  const [motorMode, setMotorMode] = useState("Auto");

  const pendingRef = useRef(false);

  // ─── On mount: load saved state first, then start polling ──────────────────
  useEffect(() => {
    let interval;

    const init = async () => {
      // 1. Restore last known state from local storage immediately
      const savedFan    = await loadLocal("actuator_fan");
      const savedMotor  = await loadLocal("actuator_motor");
      const savedMaster = await loadLocal("actuator_master");

      if (savedFan    !== null) setFan(savedFan);
      if (savedMotor  !== null) setMotor(savedMotor);
      if (savedMaster !== null) setMaster(savedMaster);

      // 2. Then start polling — but only overwrite if NOT pending
      const fetchData = async () => {
        if (pendingRef.current) return;
        try {
          const data = await getSettings("house_1");
          const newFan    = data.actuators?.fan    ?? false;
          const newMotor  = data.actuators?.motor  ?? false;
          const newMaster = data.mode === "auto";

          setFan(newFan);
          setMotor(newMotor);
          setMaster(newMaster);

          // Keep local storage in sync with server
          await saveLocal("actuator_fan",    newFan);
          await saveLocal("actuator_motor",  newMotor);
          await saveLocal("actuator_master", newMaster);
        } catch (err) {
          console.log(err);
        }
      };

      fetchData();
      interval = setInterval(fetchData, 3000);
    };

    init();
    return () => clearInterval(interval);
  }, []);

  // ─── MASTER MODE ──────────────────────────────────────────────────────────
  const toggleMaster = async (val) => {
    setMaster(val);
    await saveLocal("actuator_master", val);
    await sendCommand("Tanvi/esp32/mode", val ? "auto" : "manual");
  };

  // ─── FAN CONTROL ──────────────────────────────────────────────────────────
  const toggleFan = async (val) => {
    if (master) return;

    pendingRef.current = true;
    setFan(val);
    await saveLocal("actuator_fan", val);

    await sendCommand("Tanvi/esp32/control", val ? "FAN_ON" : "FAN_OFF");

    setTimeout(() => { pendingRef.current = false; }, 5000);
  };

  // ─── MOTOR CONTROL ────────────────────────────────────────────────────────
  const toggleMotor = async (val) => {
    if (master) return;

    pendingRef.current = true;
    setMotor(val);
    await saveLocal("actuator_motor", val);

    await sendCommand("Tanvi/esp32/control", val ? "MOTOR_ON" : "MOTOR_OFF");

    setTimeout(() => { pendingRef.current = false; }, 5000);
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        <Text style={s.titleMain}>Actuators</Text>

        {/* MASTER MODE */}
        <View style={s.card}>
          <Text>Auto / Manual Mode</Text>
          <Switch value={master} onValueChange={toggleMaster} />
          <Text style={{ fontSize: 12, marginTop: 5, color: C.muted }}>
            {master ? "AUTO MODE (ESP controls)" : "MANUAL MODE (App controls)"}
          </Text>
        </View>

        {/* FAN */}
        <ActuatorCard
          icon="aperture-outline"
          title="Fan"
          subtitle="5V DC"
          value={fan}
          onToggle={toggleFan}
          mode={fanMode}
          onModeToggle={() => setFanMode(fanMode === "Auto" ? "Manual" : "Auto")}
          disabled={master}
        />

        {/* MOTOR */}
        <ActuatorCard
          icon="water-outline"
          title="Motor"
          subtitle="12V DC Pump"
          value={motor}
          onToggle={toggleMotor}
          mode={motorMode}
          onModeToggle={() => setMotorMode(motorMode === "Auto" ? "Manual" : "Auto")}
          disabled={master}
        />

      </ScrollView>

      <BottomNav active="monitoring" router={router} />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { padding: 15 },

  titleMain: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  title:   { fontWeight: "600" },
  sub:     { fontSize: 12, color: C.muted },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },
});
