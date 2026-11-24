// import { GROQ_API_KEY } from '@env';
// import React, { useEffect, useState } from "react";
// import {
//   View, Text, StyleSheet, ScrollView,
//   TouchableOpacity, Alert, ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { BottomNav } from "./Dashboard";

// const C = {
//   bg:      "#f9fafb",   // main background (soft white)
//   card:    "#ffffff",   // card background
//   border:  "#e5e7eb",   // light border
//   border2: "#d1d5db",   // slightly stronger border

//   amber:   "#d97706",   // primary accent
//   amber2:  "#f59e0b",   // highlight accent
//   brown:   "#92400e",   // darker accent
//   infected: "#dc2626",
//   cream:   "#1f2937",   // main text (dark grey)
//   cream2:  "#374151",   // secondary text
//   cream3:  "#6b7280",   // tertiary text
//   errBdr:   "#fca5a5",
//   muted:   "#9ca3af",   // muted text

//   healthy: "#16a34a",   // green
//   warning: "#f59e0b",   // amber
//   danger:  "#dc2626",   // red
// };

// const SIMILAR = [
//   { icon: "💧", name: "Wet Bubble", match: "78%" },
//   { icon: "🌫", name: "Grey Mould", match: "65%" },
//   { icon: "🟤", name: "Dry Bubble", match: "52%" },
//   { icon: "🦠", name: "Bacterial Blotch", match: "49%" },
// ];


// // ── Call Groq and return parsed JSON ─────────────────────────────────────────
// async function fetchDiseaseAnalysis(conf, severity) {
//   const prompt = `You are a mycology disease expert. A mushroom scan detected a fungal infection with ${conf}% confidence and ${severity} severity.

// Return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:
// {
//   "diseaseName": "string",
//   "scientificName": "string",
//   "description": "string (2-3 sentences about the disease)",
//   "symptoms": ["symptom1", "symptom2", "symptom3", "symptom4"],
//   "prevention": ["step1", "step2", "step3", "step4"],
//   "quickActions": ["action1", "action2", "action3", "action4"],
//   "supplement1": {
//     "name": "string",
//     "description": "string",
//     "tags": ["tag1", "tag2", "tag3"]
//   },
//   "supplement2": {
//     "name": "string",
//     "description": "string",
//     "tags": ["tag1", "tag2"]
//   }
// }`;

//   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {

//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${GROQ_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "llama-3.1-8b-instant",   // ← updated: llama3-8b-8192 is deprecated
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 800,
//     }),
//   });

//   if (!response.ok) throw new Error(`Groq error: ${response.status}`);

//   const data = await response.json();
//   const raw = data.choices[0].message.content.trim();

//   // Strip any accidental markdown fences
//   const clean = raw.replace(/```json|```/g, "").trim();
//   return JSON.parse(clean);
// }

// // ── Fallback data if API fails ────────────────────────────────────────────────
// const FALLBACK = {
//   diseaseName: "Unknown Mushroom Infection",
//   scientificName: "Fungal / Bacterial Contamination",
//   description: "The detected pattern does not match known conditions. It may indicate early-stage contamination or environmental stress affecting mushroom growth.",
  
//   symptoms: [
//     "Discoloration",
//     "Abnormal growth",
//     "Soft or slimy texture",
//     "Unusual spots or patches"
//   ],

//   prevention: [
//     "Maintain hygiene in growing area",
//     "Ensure proper ventilation",
//     "Control humidity (60–75%)",
//     "Use sterilized substrate"
//   ],

//   quickActions: [
//     "Isolate affected mushrooms",
//     "Remove contaminated material",
//     "Reduce humidity immediately",
//     "Monitor for 24–48 hours"
//   ],

//   supplement1: {
//     name: "BioSafe Disinfectant",
//     description: "Surface disinfectant for trays and growing areas",
//     tags: ["Hygiene", "Preventive"]
//   },

//   supplement2: {
//     name: "Trichoderma Control Agent",
//     description: "Biological control to prevent green mold contamination",
//     tags: ["Biological", "Preventive"]
//   },
// };


// export default function DiseaseResult() {
//   const router = useRouter();
//   const { conf = "91.4", timestamp = "09:41" } = useLocalSearchParams();

