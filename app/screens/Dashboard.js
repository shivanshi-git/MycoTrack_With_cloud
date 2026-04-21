// /**
//  * Dashboard.js
//  * Mushroom Farm Dashboard — styled to match MycoTrack dark amber theme
//  */

// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   RefreshControl,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";

// // ─── Theme ────────────────────────────────────────────────────────────────────

// const C = {
//   bg:      "#f9fafb",   // main background (soft white)
//   card:    "#ffffff",   // card background
//   border:  "#e5e7eb",   // light border
//   border2: "#d1d5db",   // slightly stronger border

//   amber:   "#d97706",   // primary accent
//   amber2:  "#f59e0b",   // highlight accent
//   brown:   "#92400e",   // darker accent

//   cream:   "#1f2937",   // main text (dark grey)
//   cream2:  "#374151",   // secondary text
//   cream3:  "#6b7280",   // tertiary text

//   muted:   "#9ca3af",   // muted text

//   healthy: "#16a34a",   // green
//   warning: "#f59e0b",   // amber
//   danger:  "#dc2626",   // red
// };

// // ─── Dummy Data ───────────────────────────────────────────────────────────────

// const DUMMY_DATA = {
//   status: "online",
//   lastUpdated: "Just now",
//   sensors: {
//     temperature:  { value: 23,  unit: "°C",   status: "normal",  icon: "thermometer-outline", label: "Temperature",   history: [21,21.5,22,22.5,23,22.8,23.1,23,22.5,23,23.2,23] },
//     humidity:     { value: 85,  unit: "%",    status: "normal",  icon: "water-outline",       label: "Humidity",      history: [80,82,83,85,86,85,84,85,87,85,84,85] },
//     soilMoisture: { value: 72,  unit: "%",    status: "normal",  icon: "leaf-outline",        label: "Soil Moisture", history: [70,71,72,73,72,71,72,73,72,71,72,72] },
//     co2:          { value: 650, unit: " ppm", status: "warning", icon: "cloud-outline",       label: "CO₂ Level",     history: [600,620,630,640,650,645,650,655,650,648,650,670] },
//   },
// };

// // ─── Mini Bar Sparkline (no SVG package needed) ───────────────────────────────

// function Sparkline({ data = [], color = C.amber }) {
//   if (!data || data.length < 2) return null;
//   const min = Math.min(...data);
//   const max = Math.max(...data);
//   const range = max - min || 1;

//   return (
//     <View style={{ flexDirection: "row", alignItems: "flex-end", height: 32, gap: 2 }}>
//       {data.map((v, i) => {
//         const barH = Math.max(4, ((v - min) / range) * 32);
//         return (
//           <View
//             key={i}
//             style={{
//               flex: 1,
//               height: barH,
//               backgroundColor: color,
//               borderRadius: 2,
//               opacity: 0.4 + (i / data.length) * 0.6,
//             }}
//           />
//         );
//       })}
//     </View>
//   );
// }

// // ─── Status Badge ─────────────────────────────────────────────────────────────

// function StatusBadge({ status }) {
//   const map = {
//     normal:  { color: C.healthy, label: "Normal"  },
//     warning: { color: C.warning, label: "Warning" },
//     danger:  { color: C.danger,  label: "Danger"  },
//   };
//   const cfg = map[status] || { color: C.muted, label: status };
//   return (
//     <View style={[s.badge, { borderColor: cfg.color + "55", backgroundColor: cfg.color + "18" }]}>
//       <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
//     </View>
//   );
// }

// // ─── Sensor Card ──────────────────────────────────────────────────────────────

// function SensorCard({ data }) {
//   const { value, unit, status, icon, label, history } = data;
//   const sparkColor = status === "warning" ? C.warning : status === "danger" ? C.danger : C.amber;

//   return (
//     <View style={s.card}>
//       <View style={s.sensorHeader}>
//         <View style={s.sensorLeft}>
//           <View style={s.iconBox}>
//             <Ionicons name={icon} size={18} color={C.amber} />
//           </View>
//           <View>
//             <Text style={s.sensorLabel}>{label}</Text>
//             <Text style={s.sensorValue}>
//               {value !== null && value !== undefined ? `${value}${unit}` : "—"}
//             </Text>
//           </View>
//         </View>
//         <StatusBadge status={status} />
//       </View>
//       <View style={{ marginVertical: 6 }}>
//         <Sparkline data={history} color={sparkColor} />
//       </View>
//       <Text style={s.timeLabel}>Last 24 hours</Text>
//     </View>
//   );
// }

