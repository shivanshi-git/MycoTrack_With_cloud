"""
MycoTrack — Raspberry Pi Image Capture  (AWS version)
======================================================
Replaces Firebase Storage + RTDB with:
  - AWS S3          → image storage
  - AWS DynamoDB    → metadata / scan history
  - AWS IoT Core    → real-time MQTT trigger from mobile app

Hardware: Raspberry Pi + Pi Camera Module (or USB webcam)

Prereqs:
  pip install boto3 awsiotsdk opencv-python-headless Pillow schedule

AWS setup:
  1. Create an IAM user with S3 + DynamoDB + IoT permissions (see README)
  2. Run: aws configure  (or set env vars below)
  3. Create IoT Thing for your Pi in AWS Console → copy endpoint
"""

import io, os, time, uuid, logging, threading, schedule
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import boto3
from awscrt import mqtt
from awsiot import mqtt_connection_builder

# ─── AWS Config ───────────────────────────────────────────────────────────────
# Option A: Set env vars (recommended for Pi)
#   export AWS_ACCESS_KEY_ID=...
#   export AWS_SECRET_ACCESS_KEY=...
#   export AWS_DEFAULT_REGION=us-east-1
#
# Option B: Hardcode (dev only — never commit)
AWS_REGION        = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
S3_BUCKET         = "mycotrack-images"            # ← your S3 bucket
DYNAMO_TABLE      = "MycoTrack_Scans"             # ← your DynamoDB table
IOT_ENDPOINT      = "xxxxxxxx-ats.iot.us-east-1.amazonaws.com"  # ← your IoT endpoint
IOT_CERT_PATH     = Path(__file__).parent / "certs" / "certificate.pem.crt"
IOT_KEY_PATH      = Path(__file__).parent / "certs" / "private.pem.key"
IOT_CA_PATH       = Path(__file__).parent / "certs" / "AmazonRootCA1.pem"
IOT_TOPIC_TRIGGER = "mycotrack/pi_cam_001/trigger"   # mobile app publishes here
IOT_TOPIC_RESULT  = "mycotrack/pi_cam_001/result"    # Pi publishes results here

DEVICE_ID              = "pi_cam_001"
JPEG_QUALITY           = 85
CAPTURE_INTERVAL_HOURS = 2.5

STAGING_DIR = Path("/tmp/mycotrack_staging")
STAGING_DIR.mkdir(parents=True, exist_ok=True)

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/tmp/mycotrack_pi.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("mycotrack-aws")

# ─── AWS Clients ──────────────────────────────────────────────────────────────
s3      = boto3.client("s3",       region_name=AWS_REGION)
dynamo  = boto3.resource("dynamodb", region_name=AWS_REGION)
table   = dynamo.Table(DYNAMO_TABLE)


# ─────────────────────────────────────────────────────────────────────────────
# Camera helpers (unchanged from Firebase version)
# ─────────────────────────────────────────────────────────────────────────────

def capture_single_frame() -> np.ndarray:
    try:
        from picamera2 import Picamera2
        cameras = Picamera2.global_camera_info()
        if not cameras:
            raise RuntimeError("No cameras found")
        cam = Picamera2(cameras[0]["Num"])
        config = cam.create_still_configuration(main={"size": (1920, 1080), "format": "RGB888"})
        cam.configure(config)
        cam.start()
        time.sleep(2)
        frame = cam.capture_array()
        cam.stop()
        cam.close()
        log.info("PiCamera2: captured OK")
        return frame
    except Exception as e:
        log.warning(f"PiCamera2 failed ({e}), trying OpenCV")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("No camera found")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    time.sleep(1)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise RuntimeError("OpenCV: failed to read frame")
    return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)


