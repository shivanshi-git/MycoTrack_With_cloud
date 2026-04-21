// // // /**
// // //  * Alerts.js
// // //  * Alerts & Notifications — styled to match MycoTrack dark amber theme
// // //  */

// // // import React, { useState, useEffect } from "react";
// // // import {
// // //   View,
// // //   Text,
// // //   ScrollView,
// // //   TouchableOpacity,
// // //   Switch,
// // //   StyleSheet,
// // // } from "react-native";
// // // import { SafeAreaView } from "react-native-safe-area-context";
// // // import { Ionicons } from "@expo/vector-icons";
// // // import { getAlerts, markAlertRead } from "../AWS/dbService";
// // // import { useRouter } from "expo-router";
// // // import { BottomNav } from "../screens/Dashboard";

// // // // ─── Theme ────────────────────────────────────────────────────────────────────

// // // const C = {
// // //   bg:      "#f9fafb",   // main background (soft white)
// // //   card:    "#ffffff",   // card background
// // //   border:  "#e5e7eb",   // light border
// // //   border2: "#d1d5db",   // slightly stronger border

// // //   amber:   "#d97706",   // primary accent
// // //   amber2:  "#f59e0b",   // highlight accent
// // //   brown:   "#92400e",   // darker accent

// // //   cream:   "#1f2937",   // main text (dark grey)
// // //   cream2:  "#374151",   // secondary text
// // //   cream3:  "#6b7280",   // tertiary text

// // //   muted:   "#9ca3af",   // muted text

// // //   healthy: "#16a34a",   // green
// // //   warning: "#f59e0b",   // amber
// // //   danger:  "#dc2626",   // red
// // // };
// // // // ─── Mock Data ────────────────────────────────────────────────────────────────

// // // const MOCK_ALERTS = [
// // //   {
// // //     id: "1",
// // //     title: "Disease Detected",
// // //     description: "AI camera detected possible infection in growing area. Confidence: 87.3%",
// // //     category: "AI Detection",
// // //     severity: "critical",
// // //     time: "2h ago",
// // //     read: false,
// // //   },
// // //   {
// // //     id: "2",
// // //     title: "High Temperature",
// // //     description: "Temperature exceeded threshold: 26°C (Max: 25°C)",
// // //     category: "Environmental",
// // //     severity: "warning",
// // //     time: "5h ago",
// // //     read: false,
// // //   },
// // //   {
// // //     id: "3",
// // //     title: "Low Humidity",
// // //     description: "Humidity dropped to 75% (Min: 80%). Humidifier activated.",
// // //     category: "Environmental",
// // //     severity: "warning",
// // //     time: "8h ago",
// // //     read: true,
// // //   },
// // //   {
// // //     id: "4",
// // //     title: "Water Pump Activated",
// // //     description: "Scheduled watering cycle completed successfully.",
// // //     category: "System",
// // //     severity: "info",
// // //     time: "12h ago",
// // //     read: true,
// // //   },
// // //   {
// // //     id: "5",
// // //     title: "CO₂ Level High",
// // //     description: "CO₂ concentration: 850 ppm (Max: 800 ppm). Ventilation increased.",
// // //     category: "Environmental",
// // //     severity: "warning",
// // //     time: "1d ago",
// // //     read: true,
// // //   },
// // // ];

// // // // ─── Severity Config ──────────────────────────────────────────────────────────

// // // const SEVERITY = {
// // //   critical: { color: C.danger,  icon: "alert-circle"    },
// // //   warning:  { color: C.warning, icon: "warning-outline"  },
// // //   info:     { color: C.healthy, icon: "checkmark-circle" },
// // // };

// // // // ─── Alert Card ───────────────────────────────────────────────────────────────

// // // function AlertCard({ alert, onMarkRead }) {
// // //   const sev      = SEVERITY[alert.severity] || SEVERITY.info;
// // //   const isUnread = !alert.read;

// // //   return (
// // //     <View style={[
// // //       s.alertCard,
// // //       isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 },
// // //     ]}>
// // //       <View style={s.alertHeader}>
// // //         <View style={s.alertLeft}>
// // //           <View style={[s.alertIcon, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
// // //             <Ionicons name={sev.icon} size={14} color={sev.color} />
// // //           </View>
// // //           <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]}>
// // //             {alert.title}
// // //           </Text>
// // //         </View>
// // //         <Text style={s.alertTime}>{alert.time}</Text>
// // //       </View>

// // //       <Text style={s.alertDesc}>{alert.description}</Text>

