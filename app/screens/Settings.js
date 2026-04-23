/**
 * Settings.js
 * Settings & Data — MycoTrack dark amber theme
 * Live sensor history + synced thresholds
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getSettings, saveThresholds, saveAutomation } from "../../src/AWS/dbService";
import { useRouter } from "expo-router";
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

// ─── AWS API ──────────────────────────────────────────────────────────────────

const API_URL = "https://lvcnlqo6wa.execute-api.ap-south-1.amazonaws.com/prod/sensordata";

// Max history points to keep per sensor
const MAX_HISTORY = 20;

const LABELS_SHORT = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                      "11","12","13","14","15","16","17","18","19","20"];

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, color, maxVal, minVal }) {
  if (!data || data.length === 0) {
    return (
      <View style={{ height: 60, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 11, color: C.muted }}>No data yet</Text>
      </View>
    );
  }

  const displayData = data.slice(-7); // show last 7 points
  const max = maxVal || Math.max(...displayData) * 1.1 || 1;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 4, marginTop: 10 }}>
      {displayData.map((v, i) => {
        const barH = Math.max(4, (v / max) * 60);
        const isHigh = maxVal && v > maxVal;
        const isLow  = minVal && v < minVal;
        const barColor = isHigh || isLow ? C.danger : color;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <View style={{
              width: "100%",
              height: barH,
              backgroundColor: barColor,
              borderRadius: 3,
              opacity: 0.5 + (i / displayData.length) * 0.5,
            }} />
            <Text style={{ fontSize: 8, color: C.muted }}>{i + 1}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconBox}>
        <Ionicons name={icon} size={14} color={C.amber} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Threshold Input Row ──────────────────────────────────────────────────────

function ThresholdField({ label, value, onChange }) {
  return (
    <View style={s.thresholdField}>
      <Text style={s.thresholdLabel}>{label}</Text>
      <TextInput
        style={s.thresholdInput}
        value={String(value ?? "")}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor={C.muted}
      />
    </View>
  );
}

// ─── Live Value Badge ─────────────────────────────────────────────────────────

function LiveBadge({ value, unit, threshMin, threshMax }) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const isHigh = threshMax && value > threshMax;
  const isLow  = threshMin && value < threshMin;
  const color  = isHigh || isLow ? C.danger : C.healthy;
  return (
    <View style={[s.liveBadge, { borderColor: color + "55", backgroundColor: color + "11" }]}>
      <View style={[s.liveDot, { backgroundColor: color }]} />
      <Text style={[s.liveText, { color }]}>
        {value}{unit}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Settings() {
  const router = useRouter();

  const [deviceInfo, setDeviceInfo] = useState({});
  const [thresholds, setThresholds] = useState({
    tempMin: 18, tempMax: 28,
    humidityMin: 75, humidityMax: 95,
    soil: 60, co2: 900,
  });
  const [automation, setAutomation] = useState({
    fan: true, humidifier: true, watering: true, night: false,
  });
  const [saving, setSaving] = useState(false);

  // ── Live sensor history ──
  const [liveHistory, setLiveHistory] = useState({
    temperature: [],
    humidity:    [],
    soil:        [],
    co2:         [],
  });
  const [liveNow, setLiveNow]     = useState({});
  const [isOnline, setIsOnline]   = useState(false);
  const [lastSync, setLastSync]   = useState("--");

  // ── Fetch settings from DynamoDB on mount ─────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings("house_1");
        if (data?.thresholds) setThresholds(data.thresholds);
        if (data?.automation) setAutomation(data.automation);
        if (data?.device)     setDeviceInfo(data.device);
      } catch (err) {
        console.warn("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // ── Poll live sensor data and build history ────────────────────────────────
  useEffect(() => {
    const fetchSensor = async () => {
      try {
        const response = await fetch(API_URL);
        const json     = await response.json();
        const data     = typeof json.body === "string" ? JSON.parse(json.body) : json.body;

        const temp = parseFloat(data?.temperature ?? NaN);
        const hum  = parseFloat(data?.humidity    ?? NaN);
        const soil = parseFloat(data?.soil        ?? NaN);
        const co2  = parseFloat(data?.co2         ?? NaN);

        setLiveNow({ temperature: temp, humidity: hum, soil, co2 });

        setLiveHistory((prev) => ({
          temperature: isNaN(temp) ? prev.temperature : [...prev.temperature.slice(-(MAX_HISTORY - 1)), Math.round(temp * 10) / 10],
          humidity:    isNaN(hum)  ? prev.humidity    : [...prev.humidity.slice(-(MAX_HISTORY - 1)),    Math.round(hum  * 10) / 10],
          soil:        isNaN(soil) ? prev.soil        : [...prev.soil.slice(-(MAX_HISTORY - 1)),        Math.round(soil)],
          co2:         isNaN(co2)  ? prev.co2         : [...prev.co2.slice(-(MAX_HISTORY - 1)),         Math.round(co2)],
        }));

        setIsOnline(true);
        setLastSync(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch (err) {
        setIsOnline(false);
        console.warn("Live sensor fetch error:", err);
      }
    };

    fetchSensor();
    const interval = setInterval(fetchSensor, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Save thresholds ────────────────────────────────────────────────────────
  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      await saveThresholds("house_1", thresholds);
      Alert.alert("Saved", "Thresholds saved successfully.");
    } catch (err) {
      Alert.alert("Error", "Failed to save thresholds: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle automation rule ─────────────────────────────────────────────────
  const toggleRule = async (key) => {
    const updated = { ...automation, [key]: !automation[key] };
    setAutomation(updated);
    try {
      await saveAutomation("house_1", updated);
    } catch (err) {
      console.warn("Failed to update automation rule:", err);
    }
  };

  const charts = [
    {
      key:      "temperature",
      label:    "Temperature",
      icon:     "thermometer-outline",
      color:    C.amber,
      unit:     "°C",
      threshMin: thresholds.tempMin,
      threshMax: thresholds.tempMax,
      maxVal:   40,
    },
    {
      key:      "humidity",
      label:    "Humidity",
      icon:     "water-outline",
      color:    C.healthy,
      unit:     "%",
      threshMin: thresholds.humidityMin,
      threshMax: thresholds.humidityMax,
      maxVal:   100,
    },
    {
      key:      "soil",
      label:    "Soil Moisture",
      icon:     "leaf-outline",
      color:    "#16a34a",
      unit:     "%",
      threshMin: thresholds.soil,
      threshMax: null,
      maxVal:   100,
    },
    {
      key:      "co2",
      label:    "CO₂ Level",
      icon:     "cloud-outline",
      color:    C.cream3,
      unit:     " ppm",
      threshMin: null,
      threshMax: thresholds.co2,
      maxVal:   1500,
    },
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Text style={s.ptag}>CONFIGURATION</Text>
          <Text style={s.ptitle}>Settings</Text>
          <Text style={[s.psub, { color: isOnline ? C.healthy : C.danger }]}>
            {isOnline ? `Live • Updated ${lastSync}` : "Offline — last known data"}
          </Text>

          {/* ── Live Data History ── */}
          <View style={s.card}>
            <SectionHeader icon="analytics-outline" title="Live Sensor History" />
            <Text style={s.historyNote}>
              Showing last {MAX_HISTORY} readings • 5s interval • Red bars = threshold breach
            </Text>

            {charts.map((c, idx) => {
              const data = liveHistory[c.key];
              const current = liveNow[c.key];
              return (
                <View key={c.key} style={[s.chartBox, idx > 0 && { marginTop: 10 }]}>
                  <View style={s.chartHeader}>
                    <View style={s.chartLeft}>
                      <Ionicons name={c.icon} size={12} color={c.color} />
                      <Text style={s.chartTitle}>{c.label}</Text>
                    </View>
                    <LiveBadge
                      value={isNaN(current) ? null : current}
                      unit={c.unit}
                      threshMin={c.threshMin}
                      threshMax={c.threshMax}
                    />
                  </View>
                  <BarChart
                    data={data}
                    color={c.color}
                    maxVal={c.maxVal}
                    minVal={c.threshMin}
                  />
                  {data.length > 0 && (
                    <View style={s.chartFooter}>
                      <Text style={s.chartMin}>
                        Min: {Math.min(...data)}{c.unit}
                      </Text>
                      <Text style={s.chartMax}>
                        Max: {Math.max(...data)}{c.unit}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Thresholds ── */}
          <View style={s.card}>
            <SectionHeader icon="options-outline" title="Threshold Settings" />
            <Text style={s.historyNote}>
              These thresholds are used by Alerts page to detect breaches in real time.
            </Text>

            <Text style={s.groupLabel}>Temperature Range</Text>
            <View style={s.fieldRow}>
              <ThresholdField label="Min (°C)" value={thresholds.tempMin}     onChange={(v) => setThresholds({ ...thresholds, tempMin: v })} />
              <ThresholdField label="Max (°C)" value={thresholds.tempMax}     onChange={(v) => setThresholds({ ...thresholds, tempMax: v })} />
            </View>

            <Text style={s.groupLabel}>Humidity Range</Text>
            <View style={s.fieldRow}>
              <ThresholdField label="Min (%)"  value={thresholds.humidityMin} onChange={(v) => setThresholds({ ...thresholds, humidityMin: v })} />
              <ThresholdField label="Max (%)"  value={thresholds.humidityMax} onChange={(v) => setThresholds({ ...thresholds, humidityMax: v })} />
            </View>

            <Text style={s.groupLabel}>Soil Moisture</Text>
            <ThresholdField label="Min (%)"   value={thresholds.soil}         onChange={(v) => setThresholds({ ...thresholds, soil: v })} />

            <Text style={s.groupLabel}>CO₂ Level</Text>
            <ThresholdField label="Max (ppm)" value={thresholds.co2}          onChange={(v) => setThresholds({ ...thresholds, co2: v })} />

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveThresholds} disabled={saving}>
              <Ionicons name="checkmark-outline" size={14} color={C.cream} />
              <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Threshold Settings"}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Automation ── */}
          <View style={s.card}>
            <SectionHeader icon="flash-outline" title="Automation Rules" />

            {[
              { key: "fan",        label: "Auto fan when CO₂ or humidity high", icon: "aperture-outline" },
              { key: "humidifier", label: "Auto humidifier when humidity < min", icon: "cloud-outline"    },
              { key: "watering",   label: "Auto motor when soil moisture < min", icon: "water-outline"    },
              { key: "night",      label: "Night mode (22:00 – 06:00)",          icon: "moon-outline"     },
            ].map(({ key, label, icon }) => (
              <View key={key} style={s.autoRow}>
                <View style={s.autoLeft}>
                  <Ionicons name={icon} size={13} color={automation[key] ? C.amber : C.muted} />
                  <Text style={[s.autoLabel, automation[key] && { color: C.cream2 }]}>{label}</Text>
                </View>
                <Switch
                  value={!!automation[key]}
                  onValueChange={() => toggleRule(key)}
                  trackColor={{ false: C.border2, true: C.brown }}
                  thumbColor={automation[key] ? C.amber2 : C.muted}
                />
              </View>
            ))}
          </View>

          {/* ── Device Info ── */}
          <View style={s.card}>
            <SectionHeader icon="hardware-chip-outline" title="Device Information" />

            {[
              { label: "Device ID",        value: deviceInfo.id       || "MF-001-2026",    color: C.cream2  },
              { label: "Firmware Version", value: deviceInfo.firmware || "v3.2.1",          color: C.cream2  },
              { label: "WiFi Status",      value: isOnline ? "Connected" : "Offline",        color: isOnline ? C.healthy : C.danger },
              { label: "Last Sync",        value: lastSync,                                   color: C.cream3  },
              { label: "Uptime",           value: deviceInfo.uptime   || "15 days 8 hours",  color: C.cream3  },
            ].map(({ label, value, color }) => (
              <View key={label} style={s.deviceRow}>
                <Text style={s.deviceLabel}>{label}</Text>
                <Text style={[s.deviceValue, { color }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* ── Action Buttons ── */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn}>
              <Ionicons name="download-outline" size={14} color={C.amber} />
              <Text style={s.actionBtnText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn}>
              <Ionicons name="document-text-outline" size={14} color={C.amber} />
              <Text style={s.actionBtnText}>System Log</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      <BottomNav active="settings" router={router} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

  ptag:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub:   { fontSize: 12, marginBottom: 14 },

  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 14, marginBottom: 10 },

  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionIconBox: { width: 26, height: 26, borderRadius: 7, backgroundColor: C.brown + "55", borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
  sectionTitle:   { fontSize: 14, fontWeight: "600", color: C.cream2 },

  historyNote: { fontSize: 10, color: C.muted, marginBottom: 10, lineHeight: 14 },

  chartBox:    { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartLeft:   { flexDirection: "row", alignItems: "center", gap: 6 },
  chartTitle:  { fontSize: 12, color: C.cream3, fontWeight: "500" },
  chartFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  chartMin:    { fontSize: 10, color: C.muted },
  chartMax:    { fontSize: 10, color: C.muted },

  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  liveDot:   { width: 5, height: 5, borderRadius: 3 },
  liveText:  { fontSize: 11, fontWeight: "600" },

  groupLabel:     { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  fieldRow:       { flexDirection: "row", gap: 8 },
  thresholdField: { flex: 1 },
  thresholdLabel: { fontSize: 10, color: C.muted, marginBottom: 4 },
  thresholdInput: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border2, borderRadius: 8, padding: 10, color: C.cream2, fontSize: 13, fontFamily: "monospace" },

  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.brown, borderWidth: 1, borderColor: C.amber + "55", borderRadius: 9, padding: 12, marginTop: 14 },
  saveBtnText: { color: C.cream, fontSize: 13, fontWeight: "600" },

  autoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  autoLeft:  { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  autoLabel: { fontSize: 13, color: C.muted, flex: 1 },

  deviceRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  deviceLabel: { fontSize: 12, color: C.muted },
  deviceValue: { fontSize: 12, fontWeight: "500", fontFamily: "monospace" },

  actionRow:     { flexDirection: "row", gap: 8 },
  actionBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 10, paddingVertical: 12 },
  actionBtnText: { fontSize: 12, color: C.cream3, fontWeight: "500" },
});