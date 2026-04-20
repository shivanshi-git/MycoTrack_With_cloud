
// // // import React, { useState, useEffect, useRef } from "react";
// // // import {
// // //   View, Text, TouchableOpacity, StyleSheet,
// // //   ScrollView, Animated, Easing, Alert,
// // // } from "react-native";
// // // import { Ionicons } from "@expo/vector-icons";
// // // import { LinearGradient } from "expo-linear-gradient";
// // // import { useRouter } from "expo-router";
// // // import { CameraView, useCameraPermissions } from "expo-camera";
// // // import { BottomNav } from "./Dashboard";

// // // // ─── YOUR PC's IP — must be on same Wi-Fi / phone hotspot ─────────────────────
// // // const BACKEND_URL = "http://172.19.10.11:8000"; // ← change if IP changes
// // // // ──────────────────────────────────────────────────────────────────────────────

// // // const C = {
// // //   bg: "#110a04", card: "#1a1008", border: "#2a1c0e", border2: "#3a2510",
// // //   amber: "#d4852a", amber2: "#f0a535", brown: "#5a3010",
// // //   cream: "#f0e6d8", cream2: "#d8c8b0", cream3: "#b8a088",
// // //   muted: "#7a6050", healthy: "#7db87a", infected: "#e06050",
// // // };

// // // const INITIAL_SCANS = [
// // //   { time: "14:32", conf: 94.2, healthy: true  },
// // //   { time: "11:15", conf: 96.8, healthy: true  },
// // //   { time: "08:00", conf: 87.3, healthy: false },
// // // ];

// // // export default function CameraAI() {
// // //   const router = useRouter();
// // //   const cameraRef = useRef(null);

// // //   const [permission, requestPermission] = useCameraPermissions();
// // //   const [scanning,   setScanning]       = useState(false);
// // //   const [scans,      setScans]          = useState(INITIAL_SCANS);
// // //   const [result,     setResult]         = useState({
// // //     healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
// // //   });

// // //   const scanAnim  = useRef(new Animated.Value(0)).current;
// // //   const pulseAnim = useRef(new Animated.Value(1)).current;
// // //   const fadeAnim  = useRef(new Animated.Value(0)).current;

// // //   // ── Scanning line animation ─────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const loop = Animated.loop(
// // //       Animated.sequence([
// // //         Animated.timing(scanAnim, {
// // //           toValue: 1, duration: 2500,
// // //           easing: Easing.inOut(Easing.ease), useNativeDriver: true,
// // //         }),
// // //         Animated.timing(scanAnim, {
// // //           toValue: 0, duration: 2500,
// // //           easing: Easing.inOut(Easing.ease), useNativeDriver: true,
// // //         }),
// // //       ])
// // //     );
// // //     loop.start();
// // //     return () => loop.stop();
// // //   }, []);

// // //   // ── Pulse animation when scanning ──────────────────────────────────────────
// // //   useEffect(() => {
// // //     if (scanning) {
// // //       const pulse = Animated.loop(
// // //         Animated.sequence([
// // //           Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
// // //           Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
// // //         ])
// // //       );
// // //       pulse.start();
// // //       return () => pulse.stop();
// // //     } else {
// // //       pulseAnim.setValue(1);
// // //     }
// // //   }, [scanning]);

// // //   // ── Result fade-in after scan ───────────────────────────────────────────────
// // //   const showResultAnim = () => {
// // //     fadeAnim.setValue(0);
// // //     Animated.timing(fadeAnim, {
// // //       toValue: 1, duration: 600, useNativeDriver: true,
// // //     }).start();
// // //   };

// // //   // ── Main: capture photo from live camera → send to backend ─────────────────
// // //   const doScan = async () => {
// // //     if (scanning || !cameraRef.current) return;

// // //     if (!permission?.granted) {
// // //       const { granted } = await requestPermission();
// // //       if (!granted) {
// // //         Alert.alert("Camera Permission", "Please allow camera access to scan mushrooms.");
// // //         return;
// // //       }
// // //     }

// // //     setScanning(true);
// // //     const startTime = Date.now();

// // //     try {
// // //       // ── Take photo from the live viewfinder instantly ──────────────────────
// // //       const photo = await cameraRef.current.takePictureAsync({
// // //         quality: 0.8,
// // //         base64: false,
// // //         skipProcessing: true,
// // //       });

// // //       // ── POST photo to FastAPI /predict ─────────────────────────────────────
// // //       const formData = new FormData();
// // //       formData.append("file", {
// // //         uri: photo.uri,
// // //         type: "image/jpeg",
// // //         name: "mushroom_scan.jpg",
// // //       });

// // //       const response = await fetch(`${BACKEND_URL}/predict`, {
// // //         method: "POST",
// // //         body: formData,
// // //       });

// // //       if (!response.ok) throw new Error(`Server error ${response.status}`);

// // //       const { healthy, confidence } = await response.json();

// // //       const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
// // //       const now = new Date();
// // //       const pad = (n) => String(n).padStart(2, "0");
// // //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

// // //       setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
// // //       setScans((prev) => [{ time, conf: confidence, healthy }, ...prev].slice(0, 5));
// // //       showResultAnim();

// // //       // ── If infected → navigate to DiseaseResult ────────────────────────────
// // //       if (!healthy) {
// // //         setTimeout(() => {
// // //           router.push({
// // //             pathname: "/screens/DiseaseResult",
// // //             params: { conf: confidence.toString(), timestamp: time, processTime: elapsed },
// // //           });
// // //         }, 800);
// // //       }

// // //     } catch (err) {
// // //       console.warn("Scan error:", err.message);

// // //       // ── Fallback mock if backend is offline ────────────────────────────────
// // //       const isHealthy = Math.random() > 0.35;
// // //       const conf = isHealthy
// // //         ? parseFloat((88 + Math.random() * 10).toFixed(1))
// // //         : parseFloat((70 + Math.random() * 18).toFixed(1));
// // //       const now = new Date();
// // //       const pad = (n) => String(n).padStart(2, "0");
// // //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
// // //       const pt   = `${(1.2 + Math.random() * 1.2).toFixed(1)}s`;

// // //       setResult({ healthy: isHealthy, conf, timestamp: time, processTime: pt });
// // //       setScans((prev) => [{ time, conf, healthy: isHealthy }, ...prev].slice(0, 5));
// // //       showResultAnim();

// // //       Alert.alert(
// // //         "⚠ Backend Offline",
// // //         `Could not reach server.\n\nCheck:\n• Server is running on PC\n• Phone & PC on same Wi-Fi/hotspot\n• BACKEND_URL is correct IP\n\nShowing mock result.`,
// // //         [{ text: "OK" }]
// // //       );

// // //       if (!isHealthy) {
// // //         setTimeout(() => {
// // //           router.push({
// // //             pathname: "/screens/DiseaseResult",
// // //             params: { conf: conf.toString(), timestamp: time, processTime: pt },
// // //           });
// // //         }, 800);
// // //       }

// // //     } finally {
// // //       setScanning(false);
// // //     }
// // //   };

// // //   const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
// // //   const statusColor = result.healthy ? C.healthy : C.infected;
// // //   const statusLabel = result.healthy ? "Healthy" : "Infected";
// // //   const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

// // //   // ── Permission loading ─────────────────────────────────────────────────────
// // //   if (!permission) return <View style={s.root} />;

// // //   // ── Permission denied ──────────────────────────────────────────────────────
// // //   if (!permission.granted) {
// // //     return (
// // //       <View style={[s.root, s.permCenter]}>
// // //         <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
// // //         <Text style={s.permTitle}>Camera Access Needed</Text>
// // //         <Text style={s.permSub}>Grant permission to scan mushrooms for disease detection</Text>
// // //         <TouchableOpacity onPress={requestPermission}>
// // //           <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
// // //             <Text style={s.permBtnText}>Grant Camera Access</Text>
// // //           </LinearGradient>
// // //         </TouchableOpacity>
// // //         <BottomNav active="camera" router={router} />
// // //       </View>
// // //     );
// // //   }

// // //   return (
// // //     <View style={s.root}>
// // //       <ScrollView
// // //         style={s.scroll}
// // //         contentContainerStyle={s.scrollContent}
// // //         showsVerticalScrollIndicator={false}
// // //       >
// // //         <Text style={s.ptag}>DISEASE DETECTION</Text>
// // //         <Text style={s.ptitle}>
// // //           <Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module
// // //         </Text>
// // //         <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

// // //         {/* ── LIVE CAMERA VIEWFINDER ─────────────────────────────────────── */}
// // //         <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>
// // //           <CameraView
// // //             ref={cameraRef}
// // //             style={s.camera}
// // //             facing="back"
// // //           >
// // //             {/* Corner bracket overlays */}
// // //             <View style={s.overlay}>
// // //               <View style={[s.corner, s.tl]} />
// // //               <View style={[s.corner, s.tr]} />
// // //               <View style={[s.corner, s.bl]} />
// // //               <View style={[s.corner, s.br]} />

// // //               {/* Animated scan line */}
// // //               <Animated.View
// // //                 style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
// // //               />

// // //               {/* Scanning badge shown in centre while processing */}
// // //               {scanning && (
// // //                 <View style={s.scanOverlay}>
// // //                   <View style={s.scanBadge}>
// // //                     <Ionicons name="scan-outline" size={14} color={C.amber2} />
// // //                     <Text style={s.scanBadgeText}>Analysing…</Text>
// // //                   </View>
// // //                 </View>
// // //               )}

// // //               {/* Green/red tint flash after result */}
// // //               <Animated.View
// // //                 pointerEvents="none"
// // //                 style={[
// // //                   s.resultFlash,
// // //                   {
// // //                     opacity: fadeAnim,
// // //                     backgroundColor: result.healthy
// // //                       ? "rgba(125,184,122,0.15)"
// // //                       : "rgba(224,96,80,0.15)",
// // //                   },
// // //                 ]}
// // //               />
// // //             </View>
// // //           </CameraView>