// // //       <View style={s.alertFooter}>
// // //         <View style={s.catBadge}>
// // //           <Text style={s.catBadgeText}>{alert.category}</Text>
// // //         </View>
// // //         {isUnread && (
// // //           <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
// // //             <Text style={s.markRead}>Mark as read</Text>
// // //           </TouchableOpacity>
// // //         )}
// // //       </View>
// // //     </View>
// // //   );
// // // }

// // // // ─── Main Screen ──────────────────────────────────────────────────────────────

// // // export default function Alerts() {
// // //   const router = useRouter();
// // //   const [alerts,       setAlerts]       = useState(MOCK_ALERTS);
// // //   const [activeFilter, setActiveFilter] = useState("All");
// // //   const [pushEnabled,  setPushEnabled]  = useState(true);

// // //   // AWS
// // // // ✅ ADD
// // // useEffect(() => {
// // //   const fetchAlerts = async () => {
// // //     try {
// // //       const data = await getAlerts("house_1");
// // //       if (data && data.length > 0)
// // //         setAlerts(data.sort((a, b) => (a.read ? 1 : -1)));
// // //     } catch (err) {
// // //       console.warn("Failed to fetch alerts:", err);
// // //     }
// // //   };
// // //   fetchAlerts();
// // //   const interval = setInterval(fetchAlerts, 30000); // poll every 30s
// // //   return () => clearInterval(interval);
// // // }, []);

// // //   // ✅ ADD
// // // const handleMarkRead = async (id) => {
// // //   setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
// // //   try {
// // //     await markAlertRead("house_1", id);
// // //   } catch (err) {
// // //     console.warn("Failed to mark alert read:", err);
// // //   }
// // // };

// // //   const filters  = ["All", "Environmental", "AI Detection", "System"];
// // //   const filtered = activeFilter === "All"
// // //     ? alerts
// // //     : alerts.filter((a) => a.category === activeFilter);

// // //   const unreadCount   = alerts.filter((a) => !a.read).length;
// // //   const warningCount  = alerts.filter((a) => a.severity === "warning").length;
// // //   const criticalCount = alerts.filter((a) => a.severity === "critical").length;

// // //   return (
// // //     <SafeAreaView style={s.root} edges={["top"]}>
// // //       <View style={{ flex: 1 }}>
// // //         <ScrollView
// // //           style={s.scroll}
// // //           contentContainerStyle={s.scrollContent}
// // //           showsVerticalScrollIndicator={false}
// // //         >
// // //           {/* ── Header ── */}
// // //           <Text style={s.ptag}>NOTIFICATIONS</Text>
// // //           <Text style={s.ptitle}>Alerts</Text>
// // //           <Text style={s.psub}>System monitoring & events</Text>

// // //           {/* ── Summary Cards ── */}
// // //           <View style={s.summaryRow}>
// // //             {[
// // //               { label: "Unread",   value: unreadCount,   color: C.cream2  },
// // //               { label: "Warnings", value: warningCount,  color: C.warning },
// // //               { label: "Critical", value: criticalCount, color: C.danger  },
// // //             ].map(({ label, value, color }) => (
// // //               <View key={label} style={[s.summaryCard, { borderColor: color + "55" }]}>
// // //                 <Text style={[s.summaryVal, { color }]}>{value}</Text>
// // //                 <Text style={s.summaryLabel}>{label}</Text>
// // //               </View>
// // //             ))}
// // //           </View>

// // //           {/* ── Push Toggle ── */}
// // //           <View style={s.card}>
// // //             <View style={s.pushRow}>
// // //               <View style={s.pushLeft}>
// // //                 <View style={[s.alertIcon, { backgroundColor: C.amber + "22", borderColor: C.amber + "55" }]}>
// // //                   <Ionicons name="notifications-outline" size={14} color={C.amber} />
// // //                 </View>
// // //                 <Text style={s.pushLabel}>Push Notifications</Text>
// // //               </View>
// // //               <Switch
// // //                 value={pushEnabled}
// // //                 onValueChange={setPushEnabled}
// // //                 trackColor={{ false: C.border2, true: C.brown }}
// // //                 thumbColor={pushEnabled ? C.amber2 : C.muted}
// // //               />
// // //             </View>
// // //           </View>

// // //           {/* ── Filter Tabs ── */}
// // //           <ScrollView
// // //             horizontal
// // //             showsHorizontalScrollIndicator={false}
// // //             style={{ marginBottom: 10 }}
// // //             contentContainerStyle={s.filterRow}
// // //           >
// // //             {filters.map((f) => (
// // //               <TouchableOpacity
// // //                 key={f}
// // //                 style={[s.filterBtn, activeFilter === f && s.filterBtnActive]}
// // //                 onPress={() => setActiveFilter(f)}
// // //               >
// // //                 <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
// // //                   {f}
// // //                 </Text>
// // //               </TouchableOpacity>
// // //             ))}
// // //           </ScrollView>