//   const [analysis, setAnalysis] = useState(null);
//   const [loading,  setLoading]  = useState(true);
//   const [error,    setError]    = useState(false);

//   const severity = parseFloat(conf) > 85 ? "High" : parseFloat(conf) > 70 ? "Medium" : "Low";

//   useEffect(() => {
//     fetchDiseaseAnalysis(conf, severity)
//       .then((data) => setAnalysis(data))
//       .catch((err) => {
//         console.warn("Groq API failed, using fallback:", err.message);
//         setAnalysis(FALLBACK);
//         setError(true);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   // ── Loading state ───────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={s.root}>
//         <View style={s.loadingWrap}>
//           <View style={s.loadingCard}>
//             <ActivityIndicator size="large" color={C.amber2} />
//             <Text style={s.loadingTitle}>Analysing Disease</Text>
//             <Text style={s.loadingSub}>AI is generating treatment recommendations…</Text>
//           </View>
//         </View>
//         <BottomNav active="alerts" router={router} />
//       </View>
//     );
//   }

//   const d = analysis;

//   return (
//     <View style={s.root}>
//       <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

//         {/* TOP BAR */}
//         <View style={s.topbar}>
//           <TouchableOpacity style={s.icoBtn} onPress={() => router.back()}>
//             <Ionicons name="arrow-back" size={16} color={C.amber2} />
//           </TouchableOpacity>
//           <Text style={s.tbarTitle}>
//             Scan Result — <Text style={{ color: C.amber2, fontWeight: "500" }}>Camera #1</Text>
//           </Text>
//           <TouchableOpacity style={s.icoBtn} onPress={() => Alert.alert("Share", "Coming soon")}>
//             <Ionicons name="share-outline" size={16} color={C.muted} />
//           </TouchableOpacity>
//         </View>

//         {/* AI badge */}
//         {error ? (
//           <View style={s.offlineBadge}>
//             <Ionicons name="cloud-offline-outline" size={11} color={C.muted} />
//             <Text style={s.offlineText}>Offline mode — showing default analysis</Text>
//           </View>
//         ) : (
//           <View style={s.aiBadge}>
//             <Ionicons name="sparkles-outline" size={11} color={C.amber2} />
//             <Text style={s.aiText}>AI-generated analysis by Groq · llama3-8b</Text>
//           </View>
//         )}

//         {/* HERO */}
//         <View style={s.hero}>
//           <Text style={s.heroTag}>⚠  DISEASE DETECTED</Text>
//           <Text style={s.dname}>{d.diseaseName}</Text>
//           <Text style={s.dsci}>{d.scientificName}</Text>
//           <View style={s.sevRow}>
//             <View style={s.sevBadge}>
//               <Text style={s.sevBadgeText}>{severity} Severity</Text>
//             </View>
//             <Text style={s.cpill}>
//               Confidence <Text style={s.cpillNum}>{parseFloat(conf).toFixed(1)}%</Text>
//             </Text>
//           </View>
//           <View style={s.barBg}>
//             <View style={[s.barFill, { width: `${conf}%` }]} />
//           </View>
//           <View style={s.imgBox}>
//             <Ionicons name="camera-outline" size={28} color={C.cream} style={{ opacity: 0.2 }} />
//             <View style={s.imgLbl}>
//               <Text style={s.imgLblText}>
//                 Captured · {new Date().toISOString().slice(0, 10)} {timestamp}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* DESCRIPTION */}
//         <View style={s.dcard}>
//           <Text style={s.dcardTitle}>ℹ  Brief Description</Text>
//           <Text style={s.dcardText}>{d.description}</Text>
//           <View style={s.chips}>
//             {d.symptoms.map((sym) => (
//               <View key={sym} style={s.chip}>
//                 <Text style={s.chipText}>{sym}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* TREATMENT */}
//         <Text style={s.slbl}>TREATMENT & SUPPLEMENTS</Text>
//         <View style={s.twoCol}>
//           <View style={[s.treat, { borderColor: "rgba(224,96,80,0.22)" }]}>
//             <Text style={[s.dcardTitle, { color: C.infected, fontSize: 11 }]}>🛡 Prevention</Text>
//             {d.prevention.map((t, i) => (
//               <View key={i} style={s.step}>
//                 <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
//                 <Text style={s.stepT}>{t}</Text>
//               </View>
//             ))}
//           </View>
//           <View style={s.treat}>
//             <Text style={[s.dcardTitle, { fontSize: 11 }]}>⚡ Quick Actions</Text>
//             {d.quickActions.map((t, i) => (
//               <View key={i} style={s.step}>
//                 <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
//                 <Text style={s.stepT}>{t}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* SUPPLEMENTS */}
//         <Text style={s.slbl}>RECOMMENDED SUPPLEMENTS</Text>