// // //           {/* Footer bar below camera */}
// // //           <View style={s.camFooter}>
// // //             <View>
// // //               <Text style={s.camLbl}>
// // //                 Camera <Text style={s.camLblBold}>#1 — Live Feed</Text>
// // //               </Text>
// // //               <Text style={s.camSub}>Tap button to capture & analyse</Text>
// // //             </View>
// // //             <TouchableOpacity onPress={doScan} disabled={scanning}>
// // //               <LinearGradient
// // //                 colors={scanning ? ["#3a2510", "#5a3010"] : [C.brown, C.amber]}
// // //                 start={{ x: 0, y: 0 }}
// // //                 end={{ x: 1, y: 1 }}
// // //                 style={s.capBtn}
// // //               >
// // //                 <Ionicons
// // //                   name={scanning ? "hourglass-outline" : "camera"}
// // //                   size={13}
// // //                   color={C.cream}
// // //                   style={{ marginRight: 5 }}
// // //                 />
// // //                 <Text style={s.capBtnText}>
// // //                   {scanning ? "Scanning…" : "Capture & Analyse"}
// // //                 </Text>
// // //               </LinearGradient>
// // //             </TouchableOpacity>
// // //           </View>
// // //         </Animated.View>

// // //         {/* ── LATEST RESULT CARD ─────────────────────────────────────────── */}
// // //         <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
// // //         <Animated.View style={[s.resCard, { opacity: fadeAnim.interpolate({
// // //           inputRange: [0, 1], outputRange: [0.5, 1],
// // //         }) }]}>
// // //           <View style={s.resTop}>
// // //             <View style={s.resLeft}>
// // //               <View style={[s.statIco, {
// // //                 borderColor: statusColor + "88",
// // //                 backgroundColor: statusColor + "26",
// // //               }]}>
// // //                 <Ionicons name={statusIcon} size={14} color={statusColor} />
// // //               </View>
// // //               <View style={{ marginLeft: 7 }}>
// // //                 <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
// // //                 <Text style={s.statSub}>Classification confidence</Text>
// // //               </View>
// // //             </View>
// // //             <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
// // //           </View>
// // //           <View style={s.barBg}>
// // //             <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
// // //           </View>
// // //           <View style={s.metaGrid}>
// // //             {[
// // //               ["Timestamp",  result.timestamp],
// // //               ["Model",      "ResNet-50"],
// // //               ["Process",    result.processTime],
// // //               ["Resolution", "4:3"],
// // //             ].map(([k, v]) => (
// // //               <View key={k} style={s.metaRow}>
// // //                 <Text style={s.mk}>{k}</Text>
// // //                 <Text style={s.mv}>{v}</Text>
// // //               </View>
// // //             ))}
// // //           </View>
// // //         </Animated.View>

// // //         {/* ── RECENT SCANS ───────────────────────────────────────────────── */}
// // //         <Text style={s.slbl}>RECENT SCANS</Text>
// // //         {scans.map((sc, i) => (
// // //           <View key={i} style={s.scanRow}>
// // //             <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
// // //             <Text style={s.stime}>{sc.time}</Text>
// // //             <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
// // //             <View style={[s.sbadge,
// // //               sc.healthy
// // //                 ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
// // //                 : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
// // //             ]}>
// // //               <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
// // //                 {sc.healthy ? "Healthy" : "Infected"}
// // //               </Text>
// // //             </View>
// // //           </View>
// // //         ))}

// // //         <View style={{ height: 20 }} />
// // //       </ScrollView>

// // //       <BottomNav active="camera" router={router} />
// // //     </View>
// // //   );
// // // }

// // // const s = StyleSheet.create({
// // //   root:          { flex: 1, backgroundColor: C.bg },
// // //   scroll:        { flex: 1 },
// // //   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

// // //   permCenter:    { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
// // //   permTitle:     { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
// // //   permSub:       { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
// // //   permBtn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
// // //   permBtnText:   { color: C.cream, fontSize: 13, fontWeight: "600" },

// // //   ptag:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
// // //   ptitle:        { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
// // //   psub:          { fontSize: 12, color: C.cream3, marginBottom: 14 },

// // //   // Camera
// // //   camCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
// // //   camera:        { width: "100%", aspectRatio: 4 / 3 },
// // //   overlay:       { ...StyleSheet.absoluteFillObject },
// // //   corner:        { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
// // //   tl:            { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
// // //   tr:            { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
// // //   bl:            { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
// // //   br:            { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
// // //   scanLine:      { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%", shadowColor: C.amber2, shadowOpacity: 1, shadowRadius: 6 },
// // //   scanOverlay:   { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
// // //   scanBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.78)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
// // //   scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
// // //   resultFlash:   { ...StyleSheet.absoluteFillObject },

// // //   camFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
// // //   camLbl:        { fontSize: 10, color: C.muted },
// // //   camLblBold:    { color: C.amber2, fontWeight: "500" },
// // //   camSub:        { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
// // //   capBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
// // //   capBtnText:    { color: C.cream, fontSize: 11, fontWeight: "600" },

// // //   slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
// // //   resCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
// // //   resTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
// // //   resLeft:       { flexDirection: "row", alignItems: "center" },
// // //   statIco:       { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
// // //   statName:      { fontSize: 15, fontWeight: "600" },
// // //   statSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
// // //   confNum:       { fontSize: 24, fontWeight: "700", color: C.amber2 },
// // //   barBg:         { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
// // //   barFill:       { height: "100%", borderRadius: 2 },
// // //   metaGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 5 },
// // //   metaRow:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
// // //   mk:            { fontSize: 10, color: C.muted },
// // //   mv:            { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

// // //   scanRow:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
// // //   sdot:          { width: 7, height: 7, borderRadius: 4 },
// // //   stime:         { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
// // //   sconf:         { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
// // //   sbadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
// // //   sbadgeText:    { fontSize: 9, fontWeight: "600" },
// // // });


// // import React, { useState, useEffect, useRef } from "react";
// // import {
// //   View, Text, TouchableOpacity, StyleSheet,
// //   ScrollView, Animated, Easing, Alert,
// // } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { useRouter } from "expo-router";
// // import { CameraView, useCameraPermissions } from "expo-camera";
// // import { BottomNav } from "./Dashboard";

// // // ─── YOUR PC's IP ──────────────────────────────────────────────────────────────
// // const BACKEND_URL = "http://172.19.10.11:8000"; // ← update if IP changes
// // // ──────────────────────────────────────────────────────────────────────────────

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

// // const INITIAL_SCANS = [
// //   { time: "14:32", conf: 94.2, healthy: true  },
// //   { time: "11:15", conf: 96.8, healthy: true  },
// //   { time: "08:00", conf: 87.3, healthy: false },
// // ];

// // export default function CameraAI() {
// //   const router    = useRouter();
// //   const cameraRef = useRef(null);

// //   const [permission, requestPermission] = useCameraPermissions();
// //   const [scanning,   setScanning]       = useState(false);
// //   const [scans,      setScans]          = useState(INITIAL_SCANS);
// //   const [result,     setResult]         = useState({
// //     healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
// //   });

// //   const scanAnim  = useRef(new Animated.Value(0)).current;
// //   const pulseAnim = useRef(new Animated.Value(1)).current;
// //   const fadeAnim  = useRef(new Animated.Value(0.5)).current;

// //   // ── Scan line loop ──────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const loop = Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(scanAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
// //         Animated.timing(scanAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
// //       ])
// //     );
// //     loop.start();
// //     return () => loop.stop();
// //   }, []);

// //   // ── Pulse while scanning ────────────────────────────────────────────────────
// //   useEffect(() => {
// //     if (scanning) {
// //       const p = Animated.loop(
// //         Animated.sequence([
// //           Animated.timing(pulseAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
// //           Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
// //         ])
// //       );
// //       p.start();
// //       return () => p.stop();
// //     } else {
// //       pulseAnim.setValue(1);
// //     }
// //   }, [scanning]);

// //   const showResultAnim = () => {
// //     fadeAnim.setValue(0);
// //     Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
// //   };

// //   // ── Capture + send to backend ───────────────────────────────────────────────
// //   const doScan = async () => {
// //     if (scanning || !cameraRef.current) return;

// //     if (!permission?.granted) {
// //       const { granted } = await requestPermission();
// //       if (!granted) {
// //         Alert.alert("Permission needed", "Allow camera access to scan mushrooms.");
// //         return;
// //       }
// //     }

// //     setScanning(true);
// //     const t0 = Date.now();

// //     try {
// //       // Capture photo from live viewfinder
// //       const photo = await cameraRef.current.takePictureAsync({
// //         quality: 0.8,
// //         base64: false,
// //         skipProcessing: true,
// //       });

// //       // Send to FastAPI
// //       const form = new FormData();
// //       form.append("file", { uri: photo.uri, type: "image/jpeg", name: "scan.jpg" });

// //       const res = await fetch(`${BACKEND_URL}/predict`, { method: "POST", body: form });
// //       if (!res.ok) throw new Error(`Server ${res.status}`);

// //       const { healthy, confidence } = await res.json();
// //       const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
// //       const now = new Date();
// //       const pad = n => String(n).padStart(2, "0");
// //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

// //       setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
// //       setScans(p => [{ time, conf: confidence, healthy }, ...p].slice(0, 5));
// //       showResultAnim();

// //       if (!healthy) {
// //         setTimeout(() => router.push({
// //           pathname: "/screens/DiseaseResult",
// //           params: { conf: confidence.toString(), timestamp: time, processTime: elapsed },
// //         }), 800);
// //       }

