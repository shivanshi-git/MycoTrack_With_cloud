# MycoTrack — Complete Firebase → AWS Migration Guide

## What Replaces What

| Firebase Service       | AWS Service          | File                  |
|------------------------|----------------------|-----------------------|
| Firebase Auth          | AWS Cognito          | `aws/authService.js`  |
| Firestore / RTDB       | DynamoDB             | `aws/dbService.js`    |
| Firebase Storage       | S3                   | `pi_capture_aws.py`   |
| RTDB real-time updates | IoT Core MQTT        | `aws/dbService.js`    |
| Firebase Hosting       | EC2 (FastAPI)        | your backend          |

---

## Step 1 — Install packages

```bash
# React Native app
npm install aws-amplify @aws-amplify/auth \
            @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb \
            @aws-sdk/client-iot-data-plane mqtt

# Raspberry Pi
pip install boto3 awsiotsdk opencv-python-headless Pillow schedule
```

---

## Step 2 — AWS Console Setup

### A. Cognito (Auth)
1. AWS Console → Cognito → Create User Pool
2. Sign-in: Email
3. App client → no secret (for React Native)
4. Copy **User Pool ID** + **App Client ID** → paste in `aws/awsConfig.js`



### B. DynamoDB (Database)
Create 3 tables:

```
MycoTrack_Scans
  Partition key: userId  (String)
  Sort key:      createdAt (Number)

MycoTrack_Alerts
  Partition key: houseId  (String)
  Sort key:      alertId  (String)

MycoTrack_Sensors
  Partition key: houseId  (String)
  Sort key:      timestamp (Number)
```

### C. S3 (Image Storage)
1. Create bucket: `mycotrack-images`
2. Block public access → OFF (or use pre-signed URLs)
3. Add CORS policy:
```json
[{ "AllowedHeaders": ["*"], "AllowedMethods": ["GET","PUT","POST"],
   "AllowedOrigins": ["*"], "MaxAgeSeconds": 3000 }]
```

### D. IoT Core (Real-time)
1. AWS Console → IoT Core → Settings → copy **Endpoint**
2. IoT Core → Manage → Things → Create Thing → `pi-cam-001`
3. Create certificate → download 3 files into Pi: `certs/` folder
4. Attach policy (allow publish + subscribe on `mycotrack/*`)

### E. EC2 (FastAPI backend)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Upload and run your FastAPI server
scp realtime_mushroom.py mushroom_cls.pth ubuntu@your-ec2-ip:~/
pip install fastapi uvicorn torch torchvision pillow
uvicorn realtime_mushroom:app --host 0.0.0.0 --port 8000

# Open port 8000 in EC2 Security Group
```
Then update `BACKEND_URL` in `aws/awsConfig.js` to your EC2 public IP.

---

## Step 3 — IAM Permissions

Create one IAM policy for your app user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::mycotrack-images/*"
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem"],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/MycoTrack_Scans",
        "arn:aws:dynamodb:us-east-1:*:table/MycoTrack_Alerts",
        "arn:aws:dynamodb:us-east-1:*:table/MycoTrack_Sensors"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Publish", "iot:Subscribe", "iot:Connect", "iot:Receive"],
      "Resource": "arn:aws:iot:us-east-1:*:*"
    }
  ]
}
```

For the Pi — attach the same policy to the IoT certificate.

---

## Step 4 — File Changes in Your App

### Remove all Firebase imports
```bash
# Find all Firebase references
grep -r "firebase" app/ --include="*.js" -l
```

### Update imports in each file:
```js
// BEFORE
import { db } from "../../firebase/firebaseConfig";
import { ref, onValue, set, update } from "firebase/database";
import { loginUser } from "../../firebase/authService";

// AFTER
import { setActuator, getAlerts } from "../../aws/dbService";
import { loginUser } from "../../aws/authService";
```

### Initialize AWS in your app entry point (`app/_layout.js`):
```js
import { initAWS } from "../aws/awsConfig";
initAWS(); // call once at startup
```

### Delete Firebase packages:
```bash
npm uninstall firebase @react-native-firebase/app
```

---

## Step 5 — Pi Setup

```bash
mkdir ~/mycotrack-aws && cd ~/mycotrack-aws
mkdir certs

# Put your IoT certificates in certs/
# certificate.pem.crt
# private.pem.key
# AmazonRootCA1.pem  (download from AWS)

# Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, us-east-1, json

# Run
python pi_capture_aws.py
```

---

## Your New Architecture

```
YOUR PHONE (Expo Go / Production APK)
     │
     ├──► AWS Cognito          (login / signup / forgot password)
     ├──► EC2 :8000/predict    (mushroom AI — ResNet-50 / YOLOv8)
     ├──► DynamoDB             (scan history, alerts, sensor data)
     └──► IoT Core MQTT        (real-time actuator control, Pi trigger)

RASPBERRY PI
     ├──► AWS IoT Core         (receives manual trigger from app)
     ├──► S3                   (uploads captured images)
     └──► DynamoDB             (writes scan metadata)

ESP32 / SENSORS
     └──► IoT Core MQTT        (publishes temperature, humidity, CO2)
```