// // //           {/* ── Alert List ── */}
// // //           {filtered.length === 0 ? (
// // //             <View style={s.empty}>
// // //               <Ionicons name="checkmark-circle-outline" size={40} color={C.muted} style={{ opacity: 0.4 }} />
// // //               <Text style={s.emptyText}>No alerts in this category</Text>
// // //             </View>
// // //           ) : (
// // //             filtered.map((alert) => (
// // //               <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
// // //             ))
// // //           )}

// // //           <View style={{ height: 20 }} />
// // //         </ScrollView>
// // //       </View>

// // //       <BottomNav active="alerts" router={router} />
// // //     </SafeAreaView>
// // //   );
// // // }

// // // // ─── Styles ───────────────────────────────────────────────────────────────────

// // // const s = StyleSheet.create({
// // //   root:          { flex: 1, backgroundColor: C.bg },
// // //   scroll:        { flex: 1 },
// // //   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

// // //   ptag:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
// // //   ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
// // //   psub:   { fontSize: 12, color: C.cream3, marginBottom: 14 },

// // //   summaryRow:   { flexDirection: "row", gap: 8, marginBottom: 10 },
// // //   summaryCard:  { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
// // //   summaryVal:   { fontSize: 22, fontWeight: "700" },
// // //   summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

// // //   card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },

// // //   pushRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
// // //   pushLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
// // //   pushLabel: { fontSize: 13, color: C.cream2, fontWeight: "500" },

// // //   filterRow:        { flexDirection: "row", gap: 8, paddingRight: 16 },
// // //   filterBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.card },
// // //   filterBtnActive:  { backgroundColor: C.brown, borderColor: C.amber },
// // //   filterText:       { fontSize: 12, color: C.muted },
// // //   filterTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },

// // //   alertCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
// // //   alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
// // //   alertLeft:   { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
// // //   alertIcon:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
// // //   alertTitle:  { fontSize: 13, color: C.cream3, flex: 1 },
// // //   alertTime:   { fontSize: 11, color: C.muted },
// // //   alertDesc:   { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
// // //   alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

// // //   catBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: "rgba(255,255,255,0.03)" },
// // //   catBadgeText: { fontSize: 10, color: C.muted },
// // //   markRead:     { fontSize: 11, color: C.amber2, fontWeight: "600" },

// // //   empty:     { alignItems: "center", paddingVertical: 48, gap: 10 },
// // //   emptyText: { fontSize: 13, color: C.muted },
// // // });


// // /**
// //  * Alerts.js
// //  * Alerts & Notifications — styled to match MycoTrack dark amber theme
// //  */

// // import React, { useState, useEffect } from "react";
// // import {
// //   View,
// //   Text,
// //   ScrollView,
// //   TouchableOpacity,
// //   Switch,
// //   StyleSheet,
// // } from "react-native";
// // import { SafeAreaView } from "react-native-safe-area-context";
// // import { Ionicons } from "@expo/vector-icons";
// // import { getAlerts, markAlertRead } from "../../src/AWS/dbService";
// // import { useRouter } from "expo-router";
// // import { BottomNav } from "../screens/Dashboard";

// // // ─── Theme ────────────────────────────────────────────────────────────────────

// // const C = {
// //   bg:      "#f9fafb",   // main background (soft white)
// //   card:    "#ffffff",   // card background
// //   border:  "#e5e7eb",   // light border
// //   border2: "#d1d5db",   // slightly stronger border

// //   amber:   "#d97706",   // primary accent
// //   amber2:  "#f59e0b",   // highlight accent
// //   brown:   "#92400e",   // darker accent

// //   cream:   "#1f2937",   // main text (dark grey)
// //   cream2:  "#374151",   // secondary text
// //   cream3:  "#6b7280",   // tertiary text

// //   muted:   "#9ca3af",   // muted text

// //   healthy: "#16a34a",   // green
// //   warning: "#f59e0b",   // amber
// //   danger:  "#dc2626",   // red
// // };
// // // ─── Mock Data ────────────────────────────────────────────────────────────────

