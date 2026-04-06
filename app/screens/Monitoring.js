/**
 * Monitoring.js
 * Actuator Control Panel — styled to match MycoTrack dark amber theme
 * Content ported from index.tsx (Control Panel)
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
import { LinearGradient } from "expo-linear-gradient";
import { ref, set, onValue } from "firebase/database";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
};

// ─── Actuator Card ────────────────────────────────────────────────────────────

function ActuatorCard({ icon, title, subtitle, value, onToggle, runtime, mode, onModeToggle }) {
  const isOn = value;

  return (
    <View style={s.card}>
      {/* Header row */}
      <View style={s.cardRow}>
        <View style={s.cardLeft}>
          <View style={[s.iconBox, { borderColor: isOn ? C.amber + "88" : C.border2, backgroundColor: isOn ? C.brown + "55" : C.border + "66" }]}>
            <Ionicons name={icon} size={18} color={isOn ? C.amber2 : C.muted} />
          </View>
          <View>
            <Text style={s.cardTitle}>{title}</Text>
            <Text style={s.cardSub}>{subtitle}</Text>
          </View>
        </View>
        <Switch
          value={isOn}
          onValueChange={onToggle}
          trackColor={{ false: C.border2, true: C.brown }}
          thumbColor={isOn ? C.amber2 : C.muted}
        />
      </View>

      <View style={s.divider} />

      {/* Status & mode row */}
      <View style={s.metaRow}>
        <View style={[s.statusBadge, { borderColor: isOn ? C.healthy + "55" : C.border2, backgroundColor: isOn ? C.healthy + "18" : "transparent" }]}>
          <View style={[s.statusDot, { backgroundColor: isOn ? C.healthy : C.muted }]} />
          <Text style={[s.statusText, { color: isOn ? C.healthy : C.muted }]}>{isOn ? "ON" : "OFF"}</Text>
        </View>

        {/* Mode pill toggle */}
        <TouchableOpacity style={s.modePill} onPress={onModeToggle}>
          <Text style={s.modeLabel}>Mode</Text>
          <View style={s.modeVal}>
            <Text style={s.modeValText}>{mode}</Text>
            <Ionicons name="chevron-down" size={10} color={C.amber} style={{ marginLeft: 3 }} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Runtime */}
      {isOn && (
        <View style={s.runtimeRow}>
          <Ionicons name="flash-outline" size={11} color={C.amber} />
          <Text style={s.runtimeText}>Running for {formatTime(runtime)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Monitoring() {
  const router = useRouter();

  const [master,      setMaster]      = useState(true);
  const [fan,         setFan]         = useState(true);
  const [pump,        setPump]        = useState(false);
  const [humidifier,  setHumidifier]  = useState(true);

  const [fanMode,        setFanMode]        = useState("Auto");
  const [pumpMode,       setPumpMode]       = useState("Manual");
  const [humidifierMode, setHumidifierMode] = useState("Auto");

  const [fanTime,       setFanTime]       = useState(0);
  const [pumpTime,      setPumpTime]      = useState(0);
  const [humidifierTime, setHumidifierTime] = useState(0);

  const [editing,       setEditing]       = useState(false);
  const [fanSchedule,   setFanSchedule]   = useState("06:00 - 18:00");
  const [pumpSchedule,  setPumpSchedule]  = useState("Every 4 hours (15 min)");
  const [humidSchedule, setHumidSchedule] = useState("< 80% humidity");

  // Runtime counters
  useEffect(() => {
    const interval = setInterval(() => {
      if (fan)        setFanTime((t) => t + 1);
      if (pump)       setPumpTime((t) => t + 1);
      if (humidifier) setHumidifierTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [fan, pump, humidifier]);

  // Firebase sync
  useEffect(() => {
    if (!db) return;
    const unsub1 = onValue(ref(db, "actuators/pump"),       (s) => { if (s.exists()) setPump(s.val()); });
    const unsub2 = onValue(ref(db, "actuators/humidifier"), (s) => { if (s.exists()) setHumidifier(s.val()); });
    const unsub3 = onValue(ref(db, "actuators/fan"),        (s) => { if (s.exists()) setFan(s.val()); });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const toggleMode = (current, setter, fbPath) => {
    const next = current === "Auto" ? "Manual" : "Auto";
    setter(next);
    if (db) set(ref(db, fbPath), next);
  };

  const toggleActuator = (val, setter, fbPath, resetTimer) => {
    setter(val);
    if (db) set(ref(db, fbPath), val);
    if (!val) resetTimer(0);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Text style={s.ptag}>ACTUATORS</Text>
          <Text style={s.ptitle}>Control Panel</Text>
          <Text style={s.psub}>Actuator management</Text>

          {/* ── Master Power ── */}
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.cardLeft}>
                <View style={[s.iconBox, { borderColor: master ? C.amber + "88" : C.border2, backgroundColor: master ? C.brown + "55" : C.border + "66" }]}>
                  <Ionicons name="power-outline" size={18} color={master ? C.amber2 : C.muted} />
                </View>
                <View>
                  <Text style={s.cardTitle}>Master Power</Text>
                  <Text style={s.cardSub}>All actuators</Text>
                </View>
              </View>
              <Switch
                value={master}
                onValueChange={setMaster}
                trackColor={{ false: C.border2, true: C.brown }}
                thumbColor={master ? C.amber2 : C.muted}
              />
            </View>
          </View>

          {/* ── Fan ── */}
          <ActuatorCard
            icon="aperture-outline"
            title="5V DC Fan"
            subtitle="5V DC"
            value={fan}
            onToggle={(val) => toggleActuator(val, setFan, "actuators/fan", setFanTime)}
            runtime={fanTime}
            mode={fanMode}
            onModeToggle={() => toggleMode(fanMode, setFanMode, "actuators/fanMode")}
          />

          {/* ── Pump ── */}
          <ActuatorCard
            icon="water-outline"
            title="Water Pump"
            subtitle="12V DC"
            value={pump}
            onToggle={(val) => toggleActuator(val, setPump, "actuators/pump", setPumpTime)}
            runtime={pumpTime}
            mode={pumpMode}
            onModeToggle={() => toggleMode(pumpMode, setPumpMode, "actuators/pumpMode")}
          />

          {/* ── Humidifier ── */}
          <ActuatorCard
            icon="cloud-outline"
            title="Humidifier"
            subtitle="220V AC"
            value={humidifier}
            onToggle={(val) => toggleActuator(val, setHumidifier, "actuators/humidifier", setHumidifierTime)}
            runtime={humidifierTime}
            mode={humidifierMode}
            onModeToggle={() => toggleMode(humidifierMode, setHumidifierMode, "actuators/humidifierMode")}
          />

          {/* ── Schedule ── */}
          <View style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.slbl}>AUTOMATION SCHEDULE</Text>
              <TouchableOpacity
                style={[s.editBtn, editing && { backgroundColor: C.brown, borderColor: C.amber }]}
                onPress={() => setEditing(!editing)}
              >
                <Text style={[s.editBtnText, editing && { color: C.amber2 }]}>
                  {editing ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 10, gap: 8 }}>
              {editing ? (
                <>
                  <View style={s.scheduleEditRow}>
                    <Ionicons name="aperture-outline" size={12} color={C.muted} />
                    <TextInput value={fanSchedule}   onChangeText={setFanSchedule}   style={s.scheduleInput} placeholderTextColor={C.muted} />
                  </View>
                  <View style={s.scheduleEditRow}>
                    <Ionicons name="water-outline"   size={12} color={C.muted} />
                    <TextInput value={pumpSchedule}  onChangeText={setPumpSchedule}  style={s.scheduleInput} placeholderTextColor={C.muted} />
                  </View>
                  <View style={s.scheduleEditRow}>
                    <Ionicons name="cloud-outline"   size={12} color={C.muted} />
                    <TextInput value={humidSchedule} onChangeText={setHumidSchedule} style={s.scheduleInput} placeholderTextColor={C.muted} />
                  </View>
                </>
              ) : (
                <>
                  {[
                    { icon: "aperture-outline", label: "Fan",        val: fanSchedule   },
                    { icon: "water-outline",    label: "Pump",       val: pumpSchedule  },
                    { icon: "cloud-outline",    label: "Humidifier", val: humidSchedule },
                  ].map(({ icon, label, val }) => (
                    <View key={label} style={s.scheduleRow}>
                      <View style={s.scheduleLeft}>
                        <Ionicons name={icon} size={12} color={C.muted} />
                        <Text style={s.scheduleLabel}>{label}</Text>
                      </View>
                      <Text style={s.scheduleVal}>{val}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      <BottomNav active="monitoring" router={router} />
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
  slbl:   { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", textTransform: "uppercase" },

  card:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox:   { width: 36, height: 36, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: C.cream2 },
  cardSub:   { fontSize: 10, color: C.muted, marginTop: 1 },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  metaRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge:{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },

  modePill:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.border + "88", borderWidth: 1, borderColor: C.border2, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  modeLabel:   { fontSize: 10, color: C.muted },
  modeVal:     { flexDirection: "row", alignItems: "center" },
  modeValText: { fontSize: 11, color: C.amber2, fontWeight: "600" },

  runtimeRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  runtimeText: { fontSize: 11, color: C.amber, fontFamily: "monospace" },

  editBtn:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border2 },
  editBtnText: { fontSize: 11, color: C.muted, fontWeight: "500" },

  scheduleRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  scheduleLeft:     { flexDirection: "row", alignItems: "center", gap: 7 },
  scheduleLabel:    { fontSize: 12, color: C.muted },
  scheduleVal:      { fontSize: 12, color: C.cream3, fontFamily: "monospace", flex: 1, textAlign: "right" },
  scheduleEditRow:  { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 },
  scheduleInput:    { flex: 1, fontSize: 12, color: C.cream2, paddingVertical: 6 },
});