//         <View style={s.suppCard}>
//           <View style={s.suppImg}><Text style={{ fontSize: 22 }}>🧴</Text></View>
//           <View style={{ flex: 1 }}>
//             <Text style={s.suppName}>{d.supplement1.name}</Text>
//             <Text style={s.suppDesc}>{d.supplement1.description}</Text>
//             <View style={s.suppTags}>
//               {d.supplement1.tags.map((t) => (
//                 <View key={t} style={s.stag}><Text style={s.stagText}>{t}</Text></View>
//               ))}
//             </View>
//             <TouchableOpacity onPress={() => Alert.alert("Buy", "Shop integration coming soon")}>
//               <LinearGradient colors={[C.brown, C.amber]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.buyBtn}>
//                 <Text style={s.buyBtnText}>Buy Product →</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={s.suppCard}>
//           <View style={s.suppImg}><Text style={{ fontSize: 22 }}>🧪</Text></View>
//           <View style={{ flex: 1 }}>
//             <Text style={s.suppName}>{d.supplement2.name}</Text>
//             <Text style={s.suppDesc}>{d.supplement2.description}</Text>
//             <View style={s.suppTags}>
//               {d.supplement2.tags.map((t) => (
//                 <View key={t} style={s.stag}><Text style={s.stagText}>{t}</Text></View>
//               ))}
//             </View>
//             <TouchableOpacity style={s.buyBtn2} onPress={() => Alert.alert("Details", "Coming soon")}>
//               <Text style={s.buyBtnText}>View Details →</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* ALSO CONSIDER */}
//         <Text style={s.slbl}>ALSO CONSIDER</Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
//           {SIMILAR.map((item) => (
//             <View key={item.name} style={s.simCard}>
//               <View style={s.simIco}><Text style={{ fontSize: 14 }}>{item.icon}</Text></View>
//               <Text style={s.simName}>{item.name}</Text>
//               <Text style={s.simMatch}>{item.match} match</Text>
//             </View>
//           ))}
//         </ScrollView>

//         <TouchableOpacity style={s.rescanBtn} onPress={() => router.back()}>
//           <Text style={s.rescanText}>← Rescan Mushroom</Text>
//         </TouchableOpacity>
//         <View style={{ height: 20 }} />
//       </ScrollView>

//       <BottomNav active="alerts" router={router} />
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { flex: 1 },
//   scrollContent: { paddingHorizontal: 14, paddingTop: 10 },

//   // Loading
//   loadingWrap:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
//   loadingCard:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 16, padding: 32, alignItems: "center", width: "100%" },
//   loadingTitle: { fontSize: 16, fontWeight: "700", color: C.cream, marginTop: 16, marginBottom: 6 },
//   loadingSub:   { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },

//   // AI badge
//   aiBadge:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(212,133,42,0.08)", borderWidth: 1, borderColor: "rgba(212,133,42,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
//   aiText:      { fontSize: 10, color: C.amber2 },
//   offlineBadge:{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
//   offlineText: { fontSize: 10, color: C.muted },