// // ─── Bottom Nav (exported for all other screens) ──────────────────────────────

// export function BottomNav({ active, router }) {
//   const items = [
//     { key: "dashboard",  icon: "home-outline",        label: "Dashboard",  route: "/screens/Dashboard"  },
//     { key: "monitoring", icon: "pulse-outline",        label: "Monitoring", route: "/screens/Monitoring" },
//     { key: "camera",     icon: "camera-outline",       label: null,         route: "/screens/CameraAI"   },
//     { key: "alerts",     icon: "alert-circle-outline", label: "Alerts",     route: "/screens/Alerts"     },
//     { key: "settings",   icon: "settings-outline",     label: "Settings",   route: "/screens/Settings"   },
//   ];

//   return (
//     <View style={s.bnav}>
//       {items.map((item) => {
//         if (item.key === "camera") {
//           return (
//             <View key="camera" style={s.ncw}>
//               <TouchableOpacity onPress={() => router.push(item.route)}>
//                 <LinearGradient
//                   colors={[C.brown, C.amber]}
//                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                   style={[s.ncb, active === "camera" && { borderColor: C.amber2 }]}
//                 >
//                   <Ionicons name="camera-outline" size={20} color="#fff" />
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           );
//         }
//         return (
//           <TouchableOpacity key={item.key} style={s.ni} onPress={() => router.push(item.route)}>
//             <Ionicons name={item.icon} size={18} color={active === item.key ? C.amber2 : C.muted} />
//             <Text style={[s.nl, active === item.key && { color: C.amber2 }]}>{item.label}</Text>
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────────────────────

// export default function Dashboard() {
//   const router = useRouter();
//   const [refreshing, setRefreshing] = useState(false);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   }, []);

//   const { status, lastUpdated, sensors } = DUMMY_DATA;
//   const isOnline = status === "online";

//   return (
//     <SafeAreaView style={s.root} edges={["top"]}>
//       <View style={{ flex: 1 }}>
//         <ScrollView
//           style={s.scroll}
//           contentContainerStyle={s.scrollContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.amber} />
//           }
//         >
//           {/* ── Header ── */}
//           <Text style={s.ptag}>OVERVIEW</Text>
//           <Text style={s.ptitle}>Dashboard</Text>
//           <Text style={s.psub}>Real-time monitoring • House #1</Text>

//           {/* ── System Status ── */}
//           <View style={s.card}>
//             <View style={s.statusRow}>
//               <View>
//                 <Text style={s.slbl}>SYSTEM STATUS</Text>
//                 <Text style={s.timeLabel}>Last updated: {lastUpdated}</Text>
//               </View>
//               <View style={s.statusRight}>
//                 <View style={[s.statusDot, { backgroundColor: isOnline ? C.healthy : C.danger }]} />
//                 <Text style={[s.statusText, { color: isOnline ? C.healthy : C.danger }]}>
//                   {status.toUpperCase()}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* ── Sensor Cards ── */}
//           {Object.entries(sensors).map(([key, data]) => (
//             <SensorCard key={key} data={data} />
//           ))}

//           <View style={{ height: 20 }} />
//         </ScrollView>
//       </View>

//       <BottomNav active="dashboard" router={router} />
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

//   card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
//   slbl:      { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", textTransform: "uppercase" },
//   timeLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

//   statusRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
//   statusDot:   { width: 8, height: 8, borderRadius: 4 },
//   statusText:  { fontSize: 12, fontWeight: "600" },

//   sensorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
//   sensorLeft:   { flexDirection: "row", alignItems: "center", gap: 10 },
//   iconBox:      { width: 36, height: 36, borderRadius: 9, backgroundColor: C.brown + "66", borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
//   sensorLabel:  { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
//   sensorValue:  { fontSize: 22, fontWeight: "700", color: C.cream, marginTop: 1 },

//   badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
//   badgeText: { fontSize: 10, fontWeight: "600" },

//   bnav: { flexDirection: "row", backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border2, paddingTop: 8, paddingBottom: 12 },
//   ni:   { flex: 1, alignItems: "center", gap: 2 },
//   nl:   { fontSize: 8, color: C.muted, letterSpacing: 0.3 },
//   ncw:  { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -16 },
//   ncb:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.bg },
// });


