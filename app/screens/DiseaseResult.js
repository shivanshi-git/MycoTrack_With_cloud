import { GROQ_API_KEY } from '@env';
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BottomNav } from "./Dashboard";

const C = {
  bg:      "#f9fafb",   // main background (soft white)
  card:    "#ffffff",   // card background
  border:  "#e5e7eb",   // light border
  border2: "#d1d5db",   // slightly stronger border

  amber:   "#d97706",   // primary accent
  amber2:  "#f59e0b",   // highlight accent
  brown:   "#92400e",   // darker accent
  infected: "#dc2626",
  cream:   "#1f2937",   // main text (dark grey)
  cream2:  "#374151",   // secondary text
  cream3:  "#6b7280",   // tertiary text
  errBdr:   "#fca5a5",
  muted:   "#9ca3af",   // muted text

  healthy: "#16a34a",   // green
  warning: "#f59e0b",   // amber
  danger:  "#dc2626",   // red
};

const SIMILAR = [
  { icon: "💧", name: "Wet Bubble", match: "78%" },
  { icon: "🌫", name: "Grey Mould", match: "65%" },
  { icon: "🟤", name: "Dry Bubble", match: "52%" },
  { icon: "🦠", name: "Bacterial Blotch", match: "49%" },
];


// ── Call Groq and return parsed JSON ─────────────────────────────────────────
async function fetchDiseaseAnalysis(conf, severity) {
  const prompt = `You are a mycology disease expert. A mushroom scan detected a fungal infection with ${conf}% confidence and ${severity} severity.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:
{
  "diseaseName": "string",
  "scientificName": "string",
  "description": "string (2-3 sentences about the disease)",
  "symptoms": ["symptom1", "symptom2", "symptom3", "symptom4"],
  "prevention": ["step1", "step2", "step3", "step4"],
  "quickActions": ["action1", "action2", "action3", "action4"],
  "supplement1": {
    "name": "string",
    "description": "string",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "supplement2": {
    "name": "string",
    "description": "string",
    "tags": ["tag1", "tag2"]
  }
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",   // ← updated: llama3-8b-8192 is deprecated
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Fallback data if API fails ────────────────────────────────────────────────
const FALLBACK = {
  diseaseName: "Unknown Mushroom Infection",
  scientificName: "Fungal / Bacterial Contamination",
  description: "The detected pattern does not match known conditions. It may indicate early-stage contamination or environmental stress affecting mushroom growth.",
  
  symptoms: [
    "Discoloration",
    "Abnormal growth",
    "Soft or slimy texture",
    "Unusual spots or patches"
  ],

  prevention: [
    "Maintain hygiene in growing area",
    "Ensure proper ventilation",
    "Control humidity (60–75%)",
    "Use sterilized substrate"
  ],

  quickActions: [
    "Isolate affected mushrooms",
    "Remove contaminated material",
    "Reduce humidity immediately",
    "Monitor for 24–48 hours"
  ],

  supplement1: {
    name: "BioSafe Disinfectant",
    description: "Surface disinfectant for trays and growing areas",
    tags: ["Hygiene", "Preventive"]
  },

  supplement2: {
    name: "Trichoderma Control Agent",
    description: "Biological control to prevent green mold contamination",
    tags: ["Biological", "Preventive"]
  },
};


export default function DiseaseResult() {
  const router = useRouter();
  const { conf = "91.4", timestamp = "09:41" } = useLocalSearchParams();

  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const severity = parseFloat(conf) > 85 ? "High" : parseFloat(conf) > 70 ? "Medium" : "Low";

  useEffect(() => {
    fetchDiseaseAnalysis(conf, severity)
      .then((data) => setAnalysis(data))
      .catch((err) => {
        console.warn("Groq API failed, using fallback:", err.message);
        setAnalysis(FALLBACK);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <View style={s.loadingWrap}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={C.amber2} />
            <Text style={s.loadingTitle}>Analysing Disease</Text>
            <Text style={s.loadingSub}>AI is generating treatment recommendations…</Text>
          </View>
        </View>
        <BottomNav active="alerts" router={router} />
      </View>
    );
  }

  const d = analysis;

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

        {/* AI badge */}
        {error ? (
          <View style={s.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={11} color={C.muted} />
            <Text style={s.offlineText}>Offline mode — showing default analysis</Text>
          </View>
        ) : (
          <View style={s.aiBadge}>
            <Ionicons name="sparkles-outline" size={11} color={C.amber2} />
            <Text style={s.aiText}>AI-generated analysis by Groq · llama3-8b</Text>
          </View>
        )}

        {/* HERO */}
        <View style={s.hero}>
          <Text style={s.heroTag}>⚠  DISEASE DETECTED</Text>
          <Text style={s.dname}>{d.diseaseName}</Text>
          <Text style={s.dsci}>{d.scientificName}</Text>
          <View style={s.sevRow}>
            <View style={s.sevBadge}>
              <Text style={s.sevBadgeText}>{severity} Severity</Text>
            </View>
            <Text style={s.cpill}>
              Confidence <Text style={s.cpillNum}>{parseFloat(conf).toFixed(1)}%</Text>
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${conf}%` }]} />
          </View>
          <View style={s.imgBox}>
            <Ionicons name="camera-outline" size={28} color={C.cream} style={{ opacity: 0.2 }} />
            <View style={s.imgLbl}>
              <Text style={s.imgLblText}>
                Captured · {new Date().toISOString().slice(0, 10)} {timestamp}
              </Text>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={s.dcard}>
          <Text style={s.dcardTitle}>ℹ  Brief Description</Text>
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
        <Text style={s.slbl}>TREATMENT & SUPPLEMENTS</Text>
        <View style={s.twoCol}>
          <View style={[s.treat, { borderColor: "rgba(224,96,80,0.22)" }]}>
            <Text style={[s.dcardTitle, { color: C.infected, fontSize: 11 }]}>🛡 Prevention</Text>
            {d.prevention.map((t, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
                <Text style={s.stepT}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={s.treat}>
            <Text style={[s.dcardTitle, { fontSize: 11 }]}>⚡ Quick Actions</Text>
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

        <View style={s.suppCard}>
          <View style={s.suppImg}><Text style={{ fontSize: 22 }}>🧴</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.suppName}>{d.supplement1.name}</Text>
            <Text style={s.suppDesc}>{d.supplement1.description}</Text>
            <View style={s.suppTags}>
              {d.supplement1.tags.map((t) => (
                <View key={t} style={s.stag}><Text style={s.stagText}>{t}</Text></View>
              ))}
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Buy", "Shop integration coming soon")}>
              <LinearGradient colors={[C.brown, C.amber]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.buyBtn}>
                <Text style={s.buyBtnText}>Buy Product →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.suppCard}>
          <View style={s.suppImg}><Text style={{ fontSize: 22 }}>🧪</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.suppName}>{d.supplement2.name}</Text>
            <Text style={s.suppDesc}>{d.supplement2.description}</Text>
            <View style={s.suppTags}>
              {d.supplement2.tags.map((t) => (
                <View key={t} style={s.stag}><Text style={s.stagText}>{t}</Text></View>
              ))}
            </View>
            <TouchableOpacity style={s.buyBtn2} onPress={() => Alert.alert("Details", "Coming soon")}>
              <Text style={s.buyBtnText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ALSO CONSIDER */}
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

        <TouchableOpacity style={s.rescanBtn} onPress={() => router.back()}>
          <Text style={s.rescanText}>← Rescan Mushroom</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav active="alerts" router={router} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10 },

  // Loading
  loadingWrap:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingCard:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 16, padding: 32, alignItems: "center", width: "100%" },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: C.cream, marginTop: 16, marginBottom: 6 },
  loadingSub:   { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },

  // AI badge
  aiBadge:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(212,133,42,0.08)", borderWidth: 1, borderColor: "rgba(212,133,42,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
  aiText:      { fontSize: 10, color: C.amber2 },
  offlineBadge:{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, color: C.muted },

  topbar:       { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  icoBtn:       { width: 30, height: 30, borderRadius: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, alignItems: "center", justifyContent: "center" },
  tbarTitle:    { flex: 1, fontSize: 11, color: C.muted, textAlign: "center" },
  hero:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, padding: 12, marginBottom: 10 },
  heroTag:      { fontSize: 9, letterSpacing: 2, color: C.infected, fontWeight: "500", marginBottom: 3 },
  dname:        { fontSize: 19, fontWeight: "700", color: C.cream, lineHeight: 24, marginBottom: 2 },
  dsci:         { fontSize: 11, color: C.muted, fontStyle: "italic", marginBottom: 10 },
  sevRow:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sevBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(224,96,80,0.13)", borderWidth: 1, borderColor: C.errBdr },
  sevBadgeText: { fontSize: 10, fontWeight: "600", color: C.infected },
  cpill:        { marginLeft: "auto", fontSize: 10, color: C.muted },
  cpillNum:     { color: C.amber2, fontSize: 13, fontWeight: "700" },
  barBg:        { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  barFill:      { height: "100%", borderRadius: 2, backgroundColor: C.infected },
  imgBox:       { width: "100%", height: 120, backgroundColor: "#0a0604", borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  imgLbl:       { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  imgLblText:   { fontSize: 9, color: C.cream3 },
  dcard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 11, marginBottom: 8 },
  dcardTitle:   { fontSize: 12, fontWeight: "600", color: C.amber2, marginBottom: 5 },
  dcardText:    { fontSize: 11, color: C.cream3, lineHeight: 18 },
  chips:        { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  chip:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border2 },
  chipText:     { fontSize: 10, color: C.cream3 },
  slbl:         { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
  twoCol:       { flexDirection: "row", gap: 8, marginBottom: 8 },
  treat:        { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10 },
  step:         { flexDirection: "row", gap: 6, marginTop: 7, alignItems: "flex-start" },
  stepN:        { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(212,133,42,0.15)", borderWidth: 1, borderColor: "rgba(212,133,42,0.3)", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNText:    { fontSize: 9, fontWeight: "600", color: C.amber2 },
  stepT:        { fontSize: 10.5, color: C.cream3, lineHeight: 15, flex: 1 },
  suppCard:     { flexDirection: "row", gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 10, marginBottom: 8 },
  suppImg:      { width: 56, height: 56, backgroundColor: "#0a0604", borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suppName:     { fontSize: 12, fontWeight: "600", color: C.cream, marginBottom: 2 },
  suppDesc:     { fontSize: 10, color: C.muted, lineHeight: 15, marginBottom: 6 },
  suppTags:     { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 7 },
  stag:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: "rgba(212,133,42,0.10)", borderWidth: 1, borderColor: "rgba(212,133,42,0.2)" },
  stagText:     { fontSize: 9, color: C.amber2 },
  buyBtn:       { borderRadius: 8, padding: 7, alignItems: "center" },
  buyBtnText:   { color: C.cream, fontSize: 11, fontWeight: "600" },
  buyBtn2:      { borderRadius: 8, padding: 7, alignItems: "center", backgroundColor: "rgba(90,64,48,0.45)" },
  simCard:      { minWidth: 90, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8, marginRight: 7 },
  simIco:       { width: 30, height: 30, borderRadius: 7, backgroundColor: "rgba(224,96,80,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  simName:      { fontSize: 10, color: C.cream2, fontWeight: "500", lineHeight: 14, marginBottom: 2 },
  simMatch:     { fontSize: 9, color: C.muted },
  rescanBtn:    { width: "100%", padding: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 11, alignItems: "center", marginBottom: 4 },
  rescanText:   { color: C.amber2, fontSize: 12, fontWeight: "500" },
});