# 🚀 AI Camera System Upgrade Implementation Plan

Enhancing the **MycoTrack AI Camera System** by upgrading the ESP32-CAM firmware, implementing a two-stage computer vision pipeline (YOLOv8 Object Detection + DenseNet121 Classification), and integrating real-time WebSocket communication.

---

## User Review Required

> [!IMPORTANT]
> **1. Validation Dataset Re-balancing**:
> `dataset/MycoTrack/mycotrack_split/val` currently only contains `healthy` images. We will move 100 `unhealthy` images from `train/unhealthy` into `val/unhealthy` to allow unbiased validation scoring during training.

> [!NOTE]
> **2. Flash LED (GPIO 4) Operation**:
> Enabling the onboard flash LED on the ESP32-CAM during photo capture significantly improves image quality in dark growth chambers, but requires sufficient power supply (5V 2A recommended).

---

## Proposed Technical Changes

---

### Phase 1: ESP32-CAM Firmware Enhancements

#### [MODIFY] [esp32_cam_aws.ino](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/esp32_cam_aws/esp32_cam_aws.ino)
- Configure Flash LED pin (`GPIO 4`) as `OUTPUT` and toggle HIGH during frame capture.
- Implement frame warm-up buffer (discard 3 frames after waking sensor) for Auto White Balance (AWB) and Auto Exposure Control (AEC) stabilization.
- Set frame size to `FRAMESIZE_SVGA` (800x600) when PSRAM is detected.
- Implement non-blocking reconnect timer logic for WiFi and AWS IoT MQTT connection loops.

---

### Phase 2: Two-Stage AI Inference Pipeline

#### [NEW] [backend/train_pipeline.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/train_pipeline.py)
- Script to train/export YOLOv8 detection model (`yolov8n.pt`) using `dataset/MycoTrack/mycotrack_yolo`.
- Script to train/export DenseNet121 classifier (`mushroom_cls_densenet121.pkl`) using `mycotrack_split`.

#### [MODIFY] [realtime_mushroom.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/realtime_mushroom.py)
- Upgrade `run_inference(img)` to a two-stage pipeline:
  1. **Stage 1 (YOLOv8)**: Detect mushroom bounding boxes in full frame.
  2. **Stage 2 (DenseNet121)**: Crop detected boxes and classify each as `Healthy` or `Unhealthy`.
- Return detailed JSON response including bounding box coordinates `[x1, y1, x2, y2]`, per-mushroom health status, and confidence scores.

---

### Phase 3: Real-Time Communication & Cloud Storage

#### [MODIFY] [realtime_mushroom.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/realtime_mushroom.py)
- Add `/ws/camera` WebSocket endpoint for live camera feed and real-time detection notifications.
- Store detailed per-box metadata and S3 image URLs in DynamoDB `MycoTrack_Scans` table.

---

## Verification Plan

### Automated Tests
- Test firmware compilation using `arduino-cli` or syntax validation.
- Run Python test script against `/predict` and `/iot-upload` endpoints using sample dataset images.
```bash
python3 -m unittest backend/tests/test_inference.py
```

### Manual Verification
1. Trigger photo capture via MQTT topic `mycotrack/esp32_cam_001/trigger`.
2. Inspect backend logs for two-stage inference (YOLO bounding box extraction + DenseNet classification).
3. Verify S3 image upload and DynamoDB record creation.