/**
 * Dashboard.js
 * Mushroom Farm Dashboard — styled to match MycoTrack dark amber theme
 */

// /**
//  * Dashboard.js
//  * Mushroom Farm Dashboard — styled to match MycoTrack dark amber theme
//  */

// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   RefreshControl,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";

// // ─── Theme ────────────────────────────────────────────────────────────────────

// const C = {
//   bg:      "#f9fafb",   // main background (soft white)
//   card:    "#ffffff",   // card background
//   border:  "#e5e7eb",   // light border
//   border2: "#d1d5db",   // slightly stronger border

//   amber:   "#d97706",   // primary accent
//   amber2:  "#f59e0b",   // highlight accent
//   brown:   "#92400e",   // darker accent

//   cream:   "#1f2937",   // main text (dark grey)
//   cream2:  "#374151",   // secondary text
//   cream3:  "#6b7280",   // tertiary text

//   muted:   "#9ca3af",   // muted text

//   healthy: "#16a34a",   // green
//   warning: "#f59e0b",   // amber
//   danger:  "#dc2626",   // red
// };

// // ─── Dummy Data ───────────────────────────────────────────────────────────────

// const DUMMY_DATA = {
//   status: "online",
//   lastUpdated: "Just now",
//   sensors: {
//     temperature:  { value: 23,  unit: "°C",   status: "normal",  icon: "thermometer-outline", label: "Temperature",   history: [21,21.5,22,22.5,23,22.8,23.1,23,22.5,23,23.2,23] },
//     humidity:     { value: 85,  unit: "%",    status: "normal",  icon: "water-outline",       label: "Humidity",      history: [80,82,83,85,86,85,84,85,87,85,84,85] },
//     soilMoisture: { value: 72,  unit: "%",    status: "normal",  icon: "leaf-outline",        label: "Soil Moisture", history: [70,71,72,73,72,71,72,73,72,71,72,72] },
//     co2:          { value: 650, unit: " ppm", status: "warning", icon: "cloud-outline",       label: "CO₂ Level",     history: [600,620,630,640,650,645,650,655,650,648,650,670] },
//   },
// };

// // ─── Mini Bar Sparkline (no SVG package needed) ───────────────────────────────

// function Sparkline({ data = [], color = C.amber }) {
//   if (!data || data.length < 2) return null;
//   const min = Math.min(...data);
//   const max = Math.max(...data);
//   const range = max - min || 1;

//   return (
//     <View style={{ flexDirection: "row", alignItems: "flex-end", height: 32, gap: 2 }}>
//       {data.map((v, i) => {
//         const barH = Math.max(4, ((v - min) / range) * 32);
//         return (
//           <View
//             key={i}
//             style={{
//               flex: 1,
//               height: barH,
//               backgroundColor: color,
//               borderRadius: 2,
//               opacity: 0.4 + (i / data.length) * 0.6,
//             }}
//           />
//         );
//       })}
//     </View>
//   );
// }

// // ─── Status Badge ─────────────────────────────────────────────────────────────

// function StatusBadge({ status }) {
//   const map = {
//     normal:  { color: C.healthy, label: "Normal"  },
//     warning: { color: C.warning, label: "Warning" },
//     danger:  { color: C.danger,  label: "Danger"  },
//   };
//   const cfg = map[status] || { color: C.muted, label: status };
//   return (
//     <View style={[s.badge, { borderColor: cfg.color + "55", backgroundColor: cfg.color + "18" }]}>
//       <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
//     </View>
//   );
// }

// // ─── Sensor Card ──────────────────────────────────────────────────────────────

// function SensorCard({ data }) {
//   const { value, unit, status, icon, label, history } = data;
//   const sparkColor = status === "warning" ? C.warning : status === "danger" ? C.danger : C.amber;

