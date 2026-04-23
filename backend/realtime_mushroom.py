import os
import io
import uuid
import json
import asyncio
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
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
    # Load model
    if os.path.exists(MODEL_PATH):
        state = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(state)
    else:
        print(f"Warning: {MODEL_PATH} not found. Running with random weights.")
    
    model.eval()
    return model.to(DEVICE)

model = get_classifier()

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
        "model":  "ResNet-50",
    }

# ── Run Inference Logic ───────────────────────────────────────────────────────
def run_inference(img: Image.Image):
    tensor = tf(img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        out   = model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred  = out.argmax(1).item()

    confidence = round(probs[pred].item() * 100, 1)
    return pred == 0, confidence

# ── Original Predict Endpoint (App manual photo upload) ───────────────────────
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
        is_healthy, confidence = run_inference(img)
        label = "Healthy" if is_healthy else "Unhealthy"

        return {
            "healthy": is_healthy,
            "label": label,
            "confidence": confidence,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

# ── Global pending scans for HTTP long-polling ────────────────────────────────
pending_scans = {}

@app.post("/trigger-iot")
async def trigger_iot():
    """Trigger ESP32 via MQTT and wait for it to upload the photo to /iot-upload"""
    scan_event = asyncio.Event()
    scan_id = str(uuid.uuid4())
    pending_scans[scan_id] = {"event": scan_event, "result": None}
    
    # Trigger ESP32
    try:
        print(f"Triggering ESP32: {DEVICE_ID}...")
        iot_data.publish(topic=f"mycotrack/{DEVICE_ID}/trigger", qos=1, payload='{"trigger": true}')
    except Exception as e:
        del pending_scans[scan_id]
        raise HTTPException(status_code=500, detail=f"Failed to trigger IoT: {e}")
    
    # Wait for ESP32 to upload to /iot-upload (15 second timeout)
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

# ── New IoT Upload Endpoint (Used by ESP32-CAM) ───────────────────────────────
@app.post("/iot-upload")
async def iot_upload(file: UploadFile = File(...)):
    """Receives image from ESP32, runs inference, saves to S3/Dynamo, and alerts via IoT."""
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image bytes from ESP32")

    # 1. Inference
    is_healthy, confidence = run_inference(img)
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
        "scanId":      scan_id,
        "deviceId":    DEVICE_ID,
        "mode":        "manual",
        "timestamp":   ts.isoformat() + "Z",
        "s3Key":       s3_key,
        "downloadUrl": download_url,
        "status":      "analysed",
        "healthy":     is_healthy,
        "confidence":  confidence,
        "createdAt":   int(ts.timestamp()),
    }
    
    try:
        table.put_item(Item=item)
    except Exception as e:
        print(f"DynamoDB Put failed: {e}")

    # 4. Resolve any pending frontend long-polling requests!
    result_data = {
        "scanId": scan_id,
        "healthy": is_healthy,
        "confidence": confidence,
        "downloadUrl": download_url,
        "timestamp": item["timestamp"],
        "label": label
    }
    for sid, req in list(pending_scans.items()):
        req["result"] = result_data
        req["event"].set()

    # 5. Publish MQTT result to AWS IoT Core (for history or extra listeners)
    try:
        mqtt_payload = json.dumps({"trigger": "esp32_result", **result_data})
        iot_data.publish(
            topic=f"mycotrack/{DEVICE_ID}/result",
            qos=1,
            payload=mqtt_payload
        )
    except Exception as e:
        print(f"IoT Publish failed: {e}")

    return {"status": "success", "scanId": scan_id, "healthy": is_healthy}