//   topbar:       { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
//   icoBtn:       { width: 30, height: 30, borderRadius: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
//   tbarTitle:    { flex: 1, fontSize: 11, color: C.muted, textAlign: "center" },
//   hero:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, padding: 12, marginBottom: 10 },
//   heroTag:      { fontSize: 9, letterSpacing: 2, color: C.infected, fontWeight: "500", marginBottom: 3 },
//   dname:        { fontSize: 19, fontWeight: "700", color: C.cream, lineHeight: 24, marginBottom: 2 },
//   dsci:         { fontSize: 11, color: C.muted, fontStyle: "italic", marginBottom: 10 },
//   sevRow:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
//   sevBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(224,96,80,0.13)", borderWidth: 1, borderColor: C.errBdr },
//   sevBadgeText: { fontSize: 10, fontWeight: "600", color: C.infected },
//   cpill:        { marginLeft: "auto", fontSize: 10, color: C.muted },
//   cpillNum:     { color: C.amber2, fontSize: 13, fontWeight: "700" },
//   barBg:        { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
//   barFill:      { height: "100%", borderRadius: 2, backgroundColor: C.infected },
//   imgBox:       { width: "100%", height: 120, backgroundColor: "#0a0604", borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
//   imgLbl:       { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
//   imgLblText:   { fontSize: 9, color: C.cream3 },
//   dcard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 11, marginBottom: 8 },
//   dcardTitle:   { fontSize: 12, fontWeight: "600", color: C.amber2, marginBottom: 5 },
//   dcardText:    { fontSize: 11, color: C.cream3, lineHeight: 18 },
//   chips:        { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
//   chip:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border2 },
//   chipText:     { fontSize: 10, color: C.cream3 },
//   slbl:         { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
//   twoCol:       { flexDirection: "row", gap: 8, marginBottom: 8 },
//   treat:        { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10 },
//   step:         { flexDirection: "row", gap: 6, marginTop: 7, alignItems: "flex-start" },
//   stepN:        { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(212,133,42,0.15)", borderWidth: 1, borderColor: "rgba(212,133,42,0.3)", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
//   stepNText:    { fontSize: 9, fontWeight: "600", color: C.amber2 },
//   stepT:        { fontSize: 10.5, color: C.cream3, lineHeight: 15, flex: 1 },
//   suppCard:     { flexDirection: "row", gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 10, marginBottom: 8 },
//   suppImg:      { width: 56, height: 56, backgroundColor: "#0a0604", borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   suppName:     { fontSize: 12, fontWeight: "600", color: C.cream, marginBottom: 2 },
//   suppDesc:     { fontSize: 10, color: C.muted, lineHeight: 15, marginBottom: 6 },
//   suppTags:     { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 7 },
//   stag:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: "rgba(212,133,42,0.10)", borderWidth: 1, borderColor: "rgba(212,133,42,0.2)" },
//   stagText:     { fontSize: 9, color: C.amber2 },
//   buyBtn:       { borderRadius: 8, padding: 7, alignItems: "center" },
//   buyBtnText:   { color: C.cream, fontSize: 11, fontWeight: "600" },
//   buyBtn2:      { borderRadius: 8, padding: 7, alignItems: "center", backgroundColor: "rgba(90,64,48,0.45)" },
//   simCard:      { minWidth: 90, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8, marginRight: 7 },
//   simIco:       { width: 30, height: 30, borderRadius: 7, backgroundColor: "rgba(224,96,80,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 5 },
//   simName:      { fontSize: 10, color: C.cream2, fontWeight: "500", lineHeight: 14, marginBottom: 2 },
//   simMatch:     { fontSize: 9, color: C.muted },
//   rescanBtn:    { width: "100%", padding: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 11, alignItems: "center", marginBottom: 4 },
//   rescanText:   { color: C.amber2, fontSize: 12, fontWeight: "500" },
// });



// DiseaseResult.js
// ─────────────────────────────────────────────────────────────────────────────
// Displays AI-generated disease analysis using Groq (llama-3.1-8b-instant).
// Falls back to static FALLBACK data instantly if Groq is unreachable or the
// key is missing — the screen NEVER stays on the loading spinner indefinitely.
//
// Requires GROQ_API_KEY in your .env file (react-native-dotenv / babel-plugin-dotenv)
// If the env key is missing/wrong the screen will show "Offline mode" fallback.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DiseaseResult.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives params from CameraAI:
 *   healthy      "true" | "false"
 *   conf         e.g. "91.4"
 *   timestamp    e.g. "14:32"
 *   processTime  e.g. "1.8s"
 *   fromServer   "true" | "false"
 *
 * Fix summary:
 *  1. Reads `healthy` param correctly (string → boolean)
 *  2. Shows HEALTHY result card too (not just infected)
 *  3. Groq fetch has 10s AbortController timeout + 12s safety net timer
 *  4. GROQ_API_KEY import wrapped in try/catch — missing key = fallback, no crash
 *  5. Loading spinner never hangs indefinitely
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BottomNav } from "../screens/Dashboard";

