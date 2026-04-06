"""
MycoTrack — Raspberry Pi Image Capture & Firebase Uploader
===========================================================
Supports two modes:
  - Automatic Mode : captures images every 2-3 hours (4-6 per day)
  - Manual Mode    : triggered by the mobile app via a Firebase Realtime DB flag

Hardware: Raspberry Pi + Pi Camera Module (or USB webcam)
Prereqs:
  pip install firebase-admin picamera2 opencv-python Pillow requests schedule

Firebase setup:
  1. Go to Firebase Console > Project Settings > Service Accounts
  2. Generate a new private key → save as  serviceAccountKey.json
  3. Place serviceAccountKey.json in the same folder as this script
"""

import io, os, time, uuid, logging, threading, schedule
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# ── Firebase Admin SDK ────────────────────────────────────────────────────────
import firebase_admin
from firebase_admin import credentials, storage, db

# ── Config ────────────────────────────────────────────────────────────────────
SERVICE_ACCOUNT_KEY = Path(__file__).parent / "serviceAccountKey.json"

FIREBASE_CONFIG = {
    "storageBucket": "mycotrack-9cc24.firebasestorage.app",
    "databaseURL":   "https://mycotrack-9cc24-default-rtdb.firebaseio.com",
}

# Image capture settings
IMG_SIZE        = (224, 224)          # resize before upload (matches ResNet input)
JPEG_QUALITY    = 85                  # 1-100; lower = smaller file
CAPTURE_INTERVAL_HOURS = 2.5         # auto-mode interval (2-3 h)
DEVICE_ID       = "pi_cam_001"        # unique ID for this Raspberry Pi

# Local staging folder (images are deleted after successful upload)
STAGING_DIR = Path("/tmp/mycotrack_staging")
STAGING_DIR.mkdir(parents=True, exist_ok=True)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/tmp/mycotrack_pi.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("mycotrack")


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Firebase initialisation
# ─────────────────────────────────────────────────────────────────────────────

def init_firebase():
    if firebase_admin._apps:
        return  # already initialised
    cred = credentials.Certificate(str(SERVICE_ACCOUNT_KEY))
    firebase_admin.initialize_app(cred, FIREBASE_CONFIG)
    log.info("Firebase initialised OK")


# ─────────────────────────────────────────────────────────────────────────────
# 2.  Camera helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_camera():
    """
    Returns a camera object.
    Tries PiCamera2 first (Pi Camera Module), falls back to OpenCV (USB webcam).
    """
    try:
        from picamera2 import Picamera2

        # List available cameras first — avoids IndexError on index 0
        cameras = Picamera2.global_camera_info()
        log.info(f"Cameras detected by picamera2: {cameras}")

        if not cameras:
            raise RuntimeError("picamera2: no cameras in global_camera_info()")

        # Use the first available camera's Num explicitly
        cam_index = cameras[0]['Num']
        cam = Picamera2(cam_index)
        config = cam.create_still_configuration(
            main={"size": (1920, 1080), "format": "RGB888"}
        )
        cam.configure(config)
        cam.start()
        time.sleep(2)           # warm-up
        log.info(f"Camera: PiCamera2 index {cam_index} OK")
        return ("picamera2", cam)

    except Exception as e:
        log.warning(f"PiCamera2 unavailable ({e}), falling back to OpenCV/USB webcam")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError("No camera found — check connections")
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        log.info("Camera: OpenCV USB webcam")
        return ("opencv", cap)


def capture_frame(cam_tuple) -> np.ndarray:
    """Capture one frame; returns an RGB numpy array."""
    kind, cam = cam_tuple
    if kind == "picamera2":
        frame = cam.capture_array()          # already RGB888
        return frame
    else:
        ret, frame = cam.read()
        if not ret:
            raise RuntimeError("Failed to read frame from webcam")
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)


def release_camera(cam_tuple):
    kind, cam = cam_tuple
    if kind == "picamera2":
        cam.stop()
    else:
        cam.release()


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Preprocessing  (resize + normalise + denoise)
# ─────────────────────────────────────────────────────────────────────────────

