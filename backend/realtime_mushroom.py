import os
import io
import uuid
import json
import asyncio
from datetime import datetime
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.models as tv_models
import torchvision.transforms as transforms
from PIL import Image, UnidentifiedImageError
import boto3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MEAN   = [0.485, 0.456, 0.406]
STD    = [0.229, 0.224, 0.225]

# ── Absolute path so the model loads correctly from any working directory ──────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mushroom_cls.pth")
YOLO_MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yolov8n.pt")

# ─── AWS CONFIG ─────────────────────────────────────────────────────────────
AWS_REGION = "eu-north-1"
S3_BUCKET = "mycotrack-images"
DYNAMO_TABLE = "MycoTrack_Scans"
IOT_ENDPOINT = "a12i78alo13mj4-ats.iot.eu-north-1.amazonaws.com"
DEVICE_ID = "esp32_cam_001"

s3 = boto3.client("s3", region_name=AWS_REGION)
dynamo = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamo.Table(DYNAMO_TABLE)
iot_data = boto3.client('iot-data', region_name=AWS_REGION, endpoint_url=f"https://{IOT_ENDPOINT}")

# ─── WEBSOCKET CONNECTION MANAGER ──────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

# ─── CLASSIFICATION MODEL ───────────────────────────────────────────────────
def get_classifier():
    model = tv_models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = torch.nn.Sequential(
        torch.nn.Dropout(0.4),
        torch.nn.Linear(in_features, 512),
        torch.nn.ReLU(inplace=True),
        torch.nn.Dropout(0.3),
        torch.nn.Linear(512, 2),
    )
    if os.path.exists(MODEL_PATH):
        state = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(state)
    else:
        print(f"Warning: {MODEL_PATH} not found. Running with baseline weights.")
    
    model.eval()
    return model.to(DEVICE)

model = get_classifier()

# Try loading optional YOLOv8 detector
yolo_detector = None
try:
    from ultralytics import YOLO
    if os.path.exists(YOLO_MODEL_PATH):
        yolo_detector = YOLO(YOLO_MODEL_PATH)
        print("Loaded YOLOv8 object detector.")
except Exception as e:
    print(f"YOLOv8 optional detector not initialized: {e}")

tf = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "model":  "ResNet-50 + YOLOv8 Two-Stage",
        "yolo_active": yolo_detector is not None,
        "ws_connections": len(ws_manager.active_connections)
    }

# ── Two-Stage Inference Logic ─────────────────────────────────────────────────
def classify_crop(img_crop: Image.Image):
    tensor = tf(img_crop).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        out   = model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred  = out.argmax(1).item()

    confidence = round(probs[pred].item() * 100, 1)
    return pred == 0, confidence

def run_inference(img: Image.Image):
    detections = []
    w, h = img.size

    # Stage 1: Optional YOLO object detection
    if yolo_detector:
        try:
            results = yolo_detector(img, verbose=False)[0]
            if results.boxes and len(results.boxes) > 0:
                for box in results.boxes:
                    coords = box.xyxy[0].cpu().numpy().tolist()
                    x1, y1, x2, y2 = [int(v) for v in coords]
                    # Clamp coordinates to image boundaries
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)
                    
                    crop = img.crop((x1, y1, x2, y2))
                    is_h, conf = classify_crop(crop)
                    detections.append({
                        "bbox": [x1, y1, x2, y2],
                        "healthy": is_h,
                        "label": "Healthy" if is_h else "Unhealthy",
                        "confidence": conf
                    })
        except Exception as e:
            print(f"YOLO stage execution warning: {e}")

    # Fallback to full frame classification if no YOLO boxes found
    if not detections:
        is_healthy, confidence = classify_crop(img)
        return is_healthy, confidence, [{
            "bbox": [0, 0, w, h],
            "healthy": is_healthy,
            "label": "Healthy" if is_healthy else "Unhealthy",
            "confidence": confidence
        }]

    # Aggregate overall health status (Unhealthy if any box is unhealthy)
    all_healthy = all(d["healthy"] for d in detections)
    avg_conf = round(sum(d["confidence"] for d in detections) / len(detections), 1)
    return all_healthy, avg_conf, detections