// // const MOCK_ALERTS = [
// //   {
// //     id: "1",
// //     title: "Disease Detected",
// //     description: "AI camera detected possible infection in growing area. Confidence: 87.3%",
// //     category: "AI Detection",
// //     severity: "critical",
// //     time: "2h ago",
// //     read: false,
// //   },
// //   {
// //     id: "2",
// //     title: "High Temperature",
// //     description: "Temperature exceeded threshold: 26°C (Max: 25°C)",
// //     category: "Environmental",
// //     severity: "warning",
// //     time: "5h ago",
// //     read: false,
// //   },
// //   {
// //     id: "3",
// //     title: "Low Humidity",
// //     description: "Humidity dropped to 75% (Min: 80%). Humidifier activated.",
// //     category: "Environmental",
// //     severity: "warning",
// //     time: "8h ago",
// //     read: true,
// //   },
// //   {
// //     id: "4",
// //     title: "Water Pump Activated",
// //     description: "Scheduled watering cycle completed successfully.",
// //     category: "System",
// //     severity: "info",
// //     time: "12h ago",
// //     read: true,
// //   },
// //   {
// //     id: "5",
// //     title: "CO₂ Level High",
// //     description: "CO₂ concentration: 850 ppm (Max: 800 ppm). Ventilation increased.",
// //     category: "Environmental",
// //     severity: "warning",
// //     time: "1d ago",
// //     read: true,
// //   },
// // ];

// // // ─── Severity Config ──────────────────────────────────────────────────────────

// // const SEVERITY = {
// //   critical: { color: C.danger,  icon: "alert-circle"    },
// //   warning:  { color: C.warning, icon: "warning-outline"  },
// //   info:     { color: C.healthy, icon: "checkmark-circle" },
// // };

// // // ─── Alert Card ───────────────────────────────────────────────────────────────

// // function AlertCard({ alert, onMarkRead }) {
// //   const sev      = SEVERITY[alert.severity] || SEVERITY.info;
// //   const isUnread = !alert.read;

// //   return (
// //     <View style={[
// //       s.alertCard,
// //       isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 },
// //     ]}>
// //       <View style={s.alertHeader}>
// //         <View style={s.alertLeft}>
// //           <View style={[s.alertIcon, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
// //             <Ionicons name={sev.icon} size={14} color={sev.color} />
// //           </View>
// //           <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]}>
// //             {alert.title}
// //           </Text>
// //         </View>
// //         <Text style={s.alertTime}>{alert.time}</Text>
// //       </View>

// //       <Text style={s.alertDesc}>{alert.description}</Text>

// //       <View style={s.alertFooter}>
// //         <View style={s.catBadge}>
// //           <Text style={s.catBadgeText}>{alert.category}</Text>
// //         </View>
// //         {isUnread && (
// //           <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
// //             <Text style={s.markRead}>Mark as read</Text>
// //           </TouchableOpacity>
// //         )}
// //       </View>
// //     </View>
// //   );
// // }

// // // ─── Main Screen ──────────────────────────────────────────────────────────────

// // export default function Alerts() {
// //   const router = useRouter();
// //   const [alerts,       setAlerts]       = useState(MOCK_ALERTS);
// //   const [activeFilter, setActiveFilter] = useState("All");
// //   const [pushEnabled,  setPushEnabled]  = useState(true);

// //   // AWS
// // // ✅ ADD
// // useEffect(() => {
// //   const fetchAlerts = async () => {
// //     try {
// //       const data = await getAlerts("house_1");
// //       if (data && data.length > 0)
// //         setAlerts(data.sort((a, b) => (a.read ? 1 : -1)));
// //     } catch (err) {
// //       console.warn("Failed to fetch alerts:", err);
// //     }
// //   };
// //   fetchAlerts();
// //   const interval = setInterval(fetchAlerts, 30000); // poll every 30s
// //   return () => clearInterval(interval);
// // }, []);

// //   // ✅ ADD
// // const handleMarkRead = async (id) => {
// //   setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
// //   try {
// //     await markAlertRead("house_1", id);
// //   } catch (err) {
// //     console.warn("Failed to mark alert read:", err);
// //   }
// // };

// //   const filters  = ["All", "Environmental", "AI Detection", "System"];
// //   const filtered = activeFilter === "All"
// //     ? alerts
// //     : alerts.filter((a) => a.category === activeFilter);

// //   const unreadCount   = alerts.filter((a) => !a.read).length;
// //   const warningCount  = alerts.filter((a) => a.severity === "warning").length;
// //   const criticalCount = alerts.filter((a) => a.severity === "critical").length;

// //   return (
// //     <SafeAreaView style={s.root} edges={["top"]}>
// //       <View style={{ flex: 1 }}>
// //         <ScrollView
// //           style={s.scroll}
// //           contentContainerStyle={s.scrollContent}
// //           showsVerticalScrollIndicator={false}
// //         >
// //           {/* ── Header ── */}
// //           <Text style={s.ptag}>NOTIFICATIONS</Text>
// //           <Text style={s.ptitle}>Alerts</Text>
// //           <Text style={s.psub}>System monitoring & events</Text>