//   return (
//     <View style={s.card}>
//       <View style={s.sensorHeader}>
//         <View style={s.sensorLeft}>
//           <View style={s.iconBox}>
//             <Ionicons name={icon} size={18} color={C.amber} />
//           </View>
//           <View>
//             <Text style={s.sensorLabel}>{label}</Text>
//             <Text style={s.sensorValue}>
//               {value !== null && value !== undefined ? `${value}${unit}` : "—"}
//             </Text>
//           </View>
//         </View>
//         <StatusBadge status={status} />
//       </View>
//       <View style={{ marginVertical: 6 }}>
//         <Sparkline data={history} color={sparkColor} />
//       </View>
//       <Text style={s.timeLabel}>Last 24 hours</Text>
//     </View>
//   );
// }

// // ─── Bottom Nav (exported for all other screens) ──────────────────────────────

// export function BottomNav({ active, router }) {
//   const items = [
//     { key: "dashboard",  icon: "home-outline",        label: "Dashboard",  route: "/screens/Dashboard"  },
//     { key: "monitoring", icon: "pulse-outline",        label: "Monitoring", route: "/screens/Monitoring" },
//     { key: "camera",     icon: "camera-outline",       label: null,         route: "/screens/CameraAI"   },
//     { key: "alerts",     icon: "alert-circle-outline", label: "Alerts",     route: "/screens/Alerts"     },
//     { key: "settings",   icon: "settings-outline",     label: "Settings",   route: "/screens/Settings"   },
//   ];

//   return (
//     <View style={s.bnav}>
//       {items.map((item) => {
//         if (item.key === "camera") {
//           return (
//             <View key="camera" style={s.ncw}>
//               <TouchableOpacity onPress={() => router.push(item.route)}>
//                 <LinearGradient
//                   colors={[C.brown, C.amber]}
//                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                   style={[s.ncb, active === "camera" && { borderColor: C.amber2 }]}
//                 >
//                   <Ionicons name="camera-outline" size={20} color="#fff" />
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           );
//         }
//         return (
//           <TouchableOpacity key={item.key} style={s.ni} onPress={() => router.push(item.route)}>
//             <Ionicons name={item.icon} size={18} color={active === item.key ? C.amber2 : C.muted} />
//             <Text style={[s.nl, active === item.key && { color: C.amber2 }]}>{item.label}</Text>
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );
// }

// // ─── Main Dashboard ───────────────────────────────────────────────────────────

// export default function Dashboard() {
//   const router = useRouter();
//   const [refreshing, setRefreshing] = useState(false);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   }, []);

//   const { status, lastUpdated, sensors } = DUMMY_DATA;
//   const isOnline = status === "online";

//   return (
//     <SafeAreaView style={s.root} edges={["top"]}>
//       <View style={{ flex: 1 }}>
//         <ScrollView
//           style={s.scroll}
//           contentContainerStyle={s.scrollContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.amber} />
//           }
//         >
//           {/* ── Header ── */}
//           <Text style={s.ptag}>OVERVIEW</Text>
//           <Text style={s.ptitle}>Dashboard</Text>
//           <Text style={s.psub}>Real-time monitoring • House #1</Text>

//           {/* ── System Status ── */}
//           <View style={s.card}>
//             <View style={s.statusRow}>
//               <View>
//                 <Text style={s.slbl}>SYSTEM STATUS</Text>
//                 <Text style={s.timeLabel}>Last updated: {lastUpdated}</Text>
//               </View>
//               <View style={s.statusRight}>
//                 <View style={[s.statusDot, { backgroundColor: isOnline ? C.healthy : C.danger }]} />
//                 <Text style={[s.statusText, { color: isOnline ? C.healthy : C.danger }]}>
//                   {status.toUpperCase()}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* ── Sensor Cards ── */}
//           {Object.entries(sensors).map(([key, data]) => (
//             <SensorCard key={key} data={data} />
//           ))}

//           <View style={{ height: 20 }} />
//         </ScrollView>
//       </View>

//       <BottomNav active="dashboard" router={router} />
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

//   card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
//   slbl:      { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", textTransform: "uppercase" },
//   timeLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

//   statusRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
//   statusDot:   { width: 8, height: 8, borderRadius: 4 },
//   statusText:  { fontSize: 12, fontWeight: "600" },

//   sensorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
//   sensorLeft:   { flexDirection: "row", alignItems: "center", gap: 10 },
//   iconBox:      { width: 36, height: 36, borderRadius: 9, backgroundColor: C.brown + "66", borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
//   sensorLabel:  { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
//   sensorValue:  { fontSize: 22, fontWeight: "700", color: C.cream, marginTop: 1 },

