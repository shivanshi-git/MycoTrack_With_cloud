/**
 * Settings.js
 * Settings & Data — styled to match MycoTrack dark amber theme
 * Content ported from settings.tsx (Thresholds, Automation, History, Device)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../firebase/firebaseConfig";
import { useRouter } from "expo-router";
import { BottomNav } from "./Dashboard";

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:      "#f9fafb",   // main background (soft white)
  card:    "#ffffff",   // card background
  border:  "#e5e7eb",   // light border
  border2: "#d1d5db",   // slightly stronger border

  amber:   "#d97706",   // primary accent
  amber2:  "#f59e0b",   // highlight accent
  brown:   "#92400e",   // darker accent

  cream:   "#1f2937",   // main text (dark grey)
  cream2:  "#374151",   // secondary text
  cream3:  "#6b7280",   // tertiary text

  muted:   "#9ca3af",   // muted text

  healthy: "#16a34a",   // green
  warning: "#f59e0b",   // amber
  danger:  "#dc2626",   // red
};
// ─── Mock history data ────────────────────────────────────────────────────────

const HISTORY = {
  temperature: {
    daily:   [24, 23, 25, 22, 24, 26, 25],
    weekly:  [22, 23, 24, 22, 23, 24, 25],
    monthly: [22, 23, 24, 25, 23, 24, 26],
  },
  humidity: {
    daily:   [85, 82, 88, 80, 83, 87, 86],
    weekly:  [80, 85, 78, 82, 88, 84, 79],
    monthly: [80, 82, 84, 86, 83, 85, 87],
  },
};

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Bar Sparkline Chart (no SVG) ────────────────────────────────────────────

function BarChart({ data, color, maxVal }) {
  const max = maxVal || Math.max(...data) * 1.1;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 4, marginTop: 10 }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: "100%",
              height: (v / max) * 60,
              backgroundColor: color,
              borderRadius: 3,
              opacity: 0.5 + (i / data.length) * 0.5,
            }}
          />
          <Text style={{ fontSize: 8, color: C.muted }}>{LABELS[i]}</Text>
        </View>
      ))}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Settings() {
  const router = useRouter();
  const [data,       setData]       = useState({});
  const [thresholds, setThresholds] = useState({ tempMin: 20, tempMax: 25, humidityMin: 80, humidityMax: 90, soil: 65, co2: 800 });
  const [automation, setAutomation] = useState({ fan: true, humidifier: true, watering: true, night: false });
  const [mode,       setMode]       = useState("weekly");

  // Firebase
  useEffect(() => {
    if (!db) return;
    const unsub = onValue(ref(db, "/"), (snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setData(d);
        if (d.thresholds) setThresholds(d.thresholds);
        if (d.automation)  setAutomation(d.automation);
      }
    });
    return () => unsub();
  }, []);

  const saveThresholds = () => {
    if (db) set(ref(db, "thresholds"), thresholds);
  };

  const toggleRule = (key) => {
    const updated = { ...automation, [key]: !automation[key] };
    setAutomation(updated);
    if (db) set(ref(db, "automation"), updated);
  };

  const tempData  = HISTORY.temperature[mode];
  const humidData = HISTORY.humidity[mode];

  const modeLabel = mode === "daily" ? "Last 24 hours" : mode === "weekly" ? "Last 7 days" : "Last 30 days";

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
          <Text style={s.psub}>Thresholds, automation & history</Text>

          {/* ── Data History ── */}
          <View style={s.card}>
            <SectionHeader icon="analytics-outline" title="Data History" />

            {/* Mode tabs */}
            <View style={s.tabRow}>
              {["daily", "weekly", "monthly"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.tab, mode === t && s.tabActive]}
                  onPress={() => setMode(t)}
                >
                  <Text style={[s.tabText, mode === t && s.tabTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Temperature chart */}
            <View style={s.chartBox}>
              <View style={s.chartHeader}>
                <View style={s.chartLeft}>
                  <Ionicons name="thermometer-outline" size={12} color={C.amber} />
                  <Text style={s.chartTitle}>Temperature Trend</Text>
                </View>
                <Text style={s.chartSub}>{modeLabel}</Text>
              </View>
              <BarChart data={tempData} color={C.amber} maxVal={30} />
              <View style={s.chartFooter}>
                <Text style={s.chartMin}>Min: {Math.min(...tempData)}°C</Text>
                <Text style={s.chartMax}>Max: {Math.max(...tempData)}°C</Text>
              </View>
            </View>

            {/* Humidity chart */}
            <View style={[s.chartBox, { marginTop: 10 }]}>
              <View style={s.chartHeader}>
                <View style={s.chartLeft}>
                  <Ionicons name="water-outline" size={12} color={C.healthy} />
                  <Text style={s.chartTitle}>Humidity Trend</Text>
                </View>
                <Text style={s.chartSub}>{modeLabel}</Text>
              </View>
              <BarChart data={humidData} color={C.healthy} maxVal={100} />
              <View style={s.chartFooter}>
                <Text style={s.chartMin}>Min: {Math.min(...humidData)}%</Text>
                <Text style={s.chartMax}>Max: {Math.max(...humidData)}%</Text>
              </View>
            </View>
          </View>

          {/* ── Thresholds ── */}
          <View style={s.card}>
            <SectionHeader icon="options-outline" title="Threshold Settings" />

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
            <ThresholdField label="Min (%)"    value={thresholds.soil}        onChange={(v) => setThresholds({ ...thresholds, soil: v })} />

            <Text style={s.groupLabel}>CO₂ Level</Text>
            <ThresholdField label="Max (ppm)"  value={thresholds.co2}         onChange={(v) => setThresholds({ ...thresholds, co2: v })} />

            <TouchableOpacity style={s.saveBtn} onPress={saveThresholds}>
              <Ionicons name="checkmark-outline" size={14} color={C.cream} />
              <Text style={s.saveBtnText}>Save Threshold Settings</Text>
            </TouchableOpacity>
          </View>

          {/* ── Automation ── */}
          <View style={s.card}>
            <SectionHeader icon="flash-outline" title="Automation Rules" />

            {[
              { key: "fan",        label: "Auto fan when temp > 24°C",    icon: "aperture-outline" },
              { key: "humidifier", label: "Auto humidifier when < 80%",   icon: "cloud-outline"    },
              { key: "watering",   label: "Auto watering every 4 hours",  icon: "water-outline"    },
              { key: "night",      label: "Night mode (22:00 – 06:00)",   icon: "moon-outline"     },
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
              { label: "Device ID",        value: data.device?.id       || "MF-001-2026",    color: C.cream2  },
              { label: "Firmware Version", value: data.device?.firmware || "v3.2.1",          color: C.cream2  },
              { label: "WiFi Status",      value: "Connected",                                  color: C.healthy },
              { label: "Last Sync",        value: data.device?.lastSync || "2 min ago",        color: C.cream3  },
              { label: "Uptime",           value: data.device?.uptime   || "15 days 8 hours",  color: C.cream3  },
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
  psub:   { fontSize: 12, color: C.cream3, marginBottom: 14 },

  card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 14, marginBottom: 10 },

  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconBox: { width: 26, height: 26, borderRadius: 7, backgroundColor: C.brown + "55", borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
  sectionTitle:   { fontSize: 14, fontWeight: "600", color: C.cream2 },

  // Tabs
  tabRow:        { flexDirection: "row", gap: 6, marginBottom: 10 },
  tab:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border2 },
  tabActive:     { backgroundColor: C.brown, borderColor: C.amber },
  tabText:       { fontSize: 12, color: C.muted },
  tabTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },

  // Charts
  chartBox:    { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartLeft:   { flexDirection: "row", alignItems: "center", gap: 6 },
  chartTitle:  { fontSize: 12, color: C.cream3, fontWeight: "500" },
  chartSub:    { fontSize: 10, color: C.muted },
  chartFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  chartMin:    { fontSize: 10, color: C.muted },
  chartMax:    { fontSize: 10, color: C.muted },

  // Thresholds
  groupLabel:     { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  fieldRow:       { flexDirection: "row", gap: 8 },
  thresholdField: { flex: 1 },
  thresholdLabel: { fontSize: 10, color: C.muted, marginBottom: 4 },
  thresholdInput: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border2, borderRadius: 8, padding: 10, color: C.cream2, fontSize: 13, fontFamily: "monospace" },

  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.brown, borderWidth: 1, borderColor: C.amber + "55", borderRadius: 9, padding: 12, marginTop: 14 },
  saveBtnText: { color: C.cream, fontSize: 13, fontWeight: "600" },

  // Automation
  autoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  autoLeft:  { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  autoLabel: { fontSize: 13, color: C.muted, flex: 1 },

  // Device
  deviceRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  deviceLabel: { fontSize: 12, color: C.muted },
  deviceValue: { fontSize: 12, fontWeight: "500", fontFamily: "monospace" },

  // Action buttons
  actionRow:    { flexDirection: "row", gap: 8 },
  actionBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 10, paddingVertical: 12 },
  actionBtnText:{ fontSize: 12, color: C.cream3, fontWeight: "500" },
});