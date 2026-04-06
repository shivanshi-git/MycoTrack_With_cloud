# realtime_mushroom.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.models as tv_models
import torchvision.transforms as transforms
from PIL import Image
import io

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

def get_classifier():
    # Match whatever ARCH you trained — resnet50 or resnet18
    model = tv_models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = torch.nn.Sequential(
        torch.nn.Dropout(0.4),
        torch.nn.Linear(in_features, 512),
        torch.nn.ReLU(inplace=True),
        torch.nn.Dropout(0.3),
        torch.nn.Linear(512, 2),
    )
    state = torch.load("mushroom_cls.pth", map_location=DEVICE)
    model.load_state_dict(state)
    model.eval()
    return model.to(DEVICE)

model = get_classifier()

tf = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    tensor = tf(img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        out = model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred = out.argmax(1).item()
    confidence = round(probs[pred].item() * 100, 1)
    return {
        "healthy": pred == 0,       # 0 = Healthy, 1 = Unhealthy
        "confidence": confidence
    }