// //           {/* ── Summary Cards ── */}
// //           <View style={s.summaryRow}>
// //             {[
// //               { label: "Unread",   value: unreadCount,   color: C.cream2  },
// //               { label: "Warnings", value: warningCount,  color: C.warning },
// //               { label: "Critical", value: criticalCount, color: C.danger  },
// //             ].map(({ label, value, color }) => (
// //               <View key={label} style={[s.summaryCard, { borderColor: color + "55" }]}>
// //                 <Text style={[s.summaryVal, { color }]}>{value}</Text>
// //                 <Text style={s.summaryLabel}>{label}</Text>
// //               </View>
// //             ))}
// //           </View>

// //           {/* ── Push Toggle ── */}
// //           <View style={s.card}>
// //             <View style={s.pushRow}>
// //               <View style={s.pushLeft}>
// //                 <View style={[s.alertIcon, { backgroundColor: C.amber + "22", borderColor: C.amber + "55" }]}>
// //                   <Ionicons name="notifications-outline" size={14} color={C.amber} />
// //                 </View>
// //                 <Text style={s.pushLabel}>Push Notifications</Text>
// //               </View>
// //               <Switch
// //                 value={pushEnabled}
// //                 onValueChange={setPushEnabled}
// //                 trackColor={{ false: C.border2, true: C.brown }}
// //                 thumbColor={pushEnabled ? C.amber2 : C.muted}
// //               />
// //             </View>
// //           </View>

// //           {/* ── Filter Tabs ── */}
// //           <ScrollView
// //             horizontal
// //             showsHorizontalScrollIndicator={false}
// //             style={{ marginBottom: 10 }}
// //             contentContainerStyle={s.filterRow}
// //           >
// //             {filters.map((f) => (
// //               <TouchableOpacity
// //                 key={f}
// //                 style={[s.filterBtn, activeFilter === f && s.filterBtnActive]}
// //                 onPress={() => setActiveFilter(f)}
// //               >
// //                 <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
// //                   {f}
// //                 </Text>
// //               </TouchableOpacity>
// //             ))}
// //           </ScrollView>

// //           {/* ── Alert List ── */}
// //           {filtered.length === 0 ? (
// //             <View style={s.empty}>
// //               <Ionicons name="checkmark-circle-outline" size={40} color={C.muted} style={{ opacity: 0.4 }} />
// //               <Text style={s.emptyText}>No alerts in this category</Text>
// //             </View>
// //           ) : (
// //             filtered.map((alert) => (
// //               <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
// //             ))
// //           )}

// //           <View style={{ height: 20 }} />
// //         </ScrollView>
// //       </View>

// //       <BottomNav active="alerts" router={router} />
// //     </SafeAreaView>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────

// // const s = StyleSheet.create({
// //   root:          { flex: 1, backgroundColor: C.bg },
// //   scroll:        { flex: 1 },
// //   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

// //   ptag:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
// //   ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
// //   psub:   { fontSize: 12, color: C.cream3, marginBottom: 14 },

// //   summaryRow:   { flexDirection: "row", gap: 8, marginBottom: 10 },
// //   summaryCard:  { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
// //   summaryVal:   { fontSize: 22, fontWeight: "700" },
// //   summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

// //   card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },

// //   pushRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
// //   pushLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
// //   pushLabel: { fontSize: 13, color: C.cream2, fontWeight: "500" },

// //   filterRow:        { flexDirection: "row", gap: 8, paddingRight: 16 },
// //   filterBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.card },
// //   filterBtnActive:  { backgroundColor: C.brown, borderColor: C.amber },
// //   filterText:       { fontSize: 12, color: C.muted },
// //   filterTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },

// //   alertCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
// //   alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
// //   alertLeft:   { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
// //   alertIcon:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
// //   alertTitle:  { fontSize: 13, color: C.cream3, flex: 1 },
// //   alertTime:   { fontSize: 11, color: C.muted },
// //   alertDesc:   { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
// //   alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

// //   catBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: "rgba(255,255,255,0.03)" },
// //   catBadgeText: { fontSize: 10, color: C.muted },
// //   markRead:     { fontSize: 11, color: C.amber2, fontWeight: "600" },

// //   empty:     { alignItems: "center", paddingVertical: 48, gap: 10 },
// //   emptyText: { fontSize: 13, color: C.muted },
// // });


// /**
//  * Alerts.js
//  * Alerts & Notifications screen — MycoTrack dark amber theme
//  * Location: app/screens/Alerts.js
//  */

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   Switch,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// // ✅ Correct import paths — src/AWS/ is OUTSIDE app/
// import { getAlerts, markAlertRead } from "../../src/AWS/dbService";
// import { BottomNav } from "./Dashboard";