// //     } catch (err) {
// //       console.warn("Backend error:", err.message);

// //       // Mock fallback
// //       const isHealthy = Math.random() > 0.35;
// //       const conf = parseFloat(
// //         (isHealthy ? 88 + Math.random() * 10 : 70 + Math.random() * 18).toFixed(1)
// //       );
// //       const now = new Date();
// //       const pad = n => String(n).padStart(2, "0");
// //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
// //       const pt = `${(1.2 + Math.random() * 1.2).toFixed(1)}s`;

// //       setResult({ healthy: isHealthy, conf, timestamp: time, processTime: pt });
// //       setScans(p => [{ time, conf, healthy: isHealthy }, ...p].slice(0, 5));
// //       showResultAnim();

// //       Alert.alert("⚠ Backend Offline", `Cannot reach ${BACKEND_URL}\n\nEnsure:\n• Server is running on PC\n• Same Wi-Fi or phone hotspot\n• Correct IP in BACKEND_URL`);

// //       if (!isHealthy) {
// //         setTimeout(() => router.push({
// //           pathname: "/screens/DiseaseResult",
// //           params: { conf: conf.toString(), timestamp: time, processTime: pt },
// //         }), 800);
// //       }
// //     } finally {
// //       setScanning(false);
// //     }
// //   };

// //   const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
// //   const statusColor = result.healthy ? C.healthy : C.infected;
// //   const statusLabel = result.healthy ? "Healthy" : "Infected";
// //   const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

// //   if (!permission) return <View style={s.root} />;

// //   if (!permission.granted) {
// //     return (
// //       <View style={[s.root, s.permCenter]}>
// //         <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
// //         <Text style={s.permTitle}>Camera Access Needed</Text>
// //         <Text style={s.permSub}>Required to scan mushrooms for disease detection</Text>
// //         <TouchableOpacity onPress={requestPermission}>
// //           <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
// //             <Text style={s.permBtnText}>Grant Camera Access</Text>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //         <BottomNav active="camera" router={router} />
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={s.root}>
// //       <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

// //         <Text style={s.ptag}>DISEASE DETECTION</Text>
// //         <Text style={s.ptitle}><Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module</Text>
// //         <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

// //         {/* ── CAMERA CARD ─────────────────────────────────────────────────── */}
// //         <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>

// //           {/* Camera + overlay in a relative container — overlay uses absolute positioning OUTSIDE CameraView */}
// //           <View style={s.cameraContainer}>

// //             {/* Live camera — NO children */}
// //             <CameraView ref={cameraRef} style={s.camera} facing="back" />

// //             {/* ── All overlays are siblings of CameraView, absolutely positioned ── */}

// //             {/* Corner brackets */}
// //             <View style={[s.corner, s.tl]} pointerEvents="none" />
// //             <View style={[s.corner, s.tr]} pointerEvents="none" />
// //             <View style={[s.corner, s.bl]} pointerEvents="none" />
// //             <View style={[s.corner, s.br]} pointerEvents="none" />

// //             {/* Animated scan line */}
// //             <Animated.View
// //               style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
// //               pointerEvents="none"
// //             />

// //             {/* Scanning badge — only when scanning */}
// //             {scanning && (
// //               <View style={s.scanOverlay} pointerEvents="none">
// //                 <View style={s.scanBadge}>
// //                   <Ionicons name="scan-outline" size={14} color={C.amber2} />
// //                   <Text style={s.scanBadgeText}>Analysing…</Text>
// //                 </View>
// //               </View>
// //             )}

// //             {/* Result colour flash */}
// //             <Animated.View
// //               pointerEvents="none"
// //               style={[s.resultFlash, {
// //                 opacity: fadeAnim,
// //                 backgroundColor: result.healthy ? "rgba(125,184,122,0.12)" : "rgba(224,96,80,0.12)",
// //               }]}
// //             />
// //           </View>

// //           {/* Footer */}
// //           <View style={s.camFooter}>
// //             <View>
// //               <Text style={s.camLbl}>Camera <Text style={s.camLblBold}>#1 — Live Feed</Text></Text>
// //               <Text style={s.camSub}>Tap to capture & analyse</Text>
// //             </View>
// //             <TouchableOpacity onPress={doScan} disabled={scanning}>
// //               <LinearGradient
// //                 colors={scanning ? ["#3a2510", "#5a3010"] : [C.brown, C.amber]}
// //                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
// //                 style={s.capBtn}
// //               >
// //                 <Ionicons name={scanning ? "hourglass-outline" : "camera"} size={13} color={C.cream} style={{ marginRight: 5 }} />
// //                 <Text style={s.capBtnText}>{scanning ? "Scanning…" : "Capture & Analyse"}</Text>
// //               </LinearGradient>
// //             </TouchableOpacity>
// //           </View>
// //         </Animated.View>

// //         {/* ── RESULT CARD ──────────────────────────────────────────────────── */}
// //         <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
// //         <Animated.View style={[s.resCard, { opacity: fadeAnim }]}>
// //           <View style={s.resTop}>
// //             <View style={s.resLeft}>
// //               <View style={[s.statIco, { borderColor: statusColor + "88", backgroundColor: statusColor + "26" }]}>
// //                 <Ionicons name={statusIcon} size={14} color={statusColor} />
// //               </View>
// //               <View style={{ marginLeft: 7 }}>
// //                 <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
// //                 <Text style={s.statSub}>Classification confidence</Text>
// //               </View>
// //             </View>
// //             <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
// //           </View>
// //           <View style={s.barBg}>
// //             <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
// //           </View>
// //           <View style={s.metaGrid}>
// //             {[["Timestamp", result.timestamp], ["Model", "ResNet-50"], ["Process", result.processTime], ["Resolution", "4:3"]].map(([k, v]) => (
// //               <View key={k} style={s.metaRow}>
// //                 <Text style={s.mk}>{k}</Text><Text style={s.mv}>{v}</Text>
// //               </View>
// //             ))}
// //           </View>
// //         </Animated.View>

// //         {/* ── RECENT SCANS ─────────────────────────────────────────────────── */}
// //         <Text style={s.slbl}>RECENT SCANS</Text>
// //         {scans.map((sc, i) => (
// //           <View key={i} style={s.scanRow}>
// //             <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
// //             <Text style={s.stime}>{sc.time}</Text>
// //             <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
// //             <View style={[s.sbadge,
// //               sc.healthy
// //                 ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
// //                 : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
// //             ]}>
// //               <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
// //                 {sc.healthy ? "Healthy" : "Infected"}
// //               </Text>
// //             </View>
// //           </View>
// //         ))}

// //         <View style={{ height: 20 }} />
// //       </ScrollView>

// //       <BottomNav active="camera" router={router} />
// //     </View>
// //   );
// // }

// // const s = StyleSheet.create({
// //   root:          { flex: 1, backgroundColor: C.bg },
// //   scroll:        { flex: 1 },
// //   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

// //   permCenter:    { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
// //   permTitle:     { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
// //   permSub:       { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
// //   permBtn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
// //   permBtnText:   { color: C.cream, fontSize: 13, fontWeight: "600" },

// //   ptag:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
// //   ptitle:        { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
// //   psub:          { fontSize: 12, color: C.cream3, marginBottom: 14 },

// //   // ── Camera ──
// //   camCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
// //   cameraContainer:{ width: "100%", aspectRatio: 4 / 3, position: "relative" },  // KEY: relative container
// //   camera:         { ...StyleSheet.absoluteFillObject },                           // camera fills container, NO children

// //   // Overlays — all absolutely positioned siblings of CameraView
// //   corner:        { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
// //   tl:            { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
// //   tr:            { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
// //   bl:            { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
// //   br:            { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
// //   scanLine:      { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%", shadowColor: C.amber2, shadowOpacity: 1, shadowRadius: 6 },
// //   scanOverlay:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
// //   scanBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.78)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
// //   scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
// //   resultFlash:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

// //   camFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
// //   camLbl:        { fontSize: 10, color: C.muted },
// //   camLblBold:    { color: C.amber2, fontWeight: "500" },
// //   camSub:        { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
// //   capBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
// //   capBtnText:    { color: C.cream, fontSize: 11, fontWeight: "600" },

// //   slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
// //   resCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
// //   resTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
// //   resLeft:       { flexDirection: "row", alignItems: "center" },
// //   statIco:       { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
// //   statName:      { fontSize: 15, fontWeight: "600" },
// //   statSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
// //   confNum:       { fontSize: 24, fontWeight: "700", color: C.amber2 },
// //   barBg:         { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
// //   barFill:       { height: "100%", borderRadius: 2 },
// //   metaGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 5 },
// //   metaRow:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
// //   mk:            { fontSize: 10, color: C.muted },
// //   mv:            { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

// //   scanRow:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
// //   sdot:          { width: 7, height: 7, borderRadius: 4 },
// //   stime:         { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
// //   sconf:         { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
// //   sbadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
// //   sbadgeText:    { fontSize: 9, fontWeight: "600" },
// // });



// import React, { useState, useEffect, useRef } from "react";
// import {
//   View, Text, TouchableOpacity, StyleSheet,
//   ScrollView, Animated, Easing, Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import { CameraView, useCameraPermissions } from "expo-camera";
// import { BottomNav } from "./Dashboard";

// // ─── YOUR PC's IP ──────────────────────────────────────────────────────────────
// import { BACKEND_URL } from "../AWS/Awsconfig"; // ← EC2 FastAPI server
// // ──────────────────────────────────────────────────────────────────────────────

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

// const INITIAL_SCANS = [
//   { time: "14:32", conf: 94.2, healthy: true  },
//   { time: "11:15", conf: 96.8, healthy: true  },
//   { time: "08:00", conf: 87.3, healthy: false },
// ];

// export default function CameraAI() {
//   const router    = useRouter();
//   const cameraRef = useRef(null);