def preprocess(frame_rgb: np.ndarray) -> bytes:
    denoised = cv2.bilateralFilter(frame_rgb, d=5, sigmaColor=50, sigmaSpace=50)
    h, w = denoised.shape[:2]
    scale = 256 / min(h, w)
    resized = cv2.resize(denoised, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    buf = io.BytesIO()
    Image.fromarray(resized).save(buf, format="JPEG", quality=JPEG_QUALITY)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# AWS Upload  (replaces Firebase upload_image)
# ─────────────────────────────────────────────────────────────────────────────

def upload_to_aws(jpeg_bytes: bytes, mode: str) -> dict:
    ts        = datetime.utcnow()
    image_id  = f"{ts.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    s3_key    = f"captures/{DEVICE_ID}/{ts.strftime('%Y/%m/%d')}/{image_id}.jpg"

    # ── 1. Upload image to S3 ─────────────────────────────────────────────────
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=jpeg_bytes,
        ContentType="image/jpeg",
    )
    download_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    log.info(f"S3 upload OK → s3://{S3_BUCKET}/{s3_key}")

    # ── 2. Write metadata to DynamoDB ─────────────────────────────────────────
    item = {
        "scanId":      image_id,
        "deviceId":    DEVICE_ID,
        "mode":        mode,                      # "auto" | "manual"
        "timestamp":   ts.isoformat() + "Z",
        "s3Key":       s3_key,
        "downloadUrl": download_url,
        "status":      "pending",                 # → "analysed" after inference
        "healthy":     None,
        "confidence":  None,
        "createdAt":   int(ts.timestamp()),
    }
    table.put_item(Item=item)
    log.info(f"DynamoDB write OK → scanId={image_id}")

    return item


# ─────────────────────────────────────────────────────────────────────────────
# Capture + upload
# ─────────────────────────────────────────────────────────────────────────────

def capture_and_upload(mode: str = "auto"):
    try:
        frame = capture_single_frame()
        jpeg  = preprocess(frame)

        # Save locally as backup
        local_path = STAGING_DIR / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
        local_path.write_bytes(jpeg)

        meta = upload_to_aws(jpeg, mode=mode)
        local_path.unlink(missing_ok=True)

        log.info(f"capture_and_upload [{mode}] complete")
        return meta

    except Exception as exc:
        log.error(f"capture_and_upload failed: {exc}", exc_info=True)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# AWS IoT Core MQTT trigger listener
# Replaces: Firebase Realtime DB listener at /triggers/{DEVICE_ID}/manualCapture
#
# The mobile app publishes: { "trigger": true, "deviceId": "pi_cam_001" }
# to topic: mycotrack/pi_cam_001/trigger
# ─────────────────────────────────────────────────────────────────────────────

mqtt_connection = None

def on_message_received(topic, payload, dup, qos, retain, **kwargs):
    import json
    try:
        data = json.loads(payload)
        if data.get("trigger") is True:
            log.info(f"IoT trigger received on {topic} — capturing now")
            capture_and_upload(mode="manual")
    except Exception as e:
        log.error(f"on_message_received error: {e}")


def init_iot_listener():
    global mqtt_connection

    # ── Certificate-based auth (recommended for Pi) ───────────────────────
    # Download certs from AWS Console → IoT Core → Security → Certificates
    if IOT_CERT_PATH.exists():
        mqtt_connection = mqtt_connection_builder.mtls_from_path(
            endpoint=IOT_ENDPOINT,
            cert_filepath=str(IOT_CERT_PATH),
            pri_key_filepath=str(IOT_KEY_PATH),
            ca_filepath=str(IOT_CA_PATH),
            client_id=f"mycotrack-pi-{DEVICE_ID}",
            clean_session=False,
            keep_alive_secs=30,
        )
    else:
        # ── IAM credentials (simpler, uses boto3 session) ─────────────────
        from awsiot import mqtt_connection_builder as mcb
        mqtt_connection = mcb.websockets_with_default_aws_signing(
            endpoint=IOT_ENDPOINT,
            region=AWS_REGION,
            client_id=f"mycotrack-pi-{DEVICE_ID}",
        )

    connect_future = mqtt_connection.connect()
    connect_future.result(timeout=10)
    log.info(f"IoT Core connected: {IOT_ENDPOINT}")

    subscribe_future, _ = mqtt_connection.subscribe(
        topic=IOT_TOPIC_TRIGGER,
        qos=mqtt.QoS.AT_LEAST_ONCE,
        callback=on_message_received,
    )
    subscribe_future.result(timeout=5)
    log.info(f"Subscribed to {IOT_TOPIC_TRIGGER}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # Start IoT listener in background
    iot_thread = threading.Thread(target=init_iot_listener, daemon=True)
    iot_thread.start()

    # Schedule auto-captures
    schedule.every(CAPTURE_INTERVAL_HOURS).hours.do(capture_and_upload, mode="auto")

    # First capture on startup
    capture_and_upload(mode="auto")
    log.info(f"Auto-capture every {CAPTURE_INTERVAL_HOURS}h — running")

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        log.info("Shutting down")
        if mqtt_connection:
            mqtt_connection.disconnect()


if __name__ == "__main__":
    main()