// // ─── Theme ────────────────────────────────────────────────────────────────────

// const C = {
//   bg:      "#f9fafb",
//   card:    "#ffffff",
//   border:  "#e5e7eb",
//   border2: "#d1d5db",
//   amber:   "#d97706",
//   amber2:  "#f59e0b",
//   brown:   "#92400e",
//   cream:   "#1f2937",
//   cream2:  "#374151",
//   cream3:  "#6b7280",
//   muted:   "#9ca3af",
//   healthy: "#16a34a",
//   warning: "#f59e0b",
//   danger:  "#dc2626",
// };

// // ─── Mock / Fallback Data ─────────────────────────────────────────────────────
// // Shown while AWS loads, or if DynamoDB is unreachable

// const MOCK_ALERTS = [
//   {
//     id: "1",
//     title: "Disease Detected",
//     description: "AI camera detected possible infection in growing area. Confidence: 87.3%",
//     category: "AI Detection",
//     severity: "critical",
//     time: "2h ago",
//     read: false,
//   },
//   {
//     id: "2",
//     title: "High Temperature",
//     description: "Temperature exceeded threshold: 26°C (Max: 25°C)",
//     category: "Environmental",
//     severity: "warning",
//     time: "5h ago",
//     read: false,
//   },
//   {
//     id: "3",
//     title: "Low Humidity",
//     description: "Humidity dropped to 75% (Min: 80%). Humidifier activated.",
//     category: "Environmental",
//     severity: "warning",
//     time: "8h ago",
//     read: true,
//   },
//   {
//     id: "4",
//     title: "Water Pump Activated",
//     description: "Scheduled watering cycle completed successfully.",
//     category: "System",
//     severity: "info",
//     time: "12h ago",
//     read: true,
//   },
//   {
//     id: "5",
//     title: "CO₂ Level High",
//     description: "CO₂ concentration: 850 ppm (Max: 800 ppm). Ventilation increased.",
//     category: "Environmental",
//     severity: "warning",
//     time: "1d ago",
//     read: true,
//   },
// ];

// // ─── Severity Config ──────────────────────────────────────────────────────────

// const SEVERITY = {
//   critical: { color: C.danger,  icon: "alert-circle"    },
//   warning:  { color: C.warning, icon: "warning-outline"  },
//   info:     { color: C.healthy, icon: "checkmark-circle" },
// };

// // ─── Alert Card ───────────────────────────────────────────────────────────────

// function AlertCard({ alert, onMarkRead }) {
//   const sev      = SEVERITY[alert.severity] || SEVERITY.info;
//   const isUnread = !alert.read;

//   return (
//     <View
//       style={[
//         s.alertCard,
//         isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 },
//       ]}
//     >
//       <View style={s.alertHeader}>
//         <View style={s.alertLeft}>
//           <View
//             style={[
//               s.alertIcon,
//               { backgroundColor: sev.color + "22", borderColor: sev.color + "55" },
//             ]}
//           >
//             <Ionicons name={sev.icon} size={14} color={sev.color} />
//           </View>
//           <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]}>
//             {alert.title}
//           </Text>
//         </View>
//         <Text style={s.alertTime}>{alert.time}</Text>
//       </View>

//       <Text style={s.alertDesc}>{alert.description}</Text>

//       <View style={s.alertFooter}>
//         <View style={s.catBadge}>
//           <Text style={s.catBadgeText}>{alert.category}</Text>
//         </View>
//         {isUnread && (
//           <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
//             <Text style={s.markRead}>Mark as read</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// export default function Alerts() {
//   const router = useRouter();
//   const [alerts,       setAlerts]       = useState(MOCK_ALERTS);
//   const [activeFilter, setActiveFilter] = useState("All");
//   const [pushEnabled,  setPushEnabled]  = useState(true);

//   // Fetch from DynamoDB, fall back to mock data on error
//   useEffect(() => {
//     const fetchAlerts = async () => {
//       try {
//         const data = await getAlerts("house_1");
//         if (data && data.length > 0) {
//           setAlerts(data.sort((a, b) => (a.read ? 1 : -1)));
//         }
//       } catch (err) {
//         console.warn("[Alerts] Failed to fetch from AWS, using mock data:", err.message);
//       }
//     };

//     fetchAlerts();
//     const interval = setInterval(fetchAlerts, 30000);   // poll every 30s
//     return () => clearInterval(interval);
//   }, []);

//   const handleMarkRead = async (id) => {
//     // Optimistic UI update
//     setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
//     try {
//       await markAlertRead("house_1", id);
//     } catch (err) {
//       console.warn("[Alerts] markAlertRead failed:", err.message);
//     }
//   };