//   const [permission, requestPermission] = useCameraPermissions();
//   const [scanning,   setScanning]       = useState(false);
//   const [scans,      setScans]          = useState(INITIAL_SCANS);
//   const [result,     setResult]         = useState({
//     healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
//   });

//   const scanAnim  = useRef(new Animated.Value(0)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const fadeAnim  = useRef(new Animated.Value(0.5)).current;

//   // ── Scan line loop ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.timing(scanAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//         Animated.timing(scanAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//       ])
//     );
//     loop.start();
//     return () => loop.stop();
//   }, []);

//   // ── Pulse while scanning ────────────────────────────────────────────────────
//   useEffect(() => {
//     if (scanning) {
//       const p = Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
//           Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
//         ])
//       );
//       p.start();
//       return () => p.stop();
//     } else {
//       pulseAnim.setValue(1);
//     }
//   }, [scanning]);

//   const showResultAnim = () => {
//     fadeAnim.setValue(0);
//     Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
//   };

//   // ── Capture + send to backend ───────────────────────────────────────────────
//   const doScan = async () => {
//     if (scanning || !cameraRef.current) return;

//     if (!permission?.granted) {
//       const { granted } = await requestPermission();
//       if (!granted) {
//         Alert.alert("Permission needed", "Allow camera access to scan mushrooms.");
//         return;
//       }
//     }

//     setScanning(true);
//     const t0 = Date.now();

//     try {
//       // Capture photo from live viewfinder
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.8,
//         base64: false,
//         skipProcessing: true,
//       });

//       // Send to FastAPI
//       const form = new FormData();
//       form.append("file", { uri: photo.uri, type: "image/jpeg", name: "scan.jpg" });

//       const res = await fetch(`${BACKEND_URL}/predict`, { method: "POST", body: form });
//       if (!res.ok) throw new Error(`Server ${res.status}`);

//       const { healthy, confidence } = await res.json();
//       const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
//       const now = new Date();
//       const pad = n => String(n).padStart(2, "0");
//       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

//       setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
//       setScans(p => [{ time, conf: confidence, healthy }, ...p].slice(0, 5));
//       showResultAnim();

//       if (!healthy) {
//         setTimeout(() => router.push({
//           pathname: "/screens/DiseaseResult",
//           params: { conf: confidence.toString(), timestamp: time, processTime: elapsed },
//         }), 800);
//       }

//     } catch (err) {
//       console.warn("Backend error:", err.message);

//       // Mock fallback
//       const isHealthy = Math.random() > 0.35;
//       const conf = parseFloat(
//         (isHealthy ? 88 + Math.random() * 10 : 70 + Math.random() * 18).toFixed(1)
//       );
//       const now = new Date();
//       const pad = n => String(n).padStart(2, "0");
//       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
//       const pt = `${(1.2 + Math.random() * 1.2).toFixed(1)}s`;

//       setResult({ healthy: isHealthy, conf, timestamp: time, processTime: pt });
//       setScans(p => [{ time, conf, healthy: isHealthy }, ...p].slice(0, 5));
//       showResultAnim();

//       Alert.alert("⚠ Backend Offline", `Cannot reach ${BACKEND_URL}\n\nEnsure:\n• Server is running on PC\n• Same Wi-Fi or phone hotspot\n• Correct IP in BACKEND_URL`);

//       if (!isHealthy) {
//         setTimeout(() => router.push({
//           pathname: "/screens/DiseaseResult",
//           params: { conf: conf.toString(), timestamp: time, processTime: pt },
//         }), 800);
//       }
//     } finally {
//       setScanning(false);
//     }
//   };

//   const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
//   const statusColor = result.healthy ? C.healthy : C.infected;
//   const statusLabel = result.healthy ? "Healthy" : "Infected";
//   const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

//   if (!permission) return <View style={s.root} />;

//   if (!permission.granted) {
//     return (
//       <View style={[s.root, s.permCenter]}>
//         <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
//         <Text style={s.permTitle}>Camera Access Needed</Text>
//         <Text style={s.permSub}>Required to scan mushrooms for disease detection</Text>
//         <TouchableOpacity onPress={requestPermission}>
//           <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
//             <Text style={s.permBtnText}>Grant Camera Access</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//         <BottomNav active="camera" router={router} />
//       </View>
//     );
//   }

//   return (
//     <View style={s.root}>
//       <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

//         <Text style={s.ptag}>DISEASE DETECTION</Text>
//         <Text style={s.ptitle}><Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module</Text>
//         <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

//         {/* ── CAMERA CARD ─────────────────────────────────────────────────── */}
//         <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>

//           {/* Camera + overlay in a relative container — overlay uses absolute positioning OUTSIDE CameraView */}
//           <View style={s.cameraContainer}>

//             {/* Live camera — NO children */}
//             <CameraView ref={cameraRef} style={s.camera} facing="back" />

//             {/* ── All overlays are siblings of CameraView, absolutely positioned ── */}

//             {/* Corner brackets */}
//             <View style={[s.corner, s.tl]} pointerEvents="none" />
//             <View style={[s.corner, s.tr]} pointerEvents="none" />
//             <View style={[s.corner, s.bl]} pointerEvents="none" />
//             <View style={[s.corner, s.br]} pointerEvents="none" />

//             {/* Animated scan line */}
//             <Animated.View
//               style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
//               pointerEvents="none"
//             />

//             {/* Scanning badge — only when scanning */}
//             {scanning && (
//               <View style={s.scanOverlay} pointerEvents="none">
//                 <View style={s.scanBadge}>
//                   <Ionicons name="scan-outline" size={14} color={C.amber2} />
//                   <Text style={s.scanBadgeText}>Analysing…</Text>
//                 </View>
//               </View>
//             )}

//             {/* Result colour flash */}
//             <Animated.View
//               pointerEvents="none"
//               style={[s.resultFlash, {
//                 opacity: fadeAnim,
//                 backgroundColor: result.healthy ? "rgba(125,184,122,0.12)" : "rgba(224,96,80,0.12)",
//               }]}
//             />
//           </View>

//           {/* Footer */}
//           <View style={s.camFooter}>
//             <View>
//               <Text style={s.camLbl}>Camera <Text style={s.camLblBold}>#1 — Live Feed</Text></Text>
//               <Text style={s.camSub}>Tap to capture & analyse</Text>
//             </View>
//             <TouchableOpacity onPress={doScan} disabled={scanning}>
//               <LinearGradient
//                 colors={scanning ? ["#3a2510", "#5a3010"] : [C.brown, C.amber]}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                 style={s.capBtn}
//               >
//                 <Ionicons name={scanning ? "hourglass-outline" : "camera"} size={13} color={C.cream} style={{ marginRight: 5 }} />
//                 <Text style={s.capBtnText}>{scanning ? "Scanning…" : "Capture & Analyse"}</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>

//         {/* ── RESULT CARD ──────────────────────────────────────────────────── */}
//         <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
//         <Animated.View style={[s.resCard, { opacity: fadeAnim }]}>
//           <View style={s.resTop}>
//             <View style={s.resLeft}>
//               <View style={[s.statIco, { borderColor: statusColor + "88", backgroundColor: statusColor + "26" }]}>
//                 <Ionicons name={statusIcon} size={14} color={statusColor} />
//               </View>
//               <View style={{ marginLeft: 7 }}>
//                 <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
//                 <Text style={s.statSub}>Classification confidence</Text>
//               </View>
//             </View>
//             <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
//           </View>
//           <View style={s.barBg}>
//             <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
//           </View>
//           <View style={s.metaGrid}>
//             {[["Timestamp", result.timestamp], ["Model", "ResNet-50"], ["Process", result.processTime], ["Resolution", "4:3"]].map(([k, v]) => (
//               <View key={k} style={s.metaRow}>
//                 <Text style={s.mk}>{k}</Text><Text style={s.mv}>{v}</Text>
//               </View>
//             ))}
//           </View>
//         </Animated.View>

//         {/* ── RECENT SCANS ─────────────────────────────────────────────────── */}
//         <Text style={s.slbl}>RECENT SCANS</Text>
//         {scans.map((sc, i) => (
//           <View key={i} style={s.scanRow}>
//             <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
//             <Text style={s.stime}>{sc.time}</Text>
//             <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
//             <View style={[s.sbadge,
//               sc.healthy
//                 ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
//                 : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
//             ]}>
//               <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
//                 {sc.healthy ? "Healthy" : "Infected"}
//               </Text>
//             </View>
//           </View>
//         ))}

//         <View style={{ height: 20 }} />
//       </ScrollView>

//       <BottomNav active="camera" router={router} />
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   root:          { flex: 1, backgroundColor: C.bg },
//   scroll:        { flex: 1 },
//   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

//   permCenter:    { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
//   permTitle:     { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
//   permSub:       { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
//   permBtn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
//   permBtnText:   { color: C.cream, fontSize: 13, fontWeight: "600" },

//   ptag:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
//   ptitle:        { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
//   psub:          { fontSize: 12, color: C.cream3, marginBottom: 14 },

//   // ── Camera ──
//   camCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
//   cameraContainer:{ width: "100%", aspectRatio: 4 / 3, position: "relative" },  // KEY: relative container
//   camera:         { ...StyleSheet.absoluteFillObject },                           // camera fills container, NO children

//   // Overlays — all absolutely positioned siblings of CameraView
//   corner:        { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
//   tl:            { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
//   tr:            { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
//   bl:            { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
//   br:            { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
//   scanLine:      { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%", shadowColor: C.amber2, shadowOpacity: 1, shadowRadius: 6 },
//   scanOverlay:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
//   scanBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.78)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
//   scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
//   resultFlash:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