// ── Safely import GROQ key — won't crash if @env isn't configured ─────────────
let GROQ_KEY = "";
try {
  const env = require("@env");           // eslint-disable-line
  GROQ_KEY  = env.GROQ_API_KEY || "";
} catch (_) { /* @env not set up — will use fallback */ }

const GROQ_TIMEOUT_MS = 10000;

const C = {
  bg:       "#f9fafb",
  card:     "#ffffff",
  border:   "#e5e7eb",
  border2:  "#d1d5db",
  amber:    "#d97706",
  amber2:   "#f59e0b",
  brown:    "#92400e",
  infected: "#dc2626",
  healthy:  "#16a34a",
  errBdr:   "#fca5a5",
  cream:    "#1f2937",
  cream2:   "#374151",
  cream3:   "#6b7280",
  muted:    "#9ca3af",
};

const SIMILAR = [
  { icon: "💧", name: "Wet Bubble",       match: "78%" },
  { icon: "🌫", name: "Grey Mould",       match: "65%" },
  { icon: "🟤", name: "Dry Bubble",       match: "52%" },
  { icon: "🦠", name: "Bacterial Blotch", match: "49%" },
];

// ── Static fallback if Groq is unreachable ────────────────────────────────────
const FALLBACK_INFECTED = {
  diseaseName:    "Unknown Mushroom Infection",
  scientificName: "Fungal / Bacterial Contamination",
  description:    "The detected pattern may indicate early-stage contamination or environmental stress affecting mushroom growth.",
  symptoms:       ["Discoloration", "Abnormal growth", "Soft or slimy texture", "Unusual spots"],
  prevention:     ["Maintain hygiene", "Ensure ventilation", "Control humidity (60–75%)", "Use sterilized substrate"],
  quickActions:   ["Isolate affected area", "Remove contamination", "Reduce humidity", "Monitor 24–48 hours"],
  supplement1: { name: "BioSafe Disinfectant",      description: "Surface disinfectant for trays and growing areas", tags: ["Hygiene", "Preventive"] },
  supplement2: { name: "Trichoderma Control Agent", description: "Biological control to prevent green mold",         tags: ["Biological", "Preventive"] },
};

const FALLBACK_HEALTHY = {
  diseaseName:    "No Disease Detected",
  scientificName: "Mushroom appears healthy",
  description:    "The scan did not detect any signs of disease or contamination. Continue regular monitoring and maintain optimal growing conditions.",
  symptoms:       ["No visible discoloration", "Normal growth pattern", "Firm texture", "No abnormal spots"],
  prevention:     ["Maintain hygiene", "Monitor daily", "Keep humidity 60–75%", "Ensure good airflow"],
  quickActions:   ["Continue normal care", "Log this scan", "Check again in 24h", "Keep environment stable"],
  supplement1: { name: "Growth Enhancer",     description: "Supplements to boost healthy mushroom yield",     tags: ["Growth", "Preventive"] },
  supplement2: { name: "Substrate Optimizer", description: "Improves substrate nutrition and water retention", tags: ["Substrate", "Nutrition"] },
};

// Demo / Fallback local images
const DEMO_IMG_1 = require("../../assets/1.png");
const DEMO_IMG_2 = require("../../assets/2.png");
const DEMO_IMG_3 = require("../../assets/3.png");
const DEMO_IMG_4 = require("../../assets/4.png");
const DEMO_IMG_5 = require("../../assets/5.png");
const DEMO_IMG_6 = require("../../assets/6.png");
const DEMO_IMG_7 = require("../../assets/7.png");