//   const filters  = ["All", "Environmental", "AI Detection", "System"];
//   const filtered = activeFilter === "All"
//     ? alerts
//     : alerts.filter((a) => a.category === activeFilter);

//   const unreadCount   = alerts.filter((a) => !a.read).length;
//   const warningCount  = alerts.filter((a) => a.severity === "warning").length;
//   const criticalCount = alerts.filter((a) => a.severity === "critical").length;

//   return (
//     <SafeAreaView style={s.root} edges={["top"]}>
//       <View style={{ flex: 1 }}>
//         <ScrollView
//           style={s.scroll}
//           contentContainerStyle={s.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* ── Header ── */}
//           <Text style={s.ptag}>NOTIFICATIONS</Text>
//           <Text style={s.ptitle}>Alerts</Text>
//           <Text style={s.psub}>System monitoring & events</Text>

//           {/* ── Summary Cards ── */}
//           <View style={s.summaryRow}>
//             {[
//               { label: "Unread",   value: unreadCount,   color: C.cream2  },
//               { label: "Warnings", value: warningCount,  color: C.warning },
//               { label: "Critical", value: criticalCount, color: C.danger  },
//             ].map(({ label, value, color }) => (
//               <View key={label} style={[s.summaryCard, { borderColor: color + "55" }]}>
//                 <Text style={[s.summaryVal, { color }]}>{value}</Text>
//                 <Text style={s.summaryLabel}>{label}</Text>
//               </View>
//             ))}
//           </View>

//           {/* ── Push Toggle ── */}
//           <View style={s.card}>
//             <View style={s.pushRow}>
//               <View style={s.pushLeft}>
//                 <View
//                   style={[
//                     s.alertIcon,
//                     { backgroundColor: C.amber + "22", borderColor: C.amber + "55" },
//                   ]}
//                 >
//                   <Ionicons name="notifications-outline" size={14} color={C.amber} />
//                 </View>
//                 <Text style={s.pushLabel}>Push Notifications</Text>
//               </View>
//               <Switch
//                 value={pushEnabled}
//                 onValueChange={setPushEnabled}
//                 trackColor={{ false: C.border2, true: C.brown }}
//                 thumbColor={pushEnabled ? C.amber2 : C.muted}
//               />
//             </View>
//           </View>

//           {/* ── Filter Tabs ── */}
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             style={{ marginBottom: 10 }}
//             contentContainerStyle={s.filterRow}
//           >
//             {filters.map((f) => (
//               <TouchableOpacity
//                 key={f}
//                 style={[s.filterBtn, activeFilter === f && s.filterBtnActive]}
//                 onPress={() => setActiveFilter(f)}
//               >
//                 <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
//                   {f}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>

//           {/* ── Alert List ── */}
//           {filtered.length === 0 ? (
//             <View style={s.empty}>
//               <Ionicons
//                 name="checkmark-circle-outline"
//                 size={40}
//                 color={C.muted}
//                 style={{ opacity: 0.4 }}
//               />
//               <Text style={s.emptyText}>No alerts in this category</Text>
//             </View>
//           ) : (
//             filtered.map((alert) => (
//               <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
//             ))
//           )}

//           <View style={{ height: 20 }} />
//         </ScrollView>
//       </View>