//   camFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
//   camLbl:        { fontSize: 10, color: C.muted },
//   camLblBold:    { color: C.amber2, fontWeight: "500" },
//   camSub:        { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
//   capBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
//   capBtnText:    { color: C.cream, fontSize: 11, fontWeight: "600" },

//   slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
//   resCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
//   resTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
//   resLeft:       { flexDirection: "row", alignItems: "center" },
//   statIco:       { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
//   statName:      { fontSize: 15, fontWeight: "600" },
//   statSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
//   confNum:       { fontSize: 24, fontWeight: "700", color: C.amber2 },
//   barBg:         { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
//   barFill:       { height: "100%", borderRadius: 2 },
//   metaGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 5 },
//   metaRow:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
//   mk:            { fontSize: 10, color: C.muted },
//   mv:            { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

//   scanRow:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
//   sdot:          { width: 7, height: 7, borderRadius: 4 },
//   stime:         { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
//   sconf:         { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
//   sbadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
//   sbadgeText:    { fontSize: 9, fontWeight: "600" },
// });




// // import React, { useState, useEffect, useRef } from "react";
// // import {
// //   View, Text, TouchableOpacity, StyleSheet,
// //   ScrollView, Animated, Easing, Alert,
// // } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { useRouter } from "expo-router";
// // import { CameraView, useCameraPermissions } from "expo-camera";
// // import { BottomNav } from "../screens/Dashboard";

// // // ─── YOUR PC's IP — must be on same Wi-Fi / phone hotspot ─────────────────────
// // const BACKEND_URL = "http://172.19.10.11:8000"; // ← change if IP changes
// // // ──────────────────────────────────────────────────────────────────────────────

// // const C = {
// //   bg: "#110a04", card: "#1a1008", border: "#2a1c0e", border2: "#3a2510",
// //   amber: "#d4852a", amber2: "#f0a535", brown: "#5a3010",
// //   cream: "#f0e6d8", cream2: "#d8c8b0", cream3: "#b8a088",
// //   muted: "#7a6050", healthy: "#7db87a", infected: "#e06050",
// // };

// // const INITIAL_SCANS = [
// //   { time: "14:32", conf: 94.2, healthy: true  },
// //   { time: "11:15", conf: 96.8, healthy: true  },
// //   { time: "08:00", conf: 87.3, healthy: false },
// // ];

// // export default function CameraAI() {
// //   const router = useRouter();
// //   const cameraRef = useRef(null);

// //   const [permission, requestPermission] = useCameraPermissions();
// //   const [scanning,   setScanning]       = useState(false);
// //   const [scans,      setScans]          = useState(INITIAL_SCANS);
// //   const [result,     setResult]         = useState({
// //     healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
// //   });

// //   const scanAnim  = useRef(new Animated.Value(0)).current;
// //   const pulseAnim = useRef(new Animated.Value(1)).current;
// //   const fadeAnim  = useRef(new Animated.Value(0)).current;

// //   // ── Scanning line animation ─────────────────────────────────────────────────
// //   useEffect(() => {
// //     const loop = Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(scanAnim, {
// //           toValue: 1, duration: 2500,
// //           easing: Easing.inOut(Easing.ease), useNativeDriver: true,
// //         }),
// //         Animated.timing(scanAnim, {
// //           toValue: 0, duration: 2500,
// //           easing: Easing.inOut(Easing.ease), useNativeDriver: true,
// //         }),
// //       ])
// //     );
// //     loop.start();
// //     return () => loop.stop();
// //   }, []);

// //   // ── Pulse animation when scanning ──────────────────────────────────────────
// //   useEffect(() => {
// //     if (scanning) {
// //       const pulse = Animated.loop(
// //         Animated.sequence([
// //           Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
// //           Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
// //         ])
// //       );
// //       pulse.start();
// //       return () => pulse.stop();
// //     } else {
// //       pulseAnim.setValue(1);
// //     }
// //   }, [scanning]);

// //   // ── Result fade-in after scan ───────────────────────────────────────────────
// //   const showResultAnim = () => {
// //     fadeAnim.setValue(0);
// //     Animated.timing(fadeAnim, {
// //       toValue: 1, duration: 600, useNativeDriver: true,
// //     }).start();
// //   };

// //   // ── Main: capture photo from live camera → send to backend ─────────────────
// //   const doScan = async () => {
// //     if (scanning || !cameraRef.current) return;

// //     if (!permission?.granted) {
// //       const { granted } = await requestPermission();
// //       if (!granted) {
// //         Alert.alert("Camera Permission", "Please allow camera access to scan mushrooms.");
// //         return;
// //       }
// //     }

// //     setScanning(true);
// //     const startTime = Date.now();

// //     try {
// //       // ── Take photo from the live viewfinder instantly ──────────────────────
// //       const photo = await cameraRef.current.takePictureAsync({
// //         quality: 0.8,
// //         base64: false,
// //         skipProcessing: true,
// //       });

// //       // ── POST photo to FastAPI /predict ─────────────────────────────────────
// //       const formData = new FormData();
// //       formData.append("file", {
// //         uri: photo.uri,
// //         type: "image/jpeg",
// //         name: "mushroom_scan.jpg",
// //       });

// //       const response = await fetch(`${BACKEND_URL}/predict`, {
// //         method: "POST",
// //         body: formData,
// //       });

// //       if (!response.ok) throw new Error(`Server error ${response.status}`);

// //       const { healthy, confidence } = await response.json();

// //       const elapsed = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
// //       const now = new Date();
// //       const pad = (n) => String(n).padStart(2, "0");
// //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

// //       setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
// //       setScans((prev) => [{ time, conf: confidence, healthy }, ...prev].slice(0, 5));
// //       showResultAnim();

// //       // ── If infected → navigate to DiseaseResult ────────────────────────────
// //       if (!healthy) {
// //         setTimeout(() => {
// //           router.push({
// //             pathname: "/screens/DiseaseResult",
// //             params: { conf: confidence.toString(), timestamp: time, processTime: elapsed },
// //           });
// //         }, 800);
// //       }

// //     } catch (err) {
// //       console.warn("Scan error:", err.message);

// //       // ── Fallback mock if backend is offline ────────────────────────────────
// //       const isHealthy = Math.random() > 0.35;
// //       const conf = isHealthy
// //         ? parseFloat((88 + Math.random() * 10).toFixed(1))
// //         : parseFloat((70 + Math.random() * 18).toFixed(1));
// //       const now = new Date();
// //       const pad = (n) => String(n).padStart(2, "0");
// //       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
// //       const pt   = `${(1.2 + Math.random() * 1.2).toFixed(1)}s`;

// //       setResult({ healthy: isHealthy, conf, timestamp: time, processTime: pt });
// //       setScans((prev) => [{ time, conf, healthy: isHealthy }, ...prev].slice(0, 5));
// //       showResultAnim();

// //       Alert.alert(
// //         "⚠ Backend Offline",
// //         `Could not reach server.\n\nCheck:\n• Server is running on PC\n• Phone & PC on same Wi-Fi/hotspot\n• BACKEND_URL is correct IP\n\nShowing mock result.`,
// //         [{ text: "OK" }]
// //       );

// //       if (!isHealthy) {
// //         setTimeout(() => {
// //           router.push({
// //             pathname: "/screens/DiseaseResult",
// //             params: { conf: conf.toString(), timestamp: time, processTime: pt },
// //           });
// //         }, 800);
// //       }

// //     } finally {
// //       setScanning(false);
// //     }
// //   };

// //   const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
// //   const statusColor = result.healthy ? C.healthy : C.infected;
// //   const statusLabel = result.healthy ? "Healthy" : "Infected";
// //   const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

// //   // ── Permission loading ─────────────────────────────────────────────────────
// //   if (!permission) return <View style={s.root} />;

// //   // ── Permission denied ──────────────────────────────────────────────────────
// //   if (!permission.granted) {
// //     return (
// //       <View style={[s.root, s.permCenter]}>
// //         <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
// //         <Text style={s.permTitle}>Camera Access Needed</Text>
// //         <Text style={s.permSub}>Grant permission to scan mushrooms for disease detection</Text>
// //         <TouchableOpacity onPress={requestPermission}>
// //           <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
// //             <Text style={s.permBtnText}>Grant Camera Access</Text>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //         <BottomNav active="camera" router={router} />
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={s.root}>
// //       <ScrollView
// //         style={s.scroll}
// //         contentContainerStyle={s.scrollContent}
// //         showsVerticalScrollIndicator={false}
// //       >
// //         <Text style={s.ptag}>DISEASE DETECTION</Text>
// //         <Text style={s.ptitle}>
// //           <Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module
// //         </Text>
// //         <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

// //         {/* ── LIVE CAMERA VIEWFINDER ─────────────────────────────────────── */}
// //         <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>
// //           <CameraView
// //             ref={cameraRef}
// //             style={s.camera}
// //             facing="back"
// //           >
// //             {/* Corner bracket overlays */}
// //             <View style={s.overlay}>
// //               <View style={[s.corner, s.tl]} />
// //               <View style={[s.corner, s.tr]} />
// //               <View style={[s.corner, s.bl]} />
// //               <View style={[s.corner, s.br]} />

// //               {/* Animated scan line */}
// //               <Animated.View
// //                 style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
// //               />

// //               {/* Scanning badge shown in centre while processing */}
// //               {scanning && (
// //                 <View style={s.scanOverlay}>
// //                   <View style={s.scanBadge}>
// //                     <Ionicons name="scan-outline" size={14} color={C.amber2} />
// //                     <Text style={s.scanBadgeText}>Analysing…</Text>
// //                   </View>
// //                 </View>
// //               )}

// //               {/* Green/red tint flash after result */}
// //               <Animated.View
// //                 pointerEvents="none"
// //                 style={[
// //                   s.resultFlash,
// //                   {
// //                     opacity: fadeAnim,
// //                     backgroundColor: result.healthy
// //                       ? "rgba(125,184,122,0.15)"
// //                       : "rgba(224,96,80,0.15)",
// //                   },
// //                 ]}
// //               />
// //             </View>
// //           </CameraView>

