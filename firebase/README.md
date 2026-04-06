# MycoTrack — Firebase + Raspberry Pi Integration Guide

## Architecture Overview

```
Pi Camera ──► pi_capture.py ──► Firebase Storage (JPEG)
                                        │
                                Firebase RTDB /queue
                                        │
                              Cloud Function (main.py)
                                        │
                              ResNet-50 Inference
                                        │
                     ┌──────────────────┴──────────────────┐
                     │                                       │
              /captures/{deviceId}                    /alerts  (if unhealthy)
                     │                                       │
              Mobile App (config.js)          Push notification / alert badge
```

---

## Part 1 — Raspberry Pi Setup

### 1a. Install system packages
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv libcamera-dev python3-picamera2
```

### 1b. Create project folder and virtual env
```bash
mkdir ~/mycotrack && cd ~/mycotrack
python3 -m venv venv
source venv/bin/activate
pip install firebase-admin picamera2 opencv-python-headless \
            Pillow requests schedule
```

### 1c. Add your files
```
~/mycotrack/
├── pi_capture.py          ← from this package
├── serviceAccountKey.json ← download from Firebase Console
```

**Get serviceAccountKey.json:**
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" → Download → rename to `serviceAccountKey.json`
3. Copy to `~/mycotrack/serviceAccountKey.json`

### 1d. Enable camera
```bash
# For Pi Camera Module (libcamera stack):
sudo raspi-config  # → Interface Options → Camera → Enable

# Test:
libcamera-still -o test.jpg
```

### 1e. Test the script
```bash
cd ~/mycotrack
source venv/bin/activate
python pi_capture.py
```
You should see a JPEG uploaded to Firebase Storage and a new entry in the RTDB.

### 1f. Auto-start on boot
```bash
sudo cp mycotrack.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mycotrack
sudo systemctl start mycotrack

# Check status / logs:
sudo systemctl status mycotrack
sudo journalctl -u mycotrack -f
```

---

## Part 2 — Firebase Cloud Function Setup

### 2a. Prerequisites
```bash
npm install -g firebase-tools
firebase login
firebase init functions   # choose Python runtime
```

### 2b. Project structure
```
functions/
├── main.py                ← from this package
├── requirements.txt
└── mushroom_cls.pth       ← your trained weights from Colab
```

**requirements.txt:**
```
firebase-functions>=0.1.0
firebase-admin>=6.0.0
torch==2.1.0+cpu   --extra-index-url https://download.pytorch.org/whl/cpu
torchvision==0.16.0+cpu
Pillow>=10.0.0
```

> **Note:** Use the CPU-only torch wheel — Cloud Functions have no GPU.
> The model is small enough that CPU inference takes ~200 ms per image.

### 2c. Copy trained weights
```bash
# From Colab, download mushroom_cls.pth from Google Drive, then:
cp ~/Downloads/mushroom_cls.pth functions/
```

### 2d. Deploy
```bash
firebase deploy --only functions,database
```

---

## Part 3 — Mobile App (React Native)

### 3a. Install dependencies
```bash
npm install firebase @react-native-async-storage/async-storage
```

### 3b. Add firebase config
Copy `src/firebase/config.js` into your React Native project.

### 3c. Trigger a manual capture
```js
import { triggerManualCapture } from "./firebase/config";

// In a button handler:
await triggerManualCapture("pi_cam_001");  // must match DEVICE_ID in pi_capture.py
```

### 3d. Display live capture history
```js
import { useCaptureHistory } from "./firebase/config";

const { captures, loading } = useCaptureHistory("pi_cam_001");
```

---

## Part 4 — RTDB Data Schema

```
/captures/{deviceId}/{imageId}
  imageId:      "20250402_083012_a1b2c3d4"
  deviceId:     "pi_cam_001"
  mode:         "auto" | "manual"
  timestamp:    "2025-04-02T08:30:12Z"
  storagePath:  "captures/pi_cam_001/2025/04/02/{imageId}.jpg"
  downloadUrl:  "https://storage.googleapis.com/..."
  status:       "pending" → "analysed" | "error"
  result:       "Healthy" | "Unhealthy" | null
  confidence:   0.9712 | null
  probabilities: { Healthy: 0.0288, Unhealthy: 0.9712 }

/queue/{pushId}          ← consumed by Cloud Function, then deleted
/triggers/{deviceId}/manualCapture   ← mobile writes true; Pi resets to false
/alerts/{pushId}         ← written only when result == "Unhealthy"
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `No camera found` | Check `libcamera-still -o test.jpg` works; enable camera in raspi-config |
| `Permission denied: serviceAccountKey.json` | `chmod 600 serviceAccountKey.json` |
| Cloud Function times out | Increase timeout in Firebase Console → Functions → Edit |
| `state_dict` mismatch | Make sure `mushroom_cls.pth` was saved with `resnet50` architecture |
| Manual trigger not firing | Confirm `DEVICE_ID` in pi_capture.py matches the one used in the app |