# ── WebSocket Live Camera Endpoint ───────────────────────────────────────────
@app.websocket("/ws/camera")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and await any client heartbeat
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# ── Predict Endpoint (App photo upload) ───────────────────────────────────────
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    try:
        is_healthy, confidence, detections = run_inference(img)
        label = "Healthy" if is_healthy else "Unhealthy"

        return {
            "healthy": is_healthy,
            "label": label,
            "confidence": confidence,
            "total_detected": len(detections),
            "detections": detections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

# ── Pending scans for HTTP long-polling ───────────────────────────────────────
pending_scans = {}

@app.post("/trigger-iot")
async def trigger_iot():
    """Trigger ESP32 via MQTT and wait for it to upload photo to /iot-upload"""
    scan_event = asyncio.Event()
    scan_id = str(uuid.uuid4())
    pending_scans[scan_id] = {"event": scan_event, "result": None}
    
    try:
        print(f"Triggering ESP32: {DEVICE_ID}...")
        iot_data.publish(topic=f"mycotrack/{DEVICE_ID}/trigger", qos=1, payload='{"trigger": true}')
    except Exception as e:
        del pending_scans[scan_id]
        raise HTTPException(status_code=500, detail=f"Failed to trigger IoT: {e}")
    
    try:
        await asyncio.wait_for(scan_event.wait(), timeout=15.0)
        res = pending_scans.get(scan_id, {}).get("result")
        if scan_id in pending_scans:
            del pending_scans[scan_id]
        return res
    except asyncio.TimeoutError:
        if scan_id in pending_scans:
            del pending_scans[scan_id]
        raise HTTPException(status_code=504, detail="ESP32 camera timed out")

# ── IoT Upload Endpoint (Used by ESP32-CAM) ───────────────────────────────
@app.post("/iot-upload")
async def iot_upload(file: UploadFile = File(...)):
    """Receives image from ESP32, runs two-stage inference, saves to S3/Dynamo, broadcasts via WebSocket & MQTT."""
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image bytes from ESP32")

    # 1. Run Two-Stage Inference
    is_healthy, confidence, detections = run_inference(img)
    label = "Healthy" if is_healthy else "Unhealthy"

    # 2. Upload to S3
    ts = datetime.utcnow()
    scan_id = f"{ts.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    s3_key = f"captures/{DEVICE_ID}/{ts.strftime('%Y/%m/%d')}/{scan_id}.jpg"
    
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=raw,
            ContentType="image/jpeg",
        )
        download_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    except Exception as e:
        print(f"S3 Upload failed: {e}")
        download_url = "s3_upload_failed"

    # 3. Write metadata to DynamoDB
    item = {
        "scanId":        scan_id,
        "deviceId":      DEVICE_ID,
        "mode":          "manual",
        "timestamp":     ts.isoformat() + "Z",
        "s3Key":         s3_key,
        "downloadUrl":   download_url,
        "status":        "analysed",
        "healthy":       is_healthy,
        "confidence":    confidence,
        "totalDetected": len(detections),
        "detections":    json.dumps(detections),
        "createdAt":     int(ts.timestamp()),
    }
    
    try:
        table.put_item(Item=item)
    except Exception as e:
        print(f"DynamoDB Put failed: {e}")

    # 4. Resolve long-polling requests and broadcast live to WebSocket clients
    result_data = {
        "scanId": scan_id,
        "healthy": is_healthy,
        "confidence": confidence,
        "downloadUrl": download_url,
        "timestamp": item["timestamp"],
        "label": label,
        "totalDetected": len(detections),
        "detections": detections
    }

    for sid, req in list(pending_scans.items()):
        req["result"] = result_data
        req["event"].set()

    # Broadcast to WebSockets
    await ws_manager.broadcast({"event": "new_scan", "data": result_data})

    # 5. Publish MQTT result to AWS IoT Core
    try:
        mqtt_payload = json.dumps({"trigger": "esp32_result", **result_data})
        iot_data.publish(
            topic=f"mycotrack/{DEVICE_ID}/result",
            qos=1,
            payload=mqtt_payload
        )
    except Exception as e:
        print(f"IoT Publish failed: {e}")

    return {"status": "success", "scanId": scan_id, "healthy": is_healthy, "detections": len(detections)}