// ── Groq API call with abort timeout ─────────────────────────────────────────
async function fetchDiseaseAnalysis(conf, severity, isHealthy) {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set");

  const status = isHealthy ? "healthy" : "infected";
  const prompt = `You are a mycology expert. A mushroom scan shows the mushroom is ${status} with ${conf}% confidence and ${severity} severity.

Return ONLY a valid JSON object (no markdown) with this exact shape:
{
  "diseaseName": "string",
  "scientificName": "string",
  "description": "string (2-3 sentences)",
  "symptoms": ["item1","item2","item3","item4"],
  "prevention": ["step1","step2","step3","step4"],
  "quickActions": ["action1","action2","action3","action4"],
  "supplement1": { "name": "string", "description": "string", "tags": ["tag1","tag2"] },
  "supplement2": { "name": "string", "description": "string", "tags": ["tag1","tag2"] }
}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  let res;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        messages:    [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens:  800,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }

  if (!res.ok) throw new Error(`Groq error ${res.status}`);

  const data  = await res.json();
  const raw   = data.choices[0].message.content.trim();
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DiseaseResult() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse params — all arrive as strings from router.push
  const conf        = params.conf        ?? "91.4";
  const timestamp   = params.timestamp   ?? "—";
  const processTime = params.processTime ?? "—";
  const fromServer  = params.fromServer  === "true";
  // "true" string → boolean
  const isHealthy   = params.healthy === "true";

  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [offline,  setOffline]  = useState(false);

  const confFloat = parseFloat(conf);
  const severity  = confFloat > 85 ? "High" : confFloat > 70 ? "Medium" : "Low";
  const fallback  = isHealthy ? FALLBACK_HEALTHY : FALLBACK_INFECTED;

  useEffect(() => {
    let cancelled = false;

    fetchDiseaseAnalysis(conf, severity, isHealthy)
      .then(data => { if (!cancelled) setAnalysis(data); })
      .catch(err => {
        console.warn("Groq fallback:", err.message);
        if (!cancelled) { setAnalysis(fallback); setOffline(true); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Absolute safety net — never spin more than 12 s
    const safety = setTimeout(() => {
      if (!cancelled) {
        setAnalysis(f => f ?? fallback);
        setOffline(true);
        setLoading(false);
      }
    }, GROQ_TIMEOUT_MS + 2000);

    return () => { cancelled = true; clearTimeout(safety); };
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <View style={s.loadingWrap}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={C.amber2} />
            <Text style={s.loadingTitle}>Analysing Result</Text>
            <Text style={s.loadingSub}>AI is generating recommendations…</Text>
          </View>
        </View>
        <BottomNav active="alerts" router={router} />
      </View>
    );
  }

  const d           = analysis;
  const accentColor = isHealthy ? C.healthy : C.infected;
  const heroTag     = isHealthy ? "✓  HEALTHY MUSHROOM" : "⚠  DISEASE DETECTED";

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* TOP BAR */}
        <View style={s.topbar}>
          <TouchableOpacity style={s.icoBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={C.amber2} />
          </TouchableOpacity>
          <Text style={s.tbarTitle}>
            Scan Result — <Text style={{ color: C.amber2, fontWeight: "500" }}>Camera #1</Text>
          </Text>
          <TouchableOpacity style={s.icoBtn} onPress={() => Alert.alert("Share", "Coming soon")}>
            <Ionicons name="share-outline" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Source badge */}
        {offline ? (
          <View style={s.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={11} color={C.muted} />
            <Text style={s.offlineText}>Offline mode — showing default analysis</Text>
          </View>
        ) : (
          <View style={s.aiBadge}>
            <Ionicons name="sparkles-outline" size={11} color={C.amber2} />
            <Text style={s.aiText}>AI-generated · Groq llama-3.1-8b</Text>
          </View>
        )}

        {/* HERO CARD */}
        <View style={[s.hero, { borderColor: accentColor + "40" }]}>
          <Text style={[s.heroTag, { color: accentColor }]}>{heroTag}</Text>
          <Text style={s.dname}>{d.diseaseName}</Text>
          <Text style={s.dsci}>{d.scientificName}</Text>
          <View style={s.sevRow}>
            <View style={[s.sevBadge, { backgroundColor: accentColor + "18", borderColor: accentColor + "55" }]}>
              <Text style={[s.sevBadgeText, { color: accentColor }]}>{severity} Confidence</Text>
            </View>
            <Text style={s.cpill}>
              Score <Text style={s.cpillNum}>{confFloat.toFixed(1)}%</Text>
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${conf}%`, backgroundColor: accentColor }]} />
          </View>
          {/* Meta row */}
          <View style={s.heroMeta}>
            <Text style={s.metaItem}>📷 {params.isUpload === "true" ? "Uploaded Photo" : timestamp}</Text>
            <Text style={s.metaItem}>⚡ {processTime}</Text>
            <Text style={s.metaItem}>🤖 ResNet-50</Text>
            <Text style={s.metaItem}>{fromServer ? "🟢 EC2 Live" : "🟡 Demo"}</Text>
          </View>

          {/* Photo Display */}
          <View style={s.imgBox}>
            {params.imageUri ? (
              <Image source={{ uri: params.imageUri }} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "1" ? (
              <Image source={DEMO_IMG_1} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "2" ? (
              <Image source={DEMO_IMG_2} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "3" ? (
              <Image source={DEMO_IMG_3} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "4" ? (
              <Image source={DEMO_IMG_4} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "5" ? (
              <Image source={DEMO_IMG_5} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "6" ? (
              <Image source={DEMO_IMG_6} style={s.img} resizeMode="cover" />
            ) : params.demoImg === "7" ? (
              <Image source={DEMO_IMG_7} style={s.img} resizeMode="cover" />
            ) : (
              <View style={s.noImg}>
                <Ionicons name="camera" size={32} color={C.border2} />
                <Text style={s.noImgText}>Real-time image not available</Text>
              </View>
            )}
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={s.dcard}>
          <Text style={s.dcardTitle}>ℹ  Analysis</Text>
          <Text style={s.dcardText}>{d.description}</Text>
          <View style={s.chips}>
            {d.symptoms.map((sym) => (
              <View key={sym} style={s.chip}>
                <Text style={s.chipText}>{sym}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TREATMENT */}
        <Text style={s.slbl}>RECOMMENDATIONS</Text>
        <View style={s.twoCol}>
          <View style={[s.treat, { borderColor: accentColor + "30" }]}>
            <Text style={[s.dcardTitle, { color: accentColor, fontSize: 11 }]}>🛡 Prevention</Text>
            {d.prevention.map((t, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
                <Text style={s.stepT}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={s.treat}>
            <Text style={[s.dcardTitle, { fontSize: 11 }]}>⚡ Actions</Text>
            {d.quickActions.map((t, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
                <Text style={s.stepT}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SUPPLEMENTS */}
        <Text style={s.slbl}>RECOMMENDED SUPPLEMENTS</Text>

        {[
          { emoji: "🧴", data: d.supplement1 },
          { emoji: "🧪", data: d.supplement2 },
        ].map(({ emoji, data: sup }, idx) => (
          <View key={idx} style={s.suppCard}>
            <View style={s.suppImg}><Text style={{ fontSize: 22 }}>{emoji}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.suppName}>{sup.name}</Text>
              <Text style={s.suppDesc}>{sup.description}</Text>
              <View style={s.suppTags}>
                {sup.tags.map((t) => (
                  <View key={t} style={s.stag}><Text style={s.stagText}>{t}</Text></View>
                ))}
              </View>
              <TouchableOpacity onPress={() => Alert.alert(idx === 0 ? "Buy" : "Details", "Coming soon")}>
                {idx === 0
                  ? <LinearGradient colors={[C.brown, C.amber]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.buyBtn}>
                      <Text style={s.buyBtnText}>Buy Product →</Text>
                    </LinearGradient>
                  : <View style={s.buyBtn2}><Text style={s.buyBtnText}>View Details →</Text></View>
                }
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ALSO CONSIDER */}
        {!isHealthy && (
          <>
            <Text style={s.slbl}>ALSO CONSIDER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {SIMILAR.map((item) => (
                <View key={item.name} style={s.simCard}>
                  <View style={s.simIco}><Text style={{ fontSize: 14 }}>{item.icon}</Text></View>
                  <Text style={s.simName}>{item.name}</Text>
                  <Text style={s.simMatch}>{item.match} match</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <TouchableOpacity style={s.rescanBtn} onPress={() => router.back()}>
          <Text style={s.rescanText}>← Scan Again</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav active="alerts" router={router} />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10 },

  loadingWrap:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 16, padding: 32, alignItems: "center", width: "100%" },
  loadingTitle:  { fontSize: 16, fontWeight: "700", color: C.cream, marginTop: 16, marginBottom: 6 },
  loadingSub:    { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },

  aiBadge:       { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(217,119,6,0.08)", borderWidth: 1, borderColor: "rgba(217,119,6,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
  aiText:        { fontSize: 10, color: C.amber2 },
  offlineBadge:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
  offlineText:   { fontSize: 10, color: C.muted },

  topbar:        { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  icoBtn:        { width: 30, height: 30, borderRadius: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
  tbarTitle:     { flex: 1, fontSize: 11, color: C.muted, textAlign: "center" },

  hero:          { backgroundColor: C.card, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  heroTag:       { fontSize: 9, letterSpacing: 2, fontWeight: "600", marginBottom: 3 },
  dname:         { fontSize: 19, fontWeight: "700", color: C.cream, lineHeight: 24, marginBottom: 2 },
  dsci:          { fontSize: 11, color: C.muted, fontStyle: "italic", marginBottom: 10 },
  sevRow:        { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sevBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  sevBadgeText:  { fontSize: 10, fontWeight: "600" },
  cpill:         { marginLeft: "auto", fontSize: 10, color: C.muted },
  cpillNum:      { color: C.amber2, fontSize: 13, fontWeight: "700" },
  barBg:         { height: 4, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  barFill:       { height: "100%", borderRadius: 2 },
  heroMeta:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaItem:      { fontSize: 10, color: C.muted },

  dcard:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 11, marginBottom: 8 },
  dcardTitle:    { fontSize: 12, fontWeight: "600", color: C.amber2, marginBottom: 5 },
  dcardText:     { fontSize: 11, color: C.cream3, lineHeight: 18 },
  chips:         { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  chip:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.04)", borderWidth: 1, borderColor: C.border2 },
  chipText:      { fontSize: 10, color: C.cream3 },

  slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
  twoCol:        { flexDirection: "row", gap: 8, marginBottom: 8 },
  treat:         { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10 },
  step:          { flexDirection: "row", gap: 6, marginTop: 7, alignItems: "flex-start" },
  stepN:         { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(217,119,6,0.12)", borderWidth: 1, borderColor: "rgba(217,119,6,0.3)", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNText:     { fontSize: 9, fontWeight: "600", color: C.amber2 },
  stepT:         { fontSize: 10.5, color: C.cream3, lineHeight: 15, flex: 1 },

  suppCard:      { flexDirection: "row", gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 10, marginBottom: 8 },
  suppImg:       { width: 56, height: 56, backgroundColor: "#f3f4f6", borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suppName:      { fontSize: 12, fontWeight: "600", color: C.cream, marginBottom: 2 },
  suppDesc:      { fontSize: 10, color: C.muted, lineHeight: 15, marginBottom: 6 },
  suppTags:      { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 7 },
  stag:          { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: "rgba(217,119,6,0.08)", borderWidth: 1, borderColor: "rgba(217,119,6,0.2)" },
  stagText:      { fontSize: 9, color: C.amber2 },
  buyBtn:        { borderRadius: 8, padding: 7, alignItems: "center" },
  buyBtnText:    { color: "#fff", fontSize: 11, fontWeight: "600" },
  buyBtn2:       { borderRadius: 8, padding: 7, alignItems: "center", backgroundColor: "rgba(146,64,14,0.25)" },

  simCard:       { minWidth: 90, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8, marginRight: 7 },
  simIco:        { width: 30, height: 30, borderRadius: 7, backgroundColor: "rgba(220,38,38,0.07)", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  simName:       { fontSize: 10, color: C.cream2, fontWeight: "500", lineHeight: 14, marginBottom: 2 },
  simMatch:      { fontSize: 9, color: C.muted },

  rescanBtn:     { width: "100%", padding: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 11, alignItems: "center", marginBottom: 4 },
  rescanText:    { color: C.amber2, fontSize: 12, fontWeight: "500" },
});