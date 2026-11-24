import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { BottomNav } from "../screens/Dashboard";

// ─── Backend URL (Supports dynamic env or fallback) ──────────────────────────
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://16.170.250.107:8001";

const C = {
  bg: "#110a04",
  card: "#1a1008",
  cardLighter: "#23160b",
  border: "#2a1c0e",
  border2: "#3a2510",
  amber: "#d4852a",
  amber2: "#f0a535",
  brown: "#5a3010",
  cream: "#f0e6d8",
  cream2: "#d8c8b0",
  cream3: "#b8a088",
  muted: "#7a6050",
  healthy: "#16a34a",
  infected: "#dc2626",
  cyan: "#0284c7",
  cyanDark: "#0369a1",
};

const INITIAL_SCANS = [
  { time: "14:32", conf: 94.2, healthy: true, source: "camera" },
  { time: "11:15", conf: 96.8, healthy: true, source: "upload" },
  { time: "08:00", conf: 87.3, healthy: false, source: "esp32" },
];

export default function CameraAI() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const demoIndex = useRef(0);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState(INITIAL_SCANS);
  const [captureMode, setCaptureMode] = useState("mobile"); // "mobile" | "upload" | "esp32"
  const [selectedImage, setSelectedImage] = useState(null); // Local URI for uploaded photo
  const [result, setResult] = useState({
    healthy: true,
    conf: 94.2,
    timestamp: "14:32",
    processTime: "1.8s",
  });

  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0.5)).current;

  // ── Scan line loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  // ── Pulse while scanning ────────────────────────────────────────────────────
  useEffect(() => {
    if (scanning) {
      const p = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.025,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      p.start();
      return () => p.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanning, pulseAnim]);

  const showResultAnim = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const nowTime = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Core: Analyse an image (from Camera or Uploaded File)
  // ─────────────────────────────────────────────────────────────────────────────
  const processImageInference = async (imageUri, source = "camera") => {
    setScanning(true);
    const t0 = Date.now();

    let healthy = true;
    let confidence = 0;
    let fromServer = false;

    try {
      // 1. Build FormData compatible with both Native and Web
      const form = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        form.append("file", blob, "mushroom_scan.jpg");
      } else {
        form.append("file", {
          uri: imageUri,
          type: "image/jpeg",
          name: "mushroom_scan.jpg",
        });
      }

      // 2. POST with 15s timeout
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json = await res.json();
      healthy = json.healthy;
      confidence = typeof json.confidence === "number" ? json.confidence : parseFloat(json.confidence);
      fromServer = true;
    } catch (err) {
      const timedOut = err.name === "AbortError";
      console.warn("Inference error:", timedOut ? "Timed out" : err.message);

      // Intelligent demo fallback so the app continues smoothly
      healthy = Math.random() > 0.4;
      confidence = parseFloat(
        (healthy ? 89 + Math.random() * 9 : 72 + Math.random() * 16).toFixed(1)
      );

      setTimeout(() => {
        Alert.alert(
          "ℹ️ Offline Demo Result",
          timedOut
            ? "Server request timed out (>15s). Displaying simulated AI analysis."
            : `Could not reach ${BACKEND_URL}.\nDisplaying simulated AI analysis.`
        );
      }, 700);
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
    const time = nowTime();

    setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
    setScans((prev) => [{ time, conf: confidence, healthy, source }, ...prev].slice(0, 5));
    showResultAnim();
    setScanning(false);

    // Navigate to DiseaseResult with results & photo URI
    setTimeout(() => {
      router.push({
        pathname: "/screens/DiseaseResult",
        params: {
          healthy: String(healthy),
          conf: String(confidence),
          timestamp: time,
          processTime: elapsed,
          fromServer: String(fromServer),
          imageUri: imageUri,
          isUpload: source === "upload" ? "true" : "false",
        },
      });
    }, 500);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Action: Live Camera Scan
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
      Alert.alert("Not Ready", "Camera is still initializing. Please wait a moment.");
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: true,
      });

      await processImageInference(photo.uri, "camera");
    } catch (err) {
      console.warn("Capture error:", err);
      Alert.alert("Capture Failed", "Could not take photo. Please try again.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Action: Pick Image from Gallery & Analyse
  // ─────────────────────────────────────────────────────────────────────────────
  const pickAndAnalyseImage = async () => {
    if (scanning) return;

    try {
      // Check/request media library permissions
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to upload and analyse mushroom images."
        );
        return;
      }

      const pickResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
        return;
      }

      const uri = pickResult.assets[0].uri;
      setSelectedImage(uri);
      setCaptureMode("upload");

      // Run inference on selected image!
      await processImageInference(uri, "upload");
    } catch (err) {
      console.warn("Image pick error:", err);
      Alert.alert("Upload Error", "Could not select image. Please try again.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Action: ESP32-CAM IoT Remote Trigger
  // ─────────────────────────────────────────────────────────────────────────────
  const doESP32Scan = async () => {
    if (scanning) return;
    setScanning(true);
    const t0 = Date.now();

    let healthy = true;
    let confidence = 0;
    let fromServer = false;
    let demoImgId = "0";

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${BACKEND_URL}/trigger-iot`, {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) throw new Error(`EC2 returned ${res.status}`);

      const json = await res.json();
      healthy = json.healthy;
      confidence = typeof json.confidence === "number" ? json.confidence : parseFloat(json.confidence);
      fromServer = true;
    } catch (err) {
      const timedOut = err.name === "AbortError";
      console.warn("ESP32 IoT Trigger error:", timedOut ? "Timed out" : err.message);

      demoIndex.current = (demoIndex.current % 7) + 1;
      demoImgId = String(demoIndex.current);
      healthy = true;
      confidence = parseFloat((92 + Math.random() * 6).toFixed(1));
      fromServer = false;

      setTimeout(() => {
        Alert.alert(
          "ℹ️ Demo Mode",
          "EC2/ESP32 is offline. Showing sample capture result."
        );
      }, 500);
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + "s";
    const time = nowTime();

    setResult({ healthy, conf: confidence, timestamp: time, processTime: elapsed });
    setScans((prev) => [{ time, conf: confidence, healthy, source: "esp32" }, ...prev].slice(0, 5));
    showResultAnim();
    setScanning(false);

    setTimeout(() => {
      router.push({
        pathname: "/screens/DiseaseResult",
        params: {
          healthy: String(healthy),
          conf: String(confidence),
          timestamp: time,
          processTime: elapsed,
          fromServer: String(fromServer),
          demoImg: demoImgId,
          isUpload: "false",
        },
      });
    }, 500);
  };

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });
  const statusColor = result.healthy ? C.healthy : C.infected;
  const statusLabel = result.healthy ? "Healthy" : "Infected";
  const statusIcon = result.healthy ? "checkmark-circle" : "alert-circle";

  if (!permission && captureMode === "mobile") return <View style={s.root} />;

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.ptag}>AI VISION SUITE</Text>
            <Text style={s.ptitle}>
              <Text style={{ fontStyle: "italic", color: C.amber2 }}>AI</Text> Camera Module
            </Text>
          </View>
          <View style={s.onlineBadge}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Vision AI v2.4</Text>
          </View>
        </View>
        <Text style={s.psub}>
          Choose your input method below to classify mushroom health & disease instantly.
        </Text>

        {/* ── 3-WAY MODE SELECTOR ────────────────────────────────────────── */}
        <View style={s.modeSelector}>
          {/* Live Mobile Camera */}
          <TouchableOpacity
            style={[s.modeOption, captureMode === "mobile" && s.modeOptionActiveAmber]}
            onPress={() => setCaptureMode("mobile")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={captureMode === "mobile" ? "#fff" : C.cream3}
            />
            <Text style={[s.modeText, captureMode === "mobile" && s.modeTextActive]}>
              Live Camera
            </Text>
          </TouchableOpacity>

          {/* Upload Image from Gallery */}
          <TouchableOpacity
            style={[s.modeOption, captureMode === "upload" && s.modeOptionActiveAmber]}
            onPress={() => setCaptureMode("upload")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={captureMode === "upload" ? "#fff" : C.cream3}
            />
            <Text style={[s.modeText, captureMode === "upload" && s.modeTextActive]}>
              Upload Image
            </Text>
          </TouchableOpacity>

          {/* ESP32-CAM IoT */}
          <TouchableOpacity
            style={[s.modeOption, captureMode === "esp32" && s.modeOptionActiveBlue]}
            onPress={() => setCaptureMode("esp32")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={captureMode === "esp32" ? "#fff" : C.cream3}
            />
            <Text style={[s.modeText, captureMode === "esp32" && s.modeTextActive]}>
              ESP32 IoT
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── MAIN VIEWFINDER / CARD ─────────────────────────────────────── */}
        <Animated.View style={[s.camCard, { transform: [{ scale: pulseAnim }] }]}>
          {captureMode === "mobile" ? (
            /* 1. LIVE CAMERA MODE */
            permission?.granted ? (
              <View style={s.cameraContainer}>
                <CameraView ref={cameraRef} style={s.camera} facing="back" />

                {/* HUD Corners */}
                <View style={[s.corner, s.tl]} pointerEvents="none" />
                <View style={[s.corner, s.tr]} pointerEvents="none" />
                <View style={[s.corner, s.bl]} pointerEvents="none" />
                <View style={[s.corner, s.br]} pointerEvents="none" />

                {/* Animated Scan Line */}
                <Animated.View
                  style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
                  pointerEvents="none"
                />

                {scanning && (
                  <View style={s.scanOverlay} pointerEvents="none">
                    <View style={s.scanBadge}>
                      <ActivityIndicator size="small" color={C.amber2} />
                      <Text style={s.scanBadgeText}>Analysing Live Frame…</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={[s.cameraContainer, s.permWrap]}>
                <Ionicons name="camera-outline" size={44} color={C.amber2} style={{ marginBottom: 12 }} />
                <Text style={s.permTitle}>Camera Permission Required</Text>
                <Text style={s.permSub}>Grant camera access to scan mushrooms in real time</Text>
                <TouchableOpacity onPress={requestPermission} style={s.grantBtn}>
                  <Text style={s.grantBtnText}>Grant Access</Text>
                </TouchableOpacity>
              </View>
            )
          ) : captureMode === "upload" ? (
            /* 2. UPLOAD IMAGE MODE */
            <View style={s.cameraContainer}>
              {selectedImage ? (
                <>
                  <Image source={{ uri: selectedImage }} style={s.uploadedPreview} resizeMode="cover" />

                  {/* HUD Corners */}
                  <View style={[s.corner, s.tl]} pointerEvents="none" />
                  <View style={[s.corner, s.tr]} pointerEvents="none" />
                  <View style={[s.corner, s.bl]} pointerEvents="none" />
                  <View style={[s.corner, s.br]} pointerEvents="none" />

                  {/* Animated Scan Line across image */}
                  <Animated.View
                    style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
                    pointerEvents="none"
                  />

                  {scanning && (
                    <View style={s.scanOverlay} pointerEvents="none">
                      <View style={s.scanBadge}>
                        <ActivityIndicator size="small" color={C.amber2} />
                        <Text style={s.scanBadgeText}>Analysing Uploaded Photo…</Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={s.dropZone}
                  onPress={pickAndAnalyseImage}
                  activeOpacity={0.8}
                >
                  <View style={s.dropIconWrap}>
                    <Ionicons name="cloud-upload" size={38} color={C.amber2} />
                  </View>
                  <Text style={s.dropTitle}>Upload Mushroom Photo</Text>
                  <Text style={s.dropSub}>Tap to browse JPG, PNG or WEBP from gallery</Text>
                  <View style={s.dropPill}>
                    <Ionicons name="images-outline" size={14} color="#fff" />
                    <Text style={s.dropPillText}>Select from Photos</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* 3. ESP32-CAM IOT MODE */
            <View style={[s.cameraContainer, s.esp32Placeholder]}>
              <View style={s.esp32IconCircle}>
                <Ionicons name="hardware-chip" size={40} color={C.cyan} />
              </View>
              <Text style={s.esp32PlaceholderTitle}>ESP32-CAM Remote Ready</Text>
              <Text style={s.esp32PlaceholderSub}>
                Triggers greenhouse camera via AWS IoT Core MQTT and analyses result
              </Text>
              {scanning && (
                <View style={s.scanOverlay} pointerEvents="none">
                  <View style={[s.scanBadge, { borderColor: C.cyan + "66" }]}>
                    <ActivityIndicator size="small" color={C.cyan} />
                    <Text style={[s.scanBadgeText, { color: C.cyan }]}>Waiting for IoT Feed…</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── CARD FOOTER / ACTION BUTTONS ── */}
          <View style={s.camFooter}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={s.camLbl}>
                {captureMode === "mobile" ? (
                  <Text>Source: <Text style={s.camLblBold}>Phone Camera</Text></Text>
                ) : captureMode === "upload" ? (
                  <Text>Source: <Text style={s.camLblBold}>{selectedImage ? "Custom Upload" : "Select Photo"}</Text></Text>
                ) : (
                  <Text>Source: <Text style={[s.camLblBold, { color: C.cyan }]}>ESP32-CAM Node</Text></Text>
                )}
              </Text>
              <Text style={s.camSub}>
                {captureMode === "mobile"
                  ? "Real-time AI camera detection"
                  : captureMode === "upload"
                  ? "Runs ResNet-50 inference on image"
                  : "AWS IoT MQTT telemetry capture"}
              </Text>
            </View>

            <View style={s.footerBtnRow}>
              {/* Quick Upload Button always accessible from Camera Mode */}
              {captureMode === "mobile" && (
                <TouchableOpacity
                  onPress={pickAndAnalyseImage}
                  disabled={scanning}
                  style={s.uploadQuickBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={16} color={C.amber2} />
                  <Text style={s.uploadQuickBtnText}>Upload</Text>
                </TouchableOpacity>
              )}

              {/* In Upload Mode with existing image, show re-pick button */}
              {captureMode === "upload" && selectedImage && (
                <TouchableOpacity
                  onPress={pickAndAnalyseImage}
                  disabled={scanning}
                  style={s.uploadQuickBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={16} color={C.amber2} />
                  <Text style={s.uploadQuickBtnText}>Change</Text>
                </TouchableOpacity>
              )}

              {/* Main Action Scan / Analyse Button */}
              <TouchableOpacity
                onPress={() => {
                  if (captureMode === "mobile") doScan();
                  else if (captureMode === "upload") {
                    if (selectedImage) processImageInference(selectedImage, "upload");
                    else pickAndAnalyseImage();
                  } else doESP32Scan();
                }}
                disabled={scanning}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    scanning
                      ? ["#554030", "#3a2510"]
                      : captureMode === "esp32"
                      ? [C.cyanDark, C.cyan]
                      : [C.brown, C.amber]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.capBtn}
                >
                  {scanning ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                  ) : (
                    <Ionicons
                      name={
                        captureMode === "mobile"
                          ? "scan"
                          : captureMode === "upload"
                          ? "sparkles"
                          : "hardware-chip-outline"
                      }
                      size={15}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={s.capBtnText}>
                    {scanning
                      ? "Processing…"
                      : captureMode === "upload"
                      ? selectedImage
                        ? "Analyse Again"
                        : "Upload Photo"
                      : "Scan Now"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── LATEST RESULT CARD ─────────────────────────────────────────── */}
        <Text style={s.slbl}>LATEST DETECTION RESULT</Text>
        <Animated.View style={[s.resCard, { opacity: fadeAnim }]}>
          <View style={s.resTop}>
            <View style={s.resLeft}>
              <View
                style={[
                  s.statIco,
                  {
                    borderColor: statusColor + "88",
                    backgroundColor: statusColor + "22",
                  },
                ]}
              >
                <Ionicons name={statusIcon} size={15} color={statusColor} />
              </View>
              <View style={{ marginLeft: 8 }}>
                <Text style={[s.statName, { color: statusColor }]}>{statusLabel}</Text>
                <Text style={s.statSub}>Classification confidence</Text>
              </View>
            </View>
            <Text style={[s.confNum, { color: statusColor }]}>
              {result.conf.toFixed(1)}%
            </Text>
          </View>

          {/* Progress bar */}
          <View style={s.barBg}>
            <View
              style={[
                s.barFill,
                { width: `${Math.min(result.conf, 100)}%`, backgroundColor: statusColor },
              ]}
            />
          </View>

          {/* Metadata Grid */}
          <View style={s.metaGrid}>
            {[
              ["Timestamp", result.timestamp],
              ["Model", "ResNet-50 / DenseNet"],
              ["Process Time", result.processTime],
              ["Input Mode", captureMode.toUpperCase()],
            ].map(([k, v]) => (
              <View key={k} style={s.metaRow}>
                <Text style={s.mk}>{k}</Text>
                <Text style={s.mv}>{v}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── RECENT SCANS LIST ──────────────────────────────────────────── */}
        <Text style={s.slbl}>RECENT SCANS</Text>
        {scans.map((sc, i) => (
          <View key={i} style={s.scanRow}>
            <View
              style={[
                s.sdot,
                { backgroundColor: sc.healthy ? C.healthy : C.infected },
              ]}
            />
            <Ionicons
              name={
                sc.source === "upload"
                  ? "cloud-upload-outline"
                  : sc.source === "esp32"
                  ? "hardware-chip-outline"
                  : "camera-outline"
              }
              size={14}
              color={C.muted}
            />
            <Text style={s.stime}>{sc.time}</Text>
            <Text style={s.sconf}>{sc.conf.toFixed(1)}%</Text>
            <View
              style={[
                s.sbadge,
                sc.healthy
                  ? { backgroundColor: C.healthy + "20", borderColor: C.healthy + "50" }
                  : { backgroundColor: C.infected + "1a", borderColor: C.infected + "40" },
              ]}
            >
              <Text
                style={[
                  s.sbadgeText,
                  { color: sc.healthy ? C.healthy : C.infected },
                ]}
              >
                {sc.healthy ? "Healthy" : "Infected"}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      <BottomNav active="camera" router={router} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border2,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.healthy,
  },
  onlineText: { fontSize: 10, color: C.cream2, fontWeight: "500" },

  ptag: {
    fontSize: 9,
    letterSpacing: 2,
    color: C.muted,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  ptitle: { fontSize: 22, fontWeight: "700", color: C.cream, marginBottom: 4 },
  psub: { fontSize: 12, color: C.cream3, marginBottom: 14, lineHeight: 17 },

  // Mode Selector
  modeSelector: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeOption: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border2,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  modeOptionActiveAmber: {
    backgroundColor: C.amber,
    borderColor: C.amber2,
  },
  modeOptionActiveBlue: {
    backgroundColor: C.cyanDark,
    borderColor: C.cyan,
  },
  modeText: { fontSize: 11, fontWeight: "600", color: C.cream2 },
  modeTextActive: { color: "#fff", fontWeight: "700" },

  // Camera Card & Viewport
  camCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border2,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
    backgroundColor: "#0d0703",
    overflow: "hidden",
  },
  camera: { ...StyleSheet.absoluteFillObject },
  uploadedPreview: { ...StyleSheet.absoluteFillObject },

  // Dropzone (Upload Mode)
  dropZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#160e07",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.amber + "60",
    borderRadius: 12,
    margin: 12,
  },
  dropIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.cardLighter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.amber2 + "40",
  },
  dropTitle: { fontSize: 16, fontWeight: "700", color: C.cream, marginBottom: 4 },
  dropSub: { fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 14 },
  dropPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.amber,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dropPillText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Permission fallback
  permWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permTitle: { fontSize: 15, fontWeight: "700", color: C.cream, marginBottom: 6 },
  permSub: { fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 16 },
  grantBtn: {
    backgroundColor: C.amber,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  grantBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // HUD Corners & Scanning
  corner: { position: "absolute", width: 22, height: 22, borderColor: C.amber2, opacity: 0.9 },
  tl: { top: 10, left: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  tr: { top: 10, right: 10, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  br: { bottom: 10, right: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  scanLine: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: C.amber2,
    shadowColor: C.amber2,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    top: "10%",
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,6,4,0.40)",
  },
  scanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(10,6,4,0.85)",
    borderWidth: 1,
    borderColor: C.amber2 + "70",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scanBadgeText: { fontSize: 12, color: C.amber2, fontWeight: "600", letterSpacing: 0.5 },

  // ESP32 Placeholder
  esp32Placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07131d",
    gap: 8,
    padding: 20,
  },
  esp32IconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(2,132,199,0.15)",
    borderWidth: 1.5,
    borderColor: C.cyan + "50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  esp32PlaceholderTitle: { fontSize: 16, fontWeight: "700", color: C.cyan },
  esp32PlaceholderSub: { fontSize: 11, color: "#94a3b8", textAlign: "center", paddingHorizontal: 20 },

  // Cam Footer & Buttons
  camFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  camLbl: { fontSize: 11, color: C.muted },
  camLblBold: { color: C.amber2, fontWeight: "600" },
  camSub: { fontSize: 9, color: C.muted, opacity: 0.7, marginTop: 1 },
  footerBtnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  uploadQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.cardLighter,
    borderWidth: 1,
    borderColor: C.amber2 + "50",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  uploadQuickBtnText: { color: C.amber2, fontSize: 12, fontWeight: "600" },
  capBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  capBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Results Card
  slbl: {
    fontSize: 9,
    letterSpacing: 2,
    color: C.muted,
    fontWeight: "600",
    marginVertical: 8,
    textTransform: "uppercase",
  },
  resCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  resTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resLeft: { flexDirection: "row", alignItems: "center" },
  statIco: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  statName: { fontSize: 16, fontWeight: "700" },
  statSub: { fontSize: 10, color: C.muted, marginTop: 1 },
  confNum: { fontSize: 24, fontWeight: "800" },
  barBg: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  barFill: { height: "100%", borderRadius: 3 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 7,
    width: "48.5%",
  },
  mk: { fontSize: 10, color: C.muted },
  mv: { fontSize: 10, color: C.cream2, fontWeight: "600" },

  // Recent Scans
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  sdot: { width: 7, height: 7, borderRadius: 4 },
  stime: { fontSize: 12, color: C.cream2, fontWeight: "500", minWidth: 32 },
  sconf: { fontSize: 11, color: C.muted, flex: 1, textAlign: "right", marginRight: 6 },
  sbadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  sbadgeText: { fontSize: 9, fontWeight: "600" },
});