// //           {/* Footer bar below camera */}
// //           <View style={s.camFooter}>
// //             <View>
// //               <Text style={s.camLbl}>
// //                 Camera <Text style={s.camLblBold}>#1 — Live Feed</Text>
// //               </Text>
// //               <Text style={s.camSub}>Tap button to capture & analyse</Text>
// //             </View>
// //             <TouchableOpacity onPress={doScan} disabled={scanning}>
// //               <LinearGradient
// //                 colors={scanning ? ["#3a2510", "#5a3010"] : [C.brown, C.amber]}
// //                 start={{ x: 0, y: 0 }}
// //                 end={{ x: 1, y: 1 }}
// //                 style={s.capBtn}
// //               >
// //                 <Ionicons
// //                   name={scanning ? "hourglass-outline" : "camera"}
// //                   size={13}
// //                   color={C.cream}
// //                   style={{ marginRight: 5 }}
// //                 />
// //                 <Text style={s.capBtnText}>
// //                   {scanning ? "Scanning…" : "Capture & Analyse"}
// //                 </Text>
// //               </LinearGradient>
// //             </TouchableOpacity>
// //           </View>
// //         </Animated.View>

// //         {/* ── LATEST RESULT CARD ─────────────────────────────────────────── */}
// //         <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
// //         <Animated.View style={[s.resCard, { opacity: fadeAnim.interpolate({
// //           inputRange: [0, 1], outputRange: [0.5, 1],
// //         }) }]}>
// //           <View style={s.resTop}>
// //             <View style={s.resLeft}>
// //               <View style={[s.statIco, {
// //                 borderColor: statusColor + "88",
// //                 backgroundColor: statusColor + "26",
// //               }]}>
// //                 <Ionicons name={statusIcon} size={14} color={statusColor} />
// //               </View>
// //               <View style={{ marginLeft: 7 }}>
// //                 <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
// //                 <Text style={s.statSub}>Classification confidence</Text>
// //               </View>
// //             </View>
// //             <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
// //           </View>
// //           <View style={s.barBg}>
// //             <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
// //           </View>
// //           <View style={s.metaGrid}>
// //             {[
// //               ["Timestamp",  result.timestamp],
// //               ["Model",      "ResNet-50"],
// //               ["Process",    result.processTime],
// //               ["Resolution", "4:3"],
// //             ].map(([k, v]) => (
// //               <View key={k} style={s.metaRow}>
// //                 <Text style={s.mk}>{k}</Text>
// //                 <Text style={s.mv}>{v}</Text>
// //               </View>
// //             ))}
// //           </View>
// //         </Animated.View>

// //         {/* ── RECENT SCANS ───────────────────────────────────────────────── */}
// //         <Text style={s.slbl}>RECENT SCANS</Text>
// //         {scans.map((sc, i) => (
// //           <View key={i} style={s.scanRow}>
// //             <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
// //             <Text style={s.stime}>{sc.time}</Text>
// //             <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
// //             <View style={[s.sbadge,
// //               sc.healthy
// //                 ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
// //                 : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
// //             ]}>
// //               <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
// //                 {sc.healthy ? "Healthy" : "Infected"}
// //               </Text>
// //             </View>
// //           </View>
// //         ))}

// //         <View style={{ height: 20 }} />
// //       </ScrollView>

// //       <BottomNav active="camera" router={router} />
// //     </View>
// //   );
// // }

// // const s = StyleSheet.create({
// //   root:          { flex: 1, backgroundColor: C.bg },
// //   scroll:        { flex: 1 },
// //   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

// //   permCenter:    { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
// //   permTitle:     { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
// //   permSub:       { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
// //   permBtn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
// //   permBtnText:   { color: C.cream, fontSize: 13, fontWeight: "600" },

// //   ptag:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
// //   ptitle:        { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
// //   psub:          { fontSize: 12, color: C.cream3, marginBottom: 14 },

// //   // Camera
// //   camCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
// //   camera:        { width: "100%", aspectRatio: 4 / 3 },
// //   overlay:       { ...StyleSheet.absoluteFillObject },
// //   corner:        { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
// //   tl:            { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
// //   tr:            { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
// //   bl:            { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
// //   br:            { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
// //   scanLine:      { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%", shadowColor: C.amber2, shadowOpacity: 1, shadowRadius: 6 },
// //   scanOverlay:   { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
// //   scanBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.78)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
// //   scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
// //   resultFlash:   { ...StyleSheet.absoluteFillObject },

// //   camFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
// //   camLbl:        { fontSize: 10, color: C.muted },
// //   camLblBold:    { color: C.amber2, fontWeight: "500" },
// //   camSub:        { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
// //   capBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
// //   capBtnText:    { color: C.cream, fontSize: 11, fontWeight: "600" },

// //   slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
// //   resCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
// //   resTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
// //   resLeft:       { flexDirection: "row", alignItems: "center" },
// //   statIco:       { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
// //   statName:      { fontSize: 15, fontWeight: "600" },
// //   statSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
// //   confNum:       { fontSize: 24, fontWeight: "700", color: C.amber2 },
// //   barBg:         { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
// //   barFill:       { height: "100%", borderRadius: 2 },
// //   metaGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 5 },
// //   metaRow:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
// //   mk:            { fontSize: 10, color: C.muted },
// //   mv:            { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

// //   scanRow:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
// //   sdot:          { width: 7, height: 7, borderRadius: 4 },
// //   stime:         { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
// //   sconf:         { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
// //   sbadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
// //   sbadgeText:    { fontSize: 9, fontWeight: "600" },
// // });


// import React, { useState, useEffect, useRef } from "react";
// import {
//   View, Text, TouchableOpacity, StyleSheet,
//   ScrollView, Animated, Easing, Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import { CameraView, useCameraPermissions } from "expo-camera";
// import { BottomNav } from "../screens/Dashboard";

// // ─── YOUR PC's IP ──────────────────────────────────────────────────────────────
// const BACKEND_URL = "http://172.19.10.11:8000"; // ← update if IP changes
// // ──────────────────────────────────────────────────────────────────────────────

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

// const INITIAL_SCANS = [
//   { time: "14:32", conf: 94.2, healthy: true  },
//   { time: "11:15", conf: 96.8, healthy: true  },
//   { time: "08:00", conf: 87.3, healthy: false },
// ];

// export default function CameraAI() {
//   const router    = useRouter();
//   const cameraRef = useRef(null);

//   const [permission, requestPermission] = useCameraPermissions();
//   const [scanning,   setScanning]       = useState(false);
//   const [scans,      setScans]          = useState(INITIAL_SCANS);
//   const [result,     setResult]         = useState({
//     healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
//   });

//   const scanAnim  = useRef(new Animated.Value(0)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const fadeAnim  = useRef(new Animated.Value(0.5)).current;

//   // ── Scan line loop ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.timing(scanAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//         Animated.timing(scanAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//       ])
//     );
//     loop.start();
//     return () => loop.stop();
//   }, []);

//   // ── Pulse while scanning ────────────────────────────────────────────────────
//   useEffect(() => {
//     if (scanning) {
//       const p = Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
//           Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
//         ])
//       );
//       p.start();
//       return () => p.stop();
//     } else {
//       pulseAnim.setValue(1);
//     }
//   }, [scanning]);

//   const showResultAnim = () => {
//     fadeAnim.setValue(0);
//     Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
//   };

//   // ── Capture + send to backend ───────────────────────────────────────────────
//   const doScan = async () => {
//     if (scanning || !cameraRef.current) return;

//     if (!permission?.granted) {
//       const { granted } = await requestPermission();
//       if (!granted) {
//         Alert.alert("Permission needed", "Allow camera access to scan mushrooms.");
//         return;
//       }
//     }

//     setScanning(true);
//     const t0 = Date.now();

//     try {
//       // Capture photo from live viewfinder
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.8,
//         base64: false,
//         skipProcessing: true,
//       });

//       // Send to FastAPI
//       const form = new FormData();
//       form.append("file", { uri: photo.uri, type: "image/jpeg", name: "scan.jpg" });

//       const res = await fetch(`${BACKEND_URL}/predict`, { method: "POST", body: form });
//       if (!res.ok) throw new Error(`Server ${res.status}`);

//       const { healthy, confidence } = await res.json();
//       const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
//       const now = new Date();
//       const pad = n => String(n).padStart(2, "0");
//       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

//       setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
//       setScans(p => [{ time, conf: confidence, healthy }, ...p].slice(0, 5));
//       showResultAnim();

//       if (!healthy) {
//         setTimeout(() => router.push({
//           pathname: "/screens/DiseaseResult",
//           params: { conf: confidence.toString(), timestamp: time, processTime: elapsed },
//         }), 800);
//       }

//     } catch (err) {
//       console.warn("Backend error:", err.message);

//       // Mock fallback
//       const isHealthy = Math.random() > 0.35;
//       const conf = parseFloat(
//         (isHealthy ? 88 + Math.random() * 10 : 70 + Math.random() * 18).toFixed(1)
//       );
//       const now = new Date();
//       const pad = n => String(n).padStart(2, "0");
//       const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
//       const pt = `${(1.2 + Math.random() * 1.2).toFixed(1)}s`;

//       setResult({ healthy: isHealthy, conf, timestamp: time, processTime: pt });
//       setScans(p => [{ time, conf, healthy: isHealthy }, ...p].slice(0, 5));
//       showResultAnim();

//       Alert.alert("⚠ Backend Offline", `Cannot reach ${BACKEND_URL}\n\nEnsure:\n• Server is running on PC\n• Same Wi-Fi or phone hotspot\n• Correct IP in BACKEND_URL`);