//       <BottomNav active="alerts" router={router} />
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const s = StyleSheet.create({
//   root:          { flex: 1, backgroundColor: C.bg },
//   scroll:        { flex: 1 },
//   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

//   ptag:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
//   ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
//   psub:   { fontSize: 12, color: C.cream3, marginBottom: 14 },

//   summaryRow:   { flexDirection: "row", gap: 8, marginBottom: 10 },
//   summaryCard:  { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
//   summaryVal:   { fontSize: 22, fontWeight: "700" },
//   summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

//   card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
//   pushRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   pushLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
//   pushLabel: { fontSize: 13, color: C.cream2, fontWeight: "500" },

//   filterRow:        { flexDirection: "row", gap: 8, paddingRight: 16 },
//   filterBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.card },
//   filterBtnActive:  { backgroundColor: C.brown, borderColor: C.amber },
//   filterText:       { fontSize: 12, color: C.muted },
//   filterTextActive: { fontSize: 12, color: C.amber2, fontWeight: "600" },

//   alertCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
//   alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
//   alertLeft:   { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
//   alertIcon:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
//   alertTitle:  { fontSize: 13, color: C.cream3, flex: 1 },
//   alertTime:   { fontSize: 11, color: C.muted },
//   alertDesc:   { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
//   alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

//   catBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: "rgba(255,255,255,0.03)" },
//   catBadgeText: { fontSize: 10, color: C.muted },
//   markRead:     { fontSize: 11, color: C.amber2, fontWeight: "600" },

//   empty:     { alignItems: "center", paddingVertical: 48, gap: 10 },
//   emptyText: { fontSize: 13, color: C.muted },
// });



/**
 * Alerts.js
 * Alerts & Notifications screen — MycoTrack dark amber theme
 * Location: app/screens/Alerts.js
 *
 * Reads live from alertStore.js — no AWS, no external deps.
 * Alerts are generated by Dashboard.js when thresholds are breached.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAlerts, markRead, markAllRead, subscribe } from "./Alertstore";
import { BottomNav } from "./Dashboard";

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

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY = {
  critical: { color: C.danger,  icon: "alert-circle"    },
  warning:  { color: C.warning, icon: "warning-outline"  },
  info:     { color: C.healthy, icon: "checkmark-circle" },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onMarkRead }) {
  const sev      = SEVERITY[alert.severity] || SEVERITY.info;
  const isUnread = !alert.read;

  return (
    <View
      style={[
        s.alertCard,
        isUnread && { borderColor: sev.color + "99", borderWidth: 1.5 },
      ]}
    >
      <View style={s.alertHeader}>
        <View style={s.alertLeft}>
          <View style={[s.alertIcon, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
            <Ionicons name={sev.icon} size={14} color={sev.color} />
          </View>
          <Text style={[s.alertTitle, isUnread && { color: C.cream, fontWeight: "700" }]} numberOfLines={1}>
            {alert.title}
          </Text>
        </View>
        <Text style={s.alertTime}>{alert.time}</Text>
      </View>

      <Text style={s.alertDesc}>{alert.description}</Text>

      <View style={s.alertFooter}>
        <View style={s.catBadge}>
          <Text style={s.catBadgeText}>{alert.category}</Text>
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={s.empty}>
      <Ionicons name="checkmark-circle-outline" size={48} color={C.muted} style={{ opacity: 0.35 }} />
      <Text style={s.emptyTitle}>All clear</Text>
      <Text style={s.emptyText}>No alerts yet. Alerts appear here when{"\n"}temperature exceeds 20°C or CO₂ exceeds 900 ppm.</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Alerts() {
  const router = useRouter();
  const [alerts,       setAlerts]       = useState(getAlerts());
  const [activeFilter, setActiveFilter] = useState("All");

  // Subscribe to live updates from alertStore
  useEffect(() => {
    const unsub = subscribe((newAlerts) => setAlerts([...newAlerts]));
    return unsub;
  }, []);

  const handleMarkRead = (id) => {
    markRead(id);
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const filters  = ["All", "Environmental", "AI Detection", "System"];
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
          <View style={s.headerRow}>
            <View>
              <Text style={s.ptag}>NOTIFICATIONS</Text>
              <Text style={s.ptitle}>Alerts</Text>
              <Text style={s.psub}>Live threshold monitoring • House #1</Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={s.clearBtn} onPress={handleMarkAllRead}>
                <Text style={s.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

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

          {/* ── Threshold info card ── */}
          <View style={[s.card, { marginBottom: 10 }]}>
            <Text style={s.slbl}>ACTIVE THRESHOLDS</Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
              <View style={s.threshRow}>
                <Ionicons name="thermometer-outline" size={14} color={C.amber} />
                <Text style={s.threshText}>Temp  {"<"} 20°C</Text>
              </View>
              <View style={s.threshRow}>
                <Ionicons name="cloud-outline" size={14} color={C.amber} />
                <Text style={s.threshText}>CO₂ ~900 ppm</Text>
              </View>
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
                <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Alert List ── */}
          {filtered.length === 0 ? (
            <EmptyState />
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

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  ptag:      { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle:    { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub:      { fontSize: 12, color: C.cream3, marginBottom: 14 },

  clearBtn:     { marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.brown + "22", borderWidth: 1, borderColor: C.brown + "44" },
  clearBtnText: { fontSize: 11, color: C.amber, fontWeight: "600" },

  summaryRow:   { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard:  { flex: 1, backgroundColor: C.card, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  summaryVal:   { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 10, color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  card:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12 },
  slbl:  { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", textTransform: "uppercase" },

  threshRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  threshText:{ fontSize: 12, color: C.cream3 },

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
  alertTime:   { fontSize: 11, color: C.muted, marginLeft: 6 },
  alertDesc:   { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 9 },
  alertFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  catBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border2 },
  catBadgeText: { fontSize: 10, color: C.muted },
  markRead:     { fontSize: 11, color: C.amber2, fontWeight: "600" },

  empty:      { alignItems: "center", paddingVertical: 52, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: C.cream3 },
  emptyText:  { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },
});