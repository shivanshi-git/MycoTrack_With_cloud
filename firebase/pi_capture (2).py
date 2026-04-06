"""
MycoTrack — Raspberry Pi Image Capture & Firebase Uploader
===========================================================
Supports two modes:
  - Automatic Mode : captures images every 2-3 hours (4-6 per day)
  - Manual Mode    : triggered by the mobile app via a Firebase Realtime DB flag

Hardware: Raspberry Pi + Pi Camera Module (or USB webcam)
Prereqs:
  pip install firebase-admin opencv-python-headless Pillow requests schedule
  sudo apt install -y python3-picamera2

Firebase setup:
  1. Go to Firebase Console > Project Settings > Service Accounts
  2. Generate a new private key -> save as  serviceAccountKey.json
  3. Place serviceAccountKey.json in the same folder as this script
"""

import io, os, time, uuid, logging, threading, schedule
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import firebase_admin
from firebase_admin import credentials, storage, db

SERVICE_ACCOUNT_KEY = Path(__file__).parent / "serviceAccountKey.json"

FIREBASE_CONFIG = {
    "storageBucket": "mycotrack-9cc24.firebasestorage.app",
    "databaseURL":   "https://mycotrack-9cc24-default-rtdb.firebaseio.com",
}

IMG_SIZE               = (224, 224)
JPEG_QUALITY           = 85
CAPTURE_INTERVAL_HOURS = 2.5
DEVICE_ID              = "pi_cam_001"

STAGING_DIR = Path("/tmp/mycotrack_staging")
STAGING_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/tmp/mycotrack_pi.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("mycotrack")


def init_firebase():
    if firebase_admin._apps:
        return
    cred = credentials.Certificate(str(SERVICE_ACCOUNT_KEY))
    firebase_admin.initialize_app(cred, FIREBASE_CONFIG)
    log.info("Firebase initialised OK")


def capture_single_frame() -> np.ndarray:
    """
    Opens camera, grabs ONE frame, closes camera immediately.
    Camera is NEVER held open between captures — fixes the picamera2
    lock-up bug where /dev/video* stays locked after first use.
    """
    # Try PiCamera2 first
    try:
        from picamera2 import Picamera2

        cameras = Picamera2.global_camera_info()
        log.info(f"picamera2 detected: {cameras}")

        if not cameras:
            raise RuntimeError("global_camera_info() returned empty list")

        cam_index = cameras[0]['Num']
        cam = Picamera2(cam_index)
        config = cam.create_still_configuration(
            main={"size": (1920, 1080), "format": "RGB888"}
        )
        cam.configure(config)
        cam.start()
        time.sleep(2)               # warm-up — required, do not remove
        frame = cam.capture_array() # grab frame
        cam.stop()                  # stop streaming
        cam.close()                 # fully release /dev/video*
        log.info(f"PiCamera2 index {cam_index}: captured and closed OK")
        return frame

    except Exception as e:
        log.warning(f"PiCamera2 failed ({e}), trying OpenCV")

    # Fallback: OpenCV USB webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("No camera found — check connections")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    time.sleep(1)
    ret, frame = cap.read()
    cap.release()                   # release immediately
    if not ret:
        raise RuntimeError("OpenCV: failed to read frame")
    log.info("OpenCV: captured and released OK")
    return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)


def preprocess(frame_rgb: np.ndarray) -> bytes:
    denoised = cv2.bilateralFilter(frame_rgb, d=5, sigmaColor=50, sigmaSpace=50)
    h, w = denoised.shape[:2]
    scale = 256 / min(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(denoised, (new_w, new_h), interpolation=cv2.INTER_AREA)
    pil_img = Image.fromarray(resized)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=JPEG_QUALITY)
    return buf.getvalue()


def upload_image(jpeg_bytes: bytes, mode: str) -> dict:
    ts           = datetime.utcnow()
    image_id     = f"{ts.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    storage_path = f"captures/{DEVICE_ID}/{ts.strftime('%Y/%m/%d')}/{image_id}.jpg"

    bucket = storage.bucket()
    blob   = bucket.blob(storage_path)
    blob.upload_from_string(jpeg_bytes, content_type="image/jpeg")
    blob.make_public()
    download_url = blob.public_url

    meta = {
        "imageId":     image_id,
        "deviceId":    DEVICE_ID,
        "mode":        mode,
        "timestamp":   ts.isoformat() + "Z",
        "storagePath": storage_path,
        "downloadUrl": download_url,
        "status":      "pending",
        "result":      None,
        "confidence":  None,
    }

    db.reference(f"/captures/{DEVICE_ID}/{image_id}").set(meta)
    db.reference("/queue").push({
        "imageId":     image_id,
        "deviceId":    DEVICE_ID,
        "storagePath": storage_path,
        "timestamp":   meta["timestamp"],
    })

    log.info(f"Uploaded [{mode}] -> {storage_path}")
    return meta


def capture_and_upload(mode: str = "auto"):
    """Opens camera fresh, shoots, closes, uploads. No persistent camera handle."""
    try:
        frame = capture_single_frame()
        jpeg  = preprocess(frame)

        local_path = STAGING_DIR / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
        local_path.write_bytes(jpeg)

        meta = upload_image(jpeg, mode=mode)
        local_path.unlink(missing_ok=True)
        return meta

    except Exception as exc:
        log.error(f"capture_and_upload failed: {exc}", exc_info=True)
        return None


def watch_manual_trigger():
    trigger_ref = db.reference(f"/triggers/{DEVICE_ID}/manualCapture")

    def on_trigger(event):
        if event.data is True:
            log.info("Manual trigger received — capturing now")
            capture_and_upload(mode="manual")
            trigger_ref.set(False)

    trigger_ref.listen(on_trigger)
    log.info(f"Listening for manual triggers at /triggers/{DEVICE_ID}/manualCapture")


def main():
    init_firebase()

    listener_thread = threading.Thread(target=watch_manual_trigger, daemon=True)
    listener_thread.start()

    schedule.every(CAPTURE_INTERVAL_HOURS).hours.do(capture_and_upload, mode="auto")

    capture_and_upload(mode="auto")
    log.info(f"Auto-capture scheduled every {CAPTURE_INTERVAL_HOURS} h")

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        log.info("Shutting down MycoTrack Pi agent")


if __name__ == "__main__":
    main()