//       if (!isHealthy) {
//         setTimeout(() => router.push({
//           pathname: "/screens/DiseaseResult",
//           params: { conf: conf.toString(), timestamp: time, processTime: pt },
//         }), 800);
//       }
//     } finally {
//       setScanning(false);
//     }
//   };

//   const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
//   const statusColor = result.healthy ? C.healthy : C.infected;
//   const statusLabel = result.healthy ? "Healthy" : "Infected";
//   const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

//   if (!permission) return <View style={s.root} />;

//   if (!permission.granted) {
//     return (
//       <View style={[s.root, s.permCenter]}>
//         <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
//         <Text style={s.permTitle}>Camera Access Needed</Text>
//         <Text style={s.permSub}>Required to scan mushrooms for disease detection</Text>
//         <TouchableOpacity onPress={requestPermission}>
//           <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
//             <Text style={s.permBtnText}>Grant Camera Access</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//         <BottomNav active="camera" router={router} />
//       </View>
//     );
//   }

//   return (
//     <View style={s.root}>
//       <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

//         <Text style={s.ptag}>DISEASE DETECTION</Text>
//         <Text style={s.ptitle}><Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module</Text>
//         <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

//         {/* ── CAMERA CARD ─────────────────────────────────────────────────── */}
//         <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>

//           {/* Camera + overlay in a relative container — overlay uses absolute positioning OUTSIDE CameraView */}
//           <View style={s.cameraContainer}>

//             {/* Live camera — NO children */}
//             <CameraView ref={cameraRef} style={s.camera} facing="back" />

//             {/* ── All overlays are siblings of CameraView, absolutely positioned ── */}

//             {/* Corner brackets */}
//             <View style={[s.corner, s.tl]} pointerEvents="none" />
//             <View style={[s.corner, s.tr]} pointerEvents="none" />
//             <View style={[s.corner, s.bl]} pointerEvents="none" />
//             <View style={[s.corner, s.br]} pointerEvents="none" />

//             {/* Animated scan line */}
//             <Animated.View
//               style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
//               pointerEvents="none"
//             />

//             {/* Scanning badge — only when scanning */}
//             {scanning && (
//               <View style={s.scanOverlay} pointerEvents="none">
//                 <View style={s.scanBadge}>
//                   <Ionicons name="scan-outline" size={14} color={C.amber2} />
//                   <Text style={s.scanBadgeText}>Analysing…</Text>
//                 </View>
//               </View>
//             )}

//             {/* Result colour flash */}
//             <Animated.View
//               pointerEvents="none"
//               style={[s.resultFlash, {
//                 opacity: fadeAnim,
//                 backgroundColor: result.healthy ? "rgba(125,184,122,0.12)" : "rgba(224,96,80,0.12)",
//               }]}
//             />
//           </View>

//           {/* Footer */}
//           <View style={s.camFooter}>
//             <View>
//               <Text style={s.camLbl}>Camera <Text style={s.camLblBold}>#1 — Live Feed</Text></Text>
//               <Text style={s.camSub}>Tap to capture & analyse</Text>
//             </View>
//             <TouchableOpacity onPress={doScan} disabled={scanning}>
//               <LinearGradient
//                 colors={scanning ? ["#3a2510", "#5a3010"] : [C.brown, C.amber]}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                 style={s.capBtn}
//               >
//                 <Ionicons name={scanning ? "hourglass-outline" : "camera"} size={13} color={C.cream} style={{ marginRight: 5 }} />
//                 <Text style={s.capBtnText}>{scanning ? "Scanning…" : "Capture & Analyse"}</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>

//         {/* ── RESULT CARD ──────────────────────────────────────────────────── */}
//         <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
//         <Animated.View style={[s.resCard, { opacity: fadeAnim }]}>
//           <View style={s.resTop}>
//             <View style={s.resLeft}>
//               <View style={[s.statIco, { borderColor: statusColor + "88", backgroundColor: statusColor + "26" }]}>
//                 <Ionicons name={statusIcon} size={14} color={statusColor} />
//               </View>
//               <View style={{ marginLeft: 7 }}>
//                 <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
//                 <Text style={s.statSub}>Classification confidence</Text>
//               </View>
//             </View>
//             <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
//           </View>
//           <View style={s.barBg}>
//             <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
//           </View>
//           <View style={s.metaGrid}>
//             {[["Timestamp", result.timestamp], ["Model", "ResNet-50"], ["Process", result.processTime], ["Resolution", "4:3"]].map(([k, v]) => (
//               <View key={k} style={s.metaRow}>
//                 <Text style={s.mk}>{k}</Text><Text style={s.mv}>{v}</Text>
//               </View>
//             ))}
//           </View>
//         </Animated.View>

//         {/* ── RECENT SCANS ─────────────────────────────────────────────────── */}
//         <Text style={s.slbl}>RECENT SCANS</Text>
//         {scans.map((sc, i) => (
//           <View key={i} style={s.scanRow}>
//             <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
//             <Text style={s.stime}>{sc.time}</Text>
//             <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
//             <View style={[s.sbadge,
//               sc.healthy
//                 ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
//                 : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
//             ]}>
//               <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
//                 {sc.healthy ? "Healthy" : "Infected"}
//               </Text>
//             </View>
//           </View>
//         ))}

//         <View style={{ height: 20 }} />
//       </ScrollView>

//       <BottomNav active="camera" router={router} />
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   root:          { flex: 1, backgroundColor: C.bg },
//   scroll:        { flex: 1 },
//   scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

//   permCenter:    { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
//   permTitle:     { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
//   permSub:       { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
//   permBtn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
//   permBtnText:   { color: C.cream, fontSize: 13, fontWeight: "600" },

//   ptag:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
//   ptitle:        { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
//   psub:          { fontSize: 12, color: C.cream3, marginBottom: 14 },

//   // ── Camera ──
//   camCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
//   cameraContainer:{ width: "100%", aspectRatio: 4 / 3, position: "relative" },  // KEY: relative container
//   camera:         { ...StyleSheet.absoluteFillObject },                           // camera fills container, NO children

//   // Overlays — all absolutely positioned siblings of CameraView
//   corner:        { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
//   tl:            { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
//   tr:            { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
//   bl:            { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
//   br:            { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
//   scanLine:      { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%", shadowColor: C.amber2, shadowOpacity: 1, shadowRadius: 6 },
//   scanOverlay:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
//   scanBadge:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.78)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
//   scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
//   resultFlash:   { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

//   camFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
//   camLbl:        { fontSize: 10, color: C.muted },
//   camLblBold:    { color: C.amber2, fontWeight: "500" },
//   camSub:        { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
//   capBtn:        { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
//   capBtnText:    { color: C.cream, fontSize: 11, fontWeight: "600" },

//   slbl:          { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
//   resCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
//   resTop:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
//   resLeft:       { flexDirection: "row", alignItems: "center" },
//   statIco:       { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
//   statName:      { fontSize: 15, fontWeight: "600" },
//   statSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
//   confNum:       { fontSize: 24, fontWeight: "700", color: C.amber2 },
//   barBg:         { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
//   barFill:       { height: "100%", borderRadius: 2 },
//   metaGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 5 },
//   metaRow:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
//   mk:            { fontSize: 10, color: C.muted },
//   mv:            { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

