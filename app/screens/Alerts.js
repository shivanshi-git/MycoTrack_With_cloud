/**
 * Alerts.js
 * Alerts & Notifications — live synced with Dashboard sensor data
 */

import React, { useState, useEffect } from "react";
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

// ─── Sensor Ranges (same as Dashboard) ───────────────────────────────────────

const SENSOR_RANGES = {
  temperature: { min: 18, max: 28,  unit: "°C",   label: "Temperature" },
  humidity:    { min: 75, max: 95,  unit: "%",    label: "Humidity"    },
  soil:        { min: 60, max: 85,  unit: "%",    label: "Soil Moisture" },
  co2:         { min: 500, max: 900, unit: " ppm", label: "CO₂ Level"  },
};

// ─── Generate alerts from live sensor values ──────────────────────────────────

function generateAlerts(sensorData, actuatorData, readIds) {
  const alerts = [];
  const now = new Date();

  // ── Environmental alerts from sensor thresholds ──
  Object.entries(SENSOR_RANGES).forEach(([key, range]) => {
    const value = sensorData[key];
    if (value === null || value === undefined || isNaN(value)) return;

    const { min, max, unit, label } = range;
    const span = max - min;

    let severity = null;
    let description = "";

    if (value > max) {
      severity = value > max + span * 0.1 ? "critical" : "warning";
      description = `${label} is ${value}${unit} — above max threshold of ${max}${unit}.`;
    } else if (value < min) {
      severity = value < min - span * 0.1 ? "critical" : "warning";
      description = `${label} is ${value}${unit} — below min threshold of ${min}${unit}.`;
    } else if (value > max - span * 0.2) {
      severity = "warning";
      description = `${label} is ${value}${unit} — approaching upper limit of ${max}${unit}.`;
    } else if (value < min + span * 0.2) {
      severity = "warning";
      description = `${label} is ${value}${unit} — approaching lower limit of ${min}${unit}.`;
    }

    if (severity) {
      const id = `env_${key}`;
      alerts.push({
        id,
        title: severity === "critical" ? `Critical: ${label}` : `High ${label}`,
        description,
        category: "Environmental",
        severity,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: readIds.includes(id),
      });
    }
  });

  // ── System alerts from actuator states ──
  if (actuatorData.fan === "ON") {
    const id = "sys_fan";
    alerts.push({
      id,
      title: "Fan Activated",
      description: "Fan is currently running. CO₂ or humidity may be elevated.",
      category: "System",
      severity: "info",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: readIds.includes(id),
    });
  }

  if (actuatorData.motor === "ON") {
    const id = "sys_motor";
    alerts.push({
      id,
      title: "Motor Activated",
      description: "Water motor is running. Soil moisture may be low.",
      category: "System",
      severity: "info",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: readIds.includes(id),
    });
  }

  // Sort: unread first, then critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return alerts;
}

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY = {
  critical: { color: C.danger,  icon: "alert-circle"     },
  warning:  { color: C.warning, icon: "warning-outline"   },
  info:     { color: C.healthy, icon: "checkmark-circle"  },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onMarkRead }) {
  const sev      = SEVERITY[alert.severity] || SEVERITY.info;
  const isUnread = !alert.read;

  return (
    <View style={[
      s.alertCard,
      isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 },
    ]}>
      <View style={s.alertHeader}>
        <View style={s.alertLeft}>
          <View style={[s.alertIcon, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
            <Ionicons name={sev.icon} size={14} color={sev.color} />
          </View>
          <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]}>
            {alert.title}
          </Text>
        </View>
        <Text style={s.alertTime}>{alert.time}</Text>
      </View>

      <Text style={s.alertDesc}>{alert.description}</Text>

      <View style={s.alertFooter}>
        <View style={[s.catBadge, {
          borderColor: sev.color + "55",
          backgroundColor: sev.color + "11",
        }]}>
          <Text style={[s.catBadgeText, { color: sev.color }]}>{alert.category}</Text>
        </View>
        {isUnread && (
          <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
            <Text style={s.markRead}>Mark as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── No Alerts State ─────────────────────────────────────────────────────────

function AllClear() {
  return (
    <View style={s.empty}>
      <Ionicons name="checkmark-circle-outline" size={40} color={C.healthy} style={{ opacity: 0.6 }} />
      <Text style={[s.emptyText, { color: C.healthy, fontWeight: "600" }]}>All Clear</Text>
      <Text style={s.emptyText}>All sensor values are within safe range</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Alerts() {
  const router = useRouter();

  const [alerts,       setAlerts]       = useState([]);
  const [readIds,      setReadIds]      = useState([]);   // persists "read" across polls
  const [activeFilter, setActiveFilter] = useState("All");
  const [pushEnabled,  setPushEnabled]  = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState("--");
  const [isOnline,     setIsOnline]     = useState(false);

  // ─── Fetch live sensor data and build alerts ────────────────────────────────
  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const response = await fetch(API_URL);
        const json     = await response.json();
        const data     = typeof json.body === "string" ? JSON.parse(json.body) : json.body;

        const sensorData = {
          temperature: parseFloat(data?.temperature ?? NaN),
          humidity:    parseFloat(data?.humidity    ?? NaN),
          soil:        parseFloat(data?.soil        ?? NaN),
          co2:         parseFloat(data?.co2         ?? NaN),
        };

        const actuatorData = {
          fan:   data?.fan   || "OFF",
          motor: data?.motor || "OFF",
        };

        const generated = generateAlerts(sensorData, actuatorData, readIds);
        setAlerts(generated);
        setIsOnline(true);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch (err) {
        console.warn("Failed to fetch sensor data for alerts:", err);
        setIsOnline(false);
      }
    };

    fetchAndBuild();
    const interval = setInterval(fetchAndBuild, 5000); // same cadence as Dashboard
    return () => clearInterval(interval);
  }, [readIds]); // re-run if readIds changes so "read" state is preserved

  // ─── Mark as read (local only — alerts are live-generated) ─────────────────
  const handleMarkRead = (id) => {
    setReadIds((prev) => [...prev, id]);
  };

  const filters = ["All", "Environmental", "System"];
  const filtered = activeFilter === "All"
    ? alerts
    : alerts.filter((a) => a.category === activeFilter);

  const unreadCount   = alerts.filter((a) => !a.read).length;
  const warningCount  = alerts.filter((a) => a.severity === "warning").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Text style={s.ptag}>NOTIFICATIONS</Text>
          <Text style={s.ptitle}>Alerts</Text>
          <Text style={[s.psub, { color: isOnline ? C.healthy : C.danger }]}>
            {isOnline ? `Live • Updated ${lastUpdated}` : "Offline — last known data"}
          </Text>

          {/* ── Summary Cards ── */}
          <View style={s.summaryRow}>
            {[
              { label: "Unread",   value: unreadCount,   color: C.cream2  },
              { label: "Warnings", value: warningCount,  color: C.warning },
              { label: "Critical", value: criticalCount, color: C.danger  },
            ].map(({ label, value, color }) => (
              <View key={label} style={[s.summaryCard, { borderColor: color + "55" }]}>
                <Text style={[s.summaryVal, { color }]}>{value}</Text>
                <Text style={s.summaryLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ── Push Toggle ── */}
          <View style={s.card}>
            <View style={s.pushRow}>
              <View style={s.pushLeft}>
                <View style={[s.alertIcon, { backgroundColor: C.amber + "22", borderColor: C.amber + "55" }]}>
                  <Ionicons name="notifications-outline" size={14} color={C.amber} />
                </View>
                <Text style={s.pushLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: C.border2, true: C.brown }}
                thumbColor={pushEnabled ? C.amber2 : C.muted}
              />
            </View>
          </View>

          {/* ── Filter Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
            contentContainerStyle={s.filterRow}
          >
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterBtn, activeFilter === f && s.filterBtnActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Alert List ── */}
          {filtered.length === 0 ? (
            <AllClear />
          ) : (
            filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      <BottomNav active="alerts" router={router} />
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

  summaryRow:   { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard:  { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  summaryVal:   { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },

  pushRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pushLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  pushLabel: { fontSize: 13, color: C.cream2, fontWeight: "500" },

  filterRow:        { flexDirection: "row", gap: 8, paddingRight: 16 },
  filterBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.card },
  filterBtnActive:  { backgroundColor: C.brown, borderColor: C.amber },
  filterText:       { fontSize: 12, color: C.muted },
  filterTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },

  alertCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  alertLeft:   { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  alertIcon:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  alertTitle:  { fontSize: 13, color: C.cream3, flex: 1 },
  alertTime:   { fontSize: 11, color: C.muted },
  alertDesc:   { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
  alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  catBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  markRead:     { fontSize: 11, color: C.amber2, fontWeight: "600" },

  empty:     { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: C.muted },
});