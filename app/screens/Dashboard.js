/**
 * Dashboard.js
 * Mushroom Farm Dashboard — styled to match MycoTrack dark amber theme
 * Connected to AWS IoT via API Gateway
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// ─── AWS API ──────────────────────────────────────────────────────────────────

const API_URL = "https://lvcnlqo6wa.execute-api.ap-south-1.amazonaws.com/prod/sensordata";

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

// ─── Sensor Ranges ────────────────────────────────────────────────────────────

const SENSOR_RANGES = {
  temperature: { min: 18, max: 28 },
  humidity:    { min: 75, max: 95 },
  soil:        { min: 60, max: 85 },
  co2:         { min: 500, max: 900 },
};

function deriveStatus(key, value) {
  const range = SENSOR_RANGES[key];
  if (!range) return "normal";
  const { min, max } = range;
  const span = max - min;
  if (value < min + span * 0.1 || value > max - span * 0.1) return "danger";
  if (value < min + span * 0.2 || value > max - span * 0.2) return "warning";
  return "normal";
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = C.amber }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 32, gap: 2 }}>
      {data.map((v, i) => {
        const barH = Math.max(4, ((v - min) / range) * 32);
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: barH,
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0.4 + (i / data.length) * 0.6,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    normal:  { color: C.healthy, label: "Normal"  },
    warning: { color: C.warning, label: "Warning" },
    danger:  { color: C.danger,  label: "Danger"  },
  };
  const cfg = map[status] || { color: C.muted, label: status };
  return (
    <View style={[s.badge, { borderColor: cfg.color + "55", backgroundColor: cfg.color + "18" }]}>
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────

function SensorCard({ data }) {
  const { value, unit, status, icon, label, history } = data;
  const sparkColor = status === "warning" ? C.warning : status === "danger" ? C.danger : C.amber;
  return (
    <View style={s.card}>
      <View style={s.sensorHeader}>
        <View style={s.sensorLeft}>
          <View style={s.iconBox}>
            <Ionicons name={icon} size={18} color={C.amber} />
          </View>
          <View>
            <Text style={s.sensorLabel}>{label}</Text>
            <Text style={s.sensorValue}>
              {value !== null && value !== undefined ? `${value}${unit}` : "—"}
            </Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={{ marginVertical: 6 }}>
        <Sparkline data={history} color={sparkColor} />
      </View>
      <Text style={s.timeLabel}>Live from AWS IoT</Text>
    </View>
  );
}

// ─── Actuator Card ────────────────────────────────────────────────────────────

function ActuatorCard({ label, status, icon }) {
  const isOn = status === "ON";
  return (
    <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: isOn ? C.healthy : C.danger }]}>
      <View style={s.statusRow}>
        <View style={s.sensorLeft}>
          <View style={s.iconBox}>
            <Ionicons name={icon} size={18} color={isOn ? C.healthy : C.danger} />
          </View>
          <Text style={s.sensorLabel}>{label}</Text>
        </View>
        <View style={[s.badge, { borderColor: (isOn ? C.healthy : C.danger) + "55", backgroundColor: (isOn ? C.healthy : C.danger) + "18" }]}>
          <Text style={[s.badgeText, { color: isOn ? C.healthy : C.danger }]}>
            {status || "--"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

export function BottomNav({ active, router }) {
  const items = [
    { key: "dashboard",  icon: "home-outline",        label: "Dashboard",  route: "/screens/Dashboard"  },
    { key: "monitoring", icon: "pulse-outline",        label: "Monitoring", route: "/screens/Monitoring" },
    { key: "camera",     icon: "camera-outline",       label: null,         route: "/screens/CameraAI"   },
    { key: "alerts",     icon: "alert-circle-outline", label: "Alerts",     route: "/screens/Alerts"     },
    { key: "settings",   icon: "settings-outline",     label: "Settings",   route: "/screens/Settings"   },
  ];
  return (
    <View style={s.bnav}>
      {items.map((item) => {
        if (item.key === "camera") {
          return (
            <View key="camera" style={s.ncw}>
              <TouchableOpacity onPress={() => router.push(item.route)}>
                <LinearGradient
                  colors={[C.brown, C.amber]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[s.ncb, active === "camera" && { borderColor: C.amber2 }]}
                >
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <TouchableOpacity key={item.key} style={s.ni} onPress={() => router.push(item.route)}>
            <Ionicons name={item.icon} size={18} color={active === item.key ? C.amber2 : C.muted} />
            <Text style={[s.nl, active === item.key && { color: C.amber2 }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState("--");
  const [isOnline, setIsOnline]     = useState(false);

  const [sensors, setSensors] = useState({
    temperature: { value: null, unit: "°C",   status: "normal", icon: "thermometer-outline", label: "Temperature",   history: [] },
    humidity:    { value: null, unit: "%",    status: "normal", icon: "water-outline",       label: "Humidity",      history: [] },
    soil:        { value: null, unit: "%",    status: "normal", icon: "leaf-outline",        label: "Soil Moisture", history: [] },
    co2:         { value: null, unit: " ppm", status: "normal", icon: "cloud-outline",       label: "CO₂ Level",     history: [] },
  });

  const [actuators, setActuators] = useState({ fan: "--", motor: "--" });

  // ── Fetch — flat API response: { temperature, humidity, soil, co2, fan, motor }
  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch(API_URL);
      const json = await response.json();
      const data = typeof json.body === "string" ? JSON.parse(json.body) : json.body;

      const temp  = parseFloat(data?.temperature ?? null);
      const hum   = parseFloat(data?.humidity    ?? null);
      const soil  = parseFloat(data?.soil        ?? null);
      const co2   = parseFloat(data?.co2         ?? null);
      const fan   = data?.fan   || "--";
      const motor = data?.motor || "--";

      setSensors((prev) => ({
        temperature: {
          ...prev.temperature,
          value:   isNaN(temp) ? null : Math.round(temp * 10) / 10,
          status:  deriveStatus("temperature", temp),
          history: [...prev.temperature.history.slice(-11), temp],
        },
        humidity: {
          ...prev.humidity,
          value:   isNaN(hum) ? null : Math.round(hum * 10) / 10,
          status:  deriveStatus("humidity", hum),
          history: [...prev.humidity.history.slice(-11), hum],
        },
        soil: {
          ...prev.soil,
          value:   isNaN(soil) ? null : Math.round(soil),
          status:  deriveStatus("soil", soil),
          history: [...prev.soil.history.slice(-11), soil],
        },
        co2: {
          ...prev.co2,
          value:   isNaN(co2) ? null : Math.round(co2),
          status:  deriveStatus("co2", co2),
          history: [...prev.co2.history.slice(-11), co2],
        },
      }));

      setActuators({ fan, motor });
      setIsOnline(true);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err) {
      setError("Failed to fetch data");
      setIsOnline(false);
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={C.amber} />
        <Text style={[s.timeLabel, { marginTop: 12 }]}>Connecting to AWS IoT...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.amber} />
          }
        >
          {/* ── Header ── */}
          <Text style={s.ptag}>OVERVIEW</Text>
          <Text style={s.ptitle}>Dashboard</Text>
          <Text style={s.psub}>Real-time monitoring • House #1</Text>

          {/* ── Error ── */}
          {error && (
            <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: C.danger }]}>
              <Text style={{ color: C.danger, fontSize: 12 }}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── System Status ── */}
          <View style={s.card}>
            <View style={s.statusRow}>
              <View>
                <Text style={s.slbl}>SYSTEM STATUS</Text>
                <Text style={s.timeLabel}>Last updated: {lastUpdated}</Text>
              </View>
              <View style={s.statusRight}>
                <View style={[s.statusDot, { backgroundColor: isOnline ? C.healthy : C.danger }]} />
                <Text style={[s.statusText, { color: isOnline ? C.healthy : C.danger }]}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Sensor Cards ── */}
          <Text style={s.sectionLabel}>SENSORS</Text>
          {Object.entries(sensors).map(([key, data]) => (
            <SensorCard key={key} data={data} />
          ))}

          {/* ── Actuator Cards ── */}
          <Text style={s.sectionLabel}>ACTUATORS</Text>
          <ActuatorCard label="Fan"         status={actuators.fan}   icon="aperture-outline" />
          <ActuatorCard label="Water Motor" status={actuators.motor} icon="water-outline"    />

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
      <BottomNav active="dashboard" router={router} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

  ptag:         { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle:       { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub:         { fontSize: 12, color: C.cream3, marginBottom: 14 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 6, marginTop: 10, textTransform: "uppercase" },

  card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
  slbl:      { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", textTransform: "uppercase" },
  timeLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

  statusRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontSize: 12, fontWeight: "600" },

  sensorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sensorLeft:   { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox:      { width: 36, height: 36, borderRadius: 9, backgroundColor: C.brown + "66", borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
  sensorLabel:  { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  sensorValue:  { fontSize: 22, fontWeight: "700", color: C.cream, marginTop: 1 },

  badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "600" },

  bnav: { flexDirection: "row", backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border2, paddingTop: 8, paddingBottom: 12 },
  ni:   { flex: 1, alignItems: "center", gap: 2 },
  nl:   { fontSize: 8, color: C.muted, letterSpacing: 0.3 },
  ncw:  { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -16 },
  ncb:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.bg },
});