//   scanRow:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
//   sdot:          { width: 7, height: 7, borderRadius: 4 },
//   stime:         { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
//   sconf:         { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
//   sbadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
//   sbadgeText:    { fontSize: 9, fontWeight: "600" },
// });
/**
 * CameraAI.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix summary:
 *  1. doScan properly sets scanning state, updates result card, animates
 *  2. ALWAYS navigates to DiseaseResult after every scan (healthy OR infected)
 *  3. 15-second AbortController timeout — never hangs forever
 *  4. If EC2 unreachable → mock result used but screen still navigates
 *  5. C.infected defined (was missing — caused crash on scan rows)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { BottomNav } from "../screens/Dashboard";

// ─── EC2 FastAPI backend ───────────────────────────────────────────────────────
// Update this if your EC2 IP / port changes. Port must be open in Security Group.
const BACKEND_URL = "http://16.170.250.107:8001";
// ──────────────────────────────────────────────────────────────────────────────

const C = {
  bg:       "#f9fafb",
  card:     "#ffffff",
  border:   "#e5e7eb",
  border2:  "#d1d5db",
  amber:    "#d97706",
  amber2:   "#f59e0b",
  brown:    "#92400e",
  cream:    "#1f2937",
  cream2:   "#374151",
  cream3:   "#6b7280",
  muted:    "#9ca3af",
  healthy:  "#16a34a",
  infected: "#dc2626",   // ← was missing before — fixed
};

const INITIAL_SCANS = [
  { time: "14:32", conf: 94.2, healthy: true  },
  { time: "11:15", conf: 96.8, healthy: true  },
  { time: "08:00", conf: 87.3, healthy: false },
];

export default function CameraAI() {
  const router    = useRouter();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,   setScanning]       = useState(false);
  const [scans,      setScans]          = useState(INITIAL_SCANS);
  const [result,     setResult]         = useState({
    healthy: true, conf: 94.2, timestamp: "14:32", processTime: "1.8s",
  });

  const scanAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0.5)).current;

  // ── Scan line loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Pulse while scanning ────────────────────────────────────────────────────
  useEffect(() => {
    if (scanning) {
      const p = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      );
      p.start();
      return () => p.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanning]);

  const showResultAnim = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const nowTime = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // doScan — the main fix
  //  • Captures photo, POSTs to EC2
  //  • Updates UI state
  //  • ALWAYS navigates to DiseaseResult — healthy or infected, real or mock
  // ─────────────────────────────────────────────────────────────────────────────
  const doScan = async () => {
    if (scanning) return;

    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Camera Permission", "Allow camera access to scan mushrooms.");
        return;
      }
    }

    if (!cameraRef.current) {
      Alert.alert("Not Ready", "Camera is still initialising. Please wait a second.");
      return;
    }

    setScanning(true);
    const t0 = Date.now();

    let healthy    = true;
    let confidence = 0;
    let fromServer = false;

    try {
      // 1. Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      // 2. Build FormData
      const form = new FormData();
      form.append("file", {
        uri:  photo.uri,
        type: "image/jpeg",
        name: "mushroom_scan.jpg",
      });

      // 3. POST with 15s timeout
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        body:   form,
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json = await res.json();
      healthy    = json.healthy;
      confidence = json.confidence;
      fromServer = true;

    } catch (err) {
      // 4. Mock fallback — screen still navigates
      const timedOut = err.name === "AbortError";
      console.warn("CameraAI scan error:", timedOut ? "Timed out" : err.message);

      healthy    = Math.random() > 0.4;
      confidence = parseFloat(
        (healthy ? 88 + Math.random() * 10 : 72 + Math.random() * 16).toFixed(1)
      );

      // Show alert non-blocking (after navigation)
      setTimeout(() => {
        Alert.alert(
          "⚠ Backend Unreachable",
          timedOut
            ? "EC2 took too long (>15s).\nShowing a demo result."
            : `Could not reach:\n${BACKEND_URL}\n\nMake sure:\n• EC2 is running\n• Port 8001 is open\n\nShowing a demo result.`
        );
      }, 800);
    }

    // 5. Commit to state
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
    const time    = nowTime();

    setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
    setScans(prev => [{ time, conf: confidence, healthy }, ...prev].slice(0, 5));
    showResultAnim();
    setScanning(false);

    // 6. ALWAYS navigate to DiseaseResult
    setTimeout(() => {
      router.push({
        pathname: "/screens/DiseaseResult",
        params: {
          healthy:     String(healthy),
          conf:        String(confidence),
          timestamp:   time,
          processTime: elapsed,
          fromServer:  String(fromServer),
        },
      });
    }, 500);
  };

  const scanLineY   = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
  const statusColor = result.healthy ? C.healthy : C.infected;
  const statusLabel = result.healthy ? "Healthy" : "Infected";
  const statusIcon  = result.healthy ? "checkmark-circle" : "alert-circle";

  if (!permission) return <View style={s.root} />;

  if (!permission.granted) {
    return (
      <View style={[s.root, s.permCenter]}>
        <Ionicons name="camera-outline" size={52} color={C.amber2} style={{ marginBottom: 16 }} />
        <Text style={s.permTitle}>Camera Access Needed</Text>
        <Text style={s.permSub}>Required to scan mushrooms for disease detection</Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient colors={[C.brown, C.amber]} style={s.permBtn}>
            <Text style={s.permBtnText}>Grant Camera Access</Text>
          </LinearGradient>
        </TouchableOpacity>
        <BottomNav active="camera" router={router} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={s.ptag}>DISEASE DETECTION</Text>
        <Text style={s.ptitle}><Text style={{ fontStyle: "italic" }}>AI</Text> Camera Module</Text>
        <Text style={s.psub}>Point at mushroom and tap Capture to scan</Text>

        {/* CAMERA CARD */}
        <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={s.cameraContainer}>
            <CameraView ref={cameraRef} style={s.camera} facing="back" />

            <View style={[s.corner, s.tl]} pointerEvents="none" />
            <View style={[s.corner, s.tr]} pointerEvents="none" />
            <View style={[s.corner, s.bl]} pointerEvents="none" />
            <View style={[s.corner, s.br]} pointerEvents="none" />

            <Animated.View
              style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
              pointerEvents="none"
            />

            {scanning && (
              <View style={s.scanOverlay} pointerEvents="none">
                <View style={s.scanBadge}>
                  <Ionicons name="scan-outline" size={14} color={C.amber2} />
                  <Text style={s.scanBadgeText}>Analysing…</Text>
                </View>
              </View>
            )}

            <Animated.View
              pointerEvents="none"
              style={[s.resultFlash, {
                opacity: fadeAnim,
                backgroundColor: result.healthy ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)",
              }]}
            />
          </View>

          <View style={s.camFooter}>
            <View>
              <Text style={s.camLbl}>Camera <Text style={s.camLblBold}>#1 — Live Feed</Text></Text>
              <Text style={s.camSub}>Tap to capture & analyse</Text>
            </View>
            <TouchableOpacity onPress={doScan} disabled={scanning}>
              <LinearGradient
                colors={scanning ? ["#d1d5db", "#9ca3af"] : [C.brown, C.amber]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.capBtn}
              >
                <Ionicons
                  name={scanning ? "hourglass-outline" : "camera"}
                  size={13}
                  color={scanning ? "#6b7280" : "#fff"}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.capBtnText, scanning && { color: "#6b7280" }]}>
                  {scanning ? "Scanning…" : "Capture & Analyse"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* LATEST RESULT */}
        <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
        <Animated.View style={[s.resCard, { opacity: fadeAnim }]}>
          <View style={s.resTop}>
            <View style={s.resLeft}>
              <View style={[s.statIco, { borderColor: statusColor + "88", backgroundColor: statusColor + "22" }]}>
                <Ionicons name={statusIcon} size={14} color={statusColor} />
              </View>
              <View style={{ marginLeft: 7 }}>
                <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
                <Text style={s.statSub}>Classification confidence</Text>
              </View>
            </View>
            <Text style={s.confNum}>{result.conf.toFixed(1)}%</Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${result.conf}%`, backgroundColor: statusColor }]} />
          </View>
          <View style={s.metaGrid}>
            {[
              ["Timestamp",  result.timestamp],
              ["Model",      "ResNet-50"],
              ["Process",    result.processTime],
              ["Resolution", "4:3"],
            ].map(([k, v]) => (
              <View key={k} style={s.metaRow}>
                <Text style={s.mk}>{k}</Text>
                <Text style={s.mv}>{v}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* RECENT SCANS */}
        <Text style={s.slbl}>RECENT SCANS</Text>
        {scans.map((sc, i) => (
          <View key={i} style={s.scanRow}>
            <View style={[s.sdot, { backgroundColor: sc.healthy ? C.healthy : C.infected }]} />
            <Text style={s.stime}>{sc.time}</Text>
            <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
            <View style={[s.sbadge,
              sc.healthy
                ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
                : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" }
            ]}>
              <Text style={[s.sbadgeText, { color: sc.healthy ? C.healthy : C.infected }]}>
                {sc.healthy ? "Healthy" : "Infected"}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav active="camera" router={router} />
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  scroll:          { flex: 1 },
  scrollContent:   { paddingHorizontal: 14, paddingTop: 16 },

  permCenter:      { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
  permTitle:       { fontSize: 18, fontWeight: "700", color: C.cream, marginBottom: 8, textAlign: "center" },
  permSub:         { fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 18 },
  permBtn:         { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 },
  permBtnText:     { color: "#fff", fontSize: 13, fontWeight: "600" },

  ptag:            { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginBottom: 3, textTransform: "uppercase" },
  ptitle:          { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub:            { fontSize: 12, color: C.cream3, marginBottom: 14 },

  camCard:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  cameraContainer: { width: "100%", aspectRatio: 4 / 3, position: "relative" },
  camera:          { ...StyleSheet.absoluteFillObject },

  corner:          { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.85 },
  tl:              { top: 10, left: 10,     borderTopWidth: 2,    borderLeftWidth: 2,   borderTopLeftRadius: 3 },
  tr:              { top: 10, right: 10,    borderTopWidth: 2,    borderRightWidth: 2,  borderTopRightRadius: 3 },
  bl:              { bottom: 10, left: 10,  borderBottomWidth: 2, borderLeftWidth: 2,   borderBottomLeftRadius: 3 },
  br:              { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2,  borderBottomRightRadius: 3 },
  scanLine:        { position: "absolute", left: 12, right: 12, height: 1.5, backgroundColor: C.amber2, opacity: 0.7, top: "10%" },
  scanOverlay:     { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  scanBadge:       { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,6,4,0.80)", borderWidth: 1, borderColor: C.amber2 + "55", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  scanBadgeText:   { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 1 },
  resultFlash:     { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  camFooter:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 },
  camLbl:          { fontSize: 10, color: C.muted },
  camLblBold:      { color: C.amber2, fontWeight: "500" },
  camSub:          { fontSize: 9, color: C.muted, opacity: 0.6, marginTop: 1 },
  capBtn:          { flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  capBtnText:      { color: "#fff", fontSize: 11, fontWeight: "600" },

  slbl:            { fontSize: 9, letterSpacing: 2, color: C.muted, fontWeight: "500", marginVertical: 8, textTransform: "uppercase" },
  resCard:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, borderRadius: 12, padding: 12, marginBottom: 10 },
  resTop:          { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  resLeft:         { flexDirection: "row", alignItems: "center" },
  statIco:         { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  statName:        { fontSize: 15, fontWeight: "600" },
  statSub:         { fontSize: 10, color: C.muted, marginTop: 1 },
  confNum:         { fontSize: 24, fontWeight: "700", color: C.amber2 },
  barBg:           { height: 4, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  barFill:         { height: "100%", borderRadius: 2 },
  metaGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metaRow:         { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.025)", borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 6, width: "48%" },
  mk:              { fontSize: 10, color: C.muted },
  mv:              { fontSize: 10, color: C.cream2, fontWeight: "500", fontFamily: "monospace" },

  scanRow:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginBottom: 6 },
  sdot:            { width: 7, height: 7, borderRadius: 4 },
  stime:           { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
  sconf:           { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
  sbadge:          { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  sbadgeText:      { fontSize: 9, fontWeight: "600" },
});