//   badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
//   badgeText: { fontSize: 10, fontWeight: "600" },

//   bnav: { flexDirection: "row", backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border2, paddingTop: 8, paddingBottom: 12 },
//   ni:   { flex: 1, alignItems: "center", gap: 2 },
//   nl:   { fontSize: 8, color: C.muted, letterSpacing: 0.3 },
//   ncw:  { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -16 },
//   ncb:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.bg },
// });


/**
 * Dashboard.js
 * Mushroom Farm Dashboard — styled to match MycoTrack dark amber theme
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { checkAlerts } from "../../services/alerts";
import { useAlerts } from "../../context/AlertContext";


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

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_DATA = {
  status: "online",
  lastUpdated: "Just now",
  sensors: {
    temperature:  { value: 23,  unit: "°C",   status: "normal",  icon: "thermometer-outline", label: "Temperature",   history: [21,21.5,22,22.5,23,22.8,23.1,23,22.5,23,23.2,23] },
    humidity:     { value: 85,  unit: "%",    status: "normal",  icon: "water-outline",       label: "Humidity",      history: [80,82,83,85,86,85,84,85,87,85,84,85] },
    soilMoisture: { value: 72,  unit: "%",    status: "normal",  icon: "leaf-outline",        label: "Soil Moisture", history: [70,71,72,73,72,71,72,73,72,71,72,72] },
    co2:          { value: 650, unit: " ppm", status: "warning", icon: "cloud-outline",       label: "CO₂ Level",     history: [600,620,630,640,650,645,650,655,650,648,650,670] },
  },
};

// ─── Mushroom Farm Sensor Ranges ─────────────────────────────────────────────

const SENSOR_RANGES = {
  temperature:  { min: 18,  max: 28  },   // °C — ideal mushroom temp band
  humidity:     { min: 75,  max: 95  },   // %
  soilMoisture: { min: 60,  max: 85  },   // %
  co2:          { min: 500, max: 900 },   // ppm
};

// Nudge a value randomly within ±step, clamped to [min, max]
function nudge(current, step, min, max) {
  const delta = (Math.random() * 2 - 1) * step;
  return Math.round(Math.min(max, Math.max(min, current + delta)) * 10) / 10;
}

const NUDGE_STEPS = { temperature: 0.3, humidity: 1, soilMoisture: 1, co2: 8 };

function deriveStatus(key, value) {
  const { min, max } = SENSOR_RANGES[key];
  const span = max - min;
  if (value < min + span * 0.1 || value > max - span * 0.1) return "danger";
  if (value < min + span * 0.2 || value > max - span * 0.2) return "warning";
  return "normal";
}

// ─── Mini Bar Sparkline (no SVG package needed) ───────────────────────────────

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
      <Text style={s.timeLabel}>Last 24 hours</Text>
    </View>
  );
}

// ─── Bottom Nav (exported for all other screens) ──────────────────────────────

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
  const { setAlerts } = useAlerts();

  // ── Live sensor state ──────────────────────────────────────────────────────
  const [sensors, setSensors] = useState(DUMMY_DATA.sensors);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const tickRef = useRef(null);

  // Auto-update every 2 seconds
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSensors((prev) => {
        const next = {};
        Object.entries(prev).forEach(([key, sensor]) => {
          const { min, max } = SENSOR_RANGES[key];
          const step = NUDGE_STEPS[key];
          const newValue = nudge(sensor.value, step, min, max);
          const newHistory = [...sensor.history.slice(1), newValue];
          next[key] = {
            ...sensor,
            value: newValue,
            status: deriveStatus(key, newValue),
            history: newHistory,
          };
        });
        const newData = {
        temperature: next.temperature?.value,
        humidity: next.humidity?.value,
        soilMoisture: next.soilMoisture?.value,
        co2: next.co2?.value,
      };

      const newAlerts = checkAlerts(newData);

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev]);
      }
      // 
        return next;
      });
      // Update timestamp
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 2000);

    return () => clearInterval(tickRef.current);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const { status } = DUMMY_DATA;
  const isOnline = status === "online";

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
                  {status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Sensor Cards ── */}
          {Object.entries(sensors).map(([key, data]) => (
            <SensorCard key={key} data={data} />
          ))}

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

  ptag:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub:   { fontSize: 12, color: C.cream3, marginBottom: 14 },

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