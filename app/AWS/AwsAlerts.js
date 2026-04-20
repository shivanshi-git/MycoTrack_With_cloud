/**
 * Alerts.js  (AWS version)
 * Replaces Firebase onValue/update with DynamoDB getAlerts/markAlertRead
 */

import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BottomNav } from "./Dashboard";
import { getAlerts, markAlertRead } from "../../aws/dbService"; // ← AWS

const C = {
  bg: "#f9fafb", card: "#ffffff", border: "#e5e7eb", border2: "#d1d5db",
  amber: "#d97706", amber2: "#f59e0b", brown: "#92400e",
  cream: "#1f2937", cream2: "#374151", cream3: "#6b7280", muted: "#9ca3af",
  healthy: "#16a34a", warning: "#f59e0b", danger: "#dc2626",
};

const MOCK_ALERTS = [
  { id: "1", title: "Disease Detected", description: "AI camera detected possible infection. Confidence: 87.3%", category: "AI Detection", severity: "critical", time: "2h ago", read: false },
  { id: "2", title: "High Temperature", description: "Temperature exceeded threshold: 26°C (Max: 25°C)", category: "Environmental", severity: "warning", time: "5h ago", read: false },
  { id: "3", title: "Low Humidity", description: "Humidity dropped to 75% (Min: 80%). Humidifier activated.", category: "Environmental", severity: "warning", time: "8h ago", read: true },
  { id: "4", title: "Water Pump Activated", description: "Scheduled watering cycle completed successfully.", category: "System", severity: "info", time: "12h ago", read: true },
  { id: "5", title: "CO₂ Level High", description: "CO₂ concentration: 850 ppm (Max: 800 ppm). Ventilation increased.", category: "Environmental", severity: "warning", time: "1d ago", read: true },
];

const SEVERITY = {
  critical: { color: C.danger,  icon: "alert-circle" },
  warning:  { color: C.warning, icon: "warning-outline" },
  info:     { color: C.healthy, icon: "checkmark-circle" },
};

function AlertCard({ alert, onMarkRead }) {
  const sev = SEVERITY[alert.severity] || SEVERITY.info;
  const isUnread = !alert.read;
  return (
    <View style={[s.alertCard, isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 }]}>
      <View style={s.alertHeader}>
        <View style={s.alertLeft}>
          <View style={[s.alertIcon, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
            <Ionicons name={sev.icon} size={14} color={sev.color} />
          </View>
          <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]}>{alert.title}</Text>
        </View>
        <Text style={s.alertTime}>{alert.time}</Text>
      </View>
      <Text style={s.alertDesc}>{alert.description}</Text>
      <View style={s.alertFooter}>
        <View style={s.catBadge}><Text style={s.catBadgeText}>{alert.category}</Text></View>
        {isUnread && (
          <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
            <Text style={s.markRead}>Mark as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Alerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [pushEnabled, setPushEnabled] = useState(true);

  // ── AWS DynamoDB fetch (replaces Firebase onValue) ────────────────────────
  useEffect(() => {
    getAlerts("house_1")
      .then((data) => {
        if (data && data.length > 0) {
          setAlerts(data.sort((a, b) => (a.read ? 1 : -1)));
        }
        // If no data yet, keep MOCK_ALERTS so UI isn't empty during dev
      })
      .catch((err) => console.warn("AWS getAlerts:", err.message));
  }, []);

  const handleMarkRead = async (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    try {
      await markAlertRead("house_1", id); // ← AWS DynamoDB update
    } catch (err) {
      console.warn("markAlertRead:", err.message);
    }
  };

  const filters  = ["All", "Environmental", "AI Detection", "System"];
  const filtered = activeFilter === "All" ? alerts : alerts.filter((a) => a.category === activeFilter);

  const unreadCount   = alerts.filter((a) => !a.read).length;
  const warningCount  = alerts.filter((a) => a.severity === "warning").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.ptag}>NOTIFICATIONS</Text>
          <Text style={s.ptitle}>Alerts</Text>
          <Text style={s.psub}>System monitoring & events</Text>

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

          <View style={s.card}>
            <View style={s.pushRow}>
              <View style={s.pushLeft}>
                <View style={[s.alertIcon, { backgroundColor: C.amber + "22", borderColor: C.amber + "55" }]}>
                  <Ionicons name="notifications-outline" size={14} color={C.amber} />
                </View>
                <Text style={s.pushLabel}>Push Notifications</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled}
                trackColor={{ false: C.border2, true: C.brown }} thumbColor={pushEnabled ? C.amber2 : C.muted} />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={s.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity key={f} style={[s.filterBtn, activeFilter === f && s.filterBtnActive]} onPress={() => setActiveFilter(f)}>
                <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={C.muted} style={{ opacity: 0.4 }} />
              <Text style={s.emptyText}>No alerts in this category</Text>
            </View>
          ) : (
            filtered.map((alert) => <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />)
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
      <BottomNav active="alerts" router={router} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },
  ptag: { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub: { fontSize: 12, color: C.cream3, marginBottom: 14 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  summaryVal: { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
  pushRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pushLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  pushLabel: { fontSize: 13, color: C.cream2, fontWeight: "500" },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.card },
  filterBtnActive: { backgroundColor: C.brown, borderColor: C.amber },
  filterText: { fontSize: 12, color: C.muted },
  filterTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },
  alertCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  alertLeft: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  alertIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 13, color: C.cream3, flex: 1 },
  alertTime: { fontSize: 11, color: C.muted },
  alertDesc: { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
  alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border2 },
  catBadgeText: { fontSize: 10, color: C.muted },
  markRead: { fontSize: 11, color: C.amber2, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: C.muted },
});