def preprocess(frame_rgb: np.ndarray) -> bytes:
    """
    Apply the same preprocessing as the training pipeline:
      1. Denoise (fast bilateral filter)
      2. Resize to 256 × 256 (centre-crop safe)
      3. Encode as JPEG
    The cloud function will do CenterCrop(224) + ToTensor + Normalise before inference.
    """
    # Denoise
    denoised = cv2.bilateralFilter(frame_rgb, d=5, sigmaColor=50, sigmaSpace=50)

    # Resize to 256 on shorter side, preserving aspect ratio
    h, w = denoised.shape[:2]
    scale = 256 / min(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(denoised, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # JPEG encode
    pil_img = Image.fromarray(resized)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=JPEG_QUALITY)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# 4.  Firebase upload
# ─────────────────────────────────────────────────────────────────────────────

def upload_image(jpeg_bytes: bytes, mode: str) -> dict:
    """
    Uploads preprocessed JPEG to Firebase Storage and writes metadata to
    Realtime Database.

    Returns the metadata dict written to RTDB.
    """
    ts          = datetime.utcnow()
    image_id    = f"{ts.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    storage_path = f"captures/{DEVICE_ID}/{ts.strftime('%Y/%m/%d')}/{image_id}.jpg"

    # ── Upload to Cloud Storage ───────────────────────────────────────────
    bucket = storage.bucket()
    blob   = bucket.blob(storage_path)
    blob.upload_from_string(jpeg_bytes, content_type="image/jpeg")
    blob.make_public()
    download_url = blob.public_url

    # ── Write metadata to Realtime Database ──────────────────────────────
    meta = {
        "imageId":     image_id,
        "deviceId":    DEVICE_ID,
        "mode":        mode,               # "auto" | "manual"
        "timestamp":   ts.isoformat() + "Z",
        "storagePath": storage_path,
        "downloadUrl": download_url,
        "status":      "pending",          # → "analysed" after cloud function runs
        "result":      None,
        "confidence":  None,
    }

    # Push to  /captures/{DEVICE_ID}/{image_id}
    db.reference(f"/captures/{DEVICE_ID}/{image_id}").set(meta)

    # Also push to /queue  so the cloud function picks it up immediately
    db.reference("/queue").push({
        "imageId":     image_id,
        "deviceId":    DEVICE_ID,
        "storagePath": storage_path,
        "timestamp":   meta["timestamp"],
    })

    log.info(f"Uploaded [{mode}] → {storage_path}")
    return meta


# ─────────────────────────────────────────────────────────────────────────────
# 5.  Capture + upload — one shot
# ─────────────────────────────────────────────────────────────────────────────

_camera = None  # global; initialised once

def capture_and_upload(mode: str = "auto"):
    global _camera
    try:
        if _camera is None:
            _camera = get_camera()

        frame     = capture_frame(_camera)
        jpeg      = preprocess(frame)

        # Save locally as a backup before uploading
        local_path = STAGING_DIR / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
        local_path.write_bytes(jpeg)

        meta = upload_image(jpeg, mode=mode)

        # Delete local copy after successful upload
        local_path.unlink(missing_ok=True)
        return meta

    except Exception as exc:
        log.error(f"capture_and_upload failed: {exc}", exc_info=True)
        # Camera may be in a bad state — force re-init next time
        if _camera:
            try:
                release_camera(_camera)
            except Exception:
                pass
            _camera = None
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 6.  Manual-mode trigger listener (Firebase Realtime DB)
# ─────────────────────────────────────────────────────────────────────────────

def watch_manual_trigger():
    """
    Listens to  /triggers/{DEVICE_ID}/manualCapture  in the Realtime Database.
    When the mobile app sets it to true, we capture immediately and reset the flag.
    """
    trigger_ref = db.reference(f"/triggers/{DEVICE_ID}/manualCapture")

    def on_trigger(event):
        if event.data is True:
            log.info("Manual trigger received from mobile app — capturing now")
            capture_and_upload(mode="manual")
            # Reset the flag so the next press works
            trigger_ref.set(False)

    trigger_ref.listen(on_trigger)
    log.info(f"Listening for manual triggers at /triggers/{DEVICE_ID}/manualCapture")


# ─────────────────────────────────────────────────────────────────────────────
# 7.  Main loop
# ─────────────────────────────────────────────────────────────────────────────

def main():
    init_firebase()

    # Start manual-trigger listener in background thread
    listener_thread = threading.Thread(target=watch_manual_trigger, daemon=True)
    listener_thread.start()

    # Schedule automatic captures every CAPTURE_INTERVAL_HOURS hours
    schedule.every(CAPTURE_INTERVAL_HOURS).hours.do(capture_and_upload, mode="auto")

    # Take one shot immediately on startup
    capture_and_upload(mode="auto")

    log.info(f"Auto-capture scheduled every {CAPTURE_INTERVAL_HOURS} h")

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        log.info("Shutting down MycoTrack Pi agent")
        if _camera:
            release_camera(_camera)


if __name__ == "__main__":
    main()
