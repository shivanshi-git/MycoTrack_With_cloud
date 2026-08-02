# 📖 MycoTrack DevOps Architecture & File Explanation

## 1. 🐳 Docker Containerization Files

### 🔹 `backend/requirements.txt`
* **Why it was created:** Defines the Python packages needed for your AI model and FastAPI backend server inside the container.
* **What it contains & does:**
  * `fastapi`: The high-performance web framework hosting your REST API endpoints.
  * `uvicorn[standard]`: The ASGI web server that runs FastAPI.
  * `torch` & `torchvision`: PyTorch deep learning frameworks required to run your ResNet50 / YOLOv8 mushroom classification model (`mushroom_cls.pth`).
  * `pillow`: Image processing library used to open and resize mushroom photos sent by mobile/ESP32-CAM.
  * `boto3`: AWS SDK for Python to interact with AWS S3, DynamoDB, and IoT Core.
  * `python-multipart`: Enables processing image file uploads sent via HTTP POST requests.

---

### 🔹 `backend/Dockerfile`
* **Why it was created:** Packaging the Python FastAPI backend into a standalone, reproducible container image.
* **What it does line-by-line:**
  * `FROM python:3.10-slim`: Uses a lightweight Linux image with Python 3.10 pre-installed.
  * `RUN apt-get update && apt-get install -y curl`: Installs `curl` for container health checks.
  * `RUN pip install ... --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt`: Installs the **CPU-optimized version of PyTorch**, keeping the container image small (~500MB instead of 4GB+ for GPU PyTorch).
  * `COPY . .`: Copies `realtime_mushroom.py`, model file `mushroom_cls.pth`, and code into the container.
  * `EXPOSE 8000`: Informs Docker that FastAPI runs on port `8000`.
  * `HEALTHCHECK`: Periodically pings `http://localhost:8000/docs` to ensure the server is alive and healthy.
  * `CMD ["uvicorn", "realtime_mushroom:app", "--host", "0.0.0.0", "--port", "8000"]`: The startup command that launches your FastAPI server when the container starts.

---

### 🔹 `Dockerfile.frontend`
* **Why it was created:** Builds your Expo React Native application into a static web bundle and packages it inside an Nginx web server.
* **What it does (2-Stage Multi-Stage Build):**
  * **Stage 1 (Builder):** Uses `node:20-alpine`, runs `npm ci` to install dependencies, and runs `npx expo export --platform web` to compile your React code into HTML, JS, and CSS files in `dist/`.
  * **Stage 2 (Nginx Web Server):** Uses `nginx:alpine` and copies only the compiled web files from Stage 1 into Nginx (`/usr/share/nginx/html`).
  * **Why 2 Stages?** The node build environment (which is ~1GB) is discarded, leaving a tiny, secure Nginx container (~25MB) to serve your website on port `80`.

---

### 🔹 `docker-compose.yml`
* **Why it was created:** Lets you start **both** the frontend website and backend AI server together locally with a single command (`docker-compose up`).
* **What it does:**
  * Defines the `backend` service: Builds `backend/Dockerfile`, forwards port `8000`, and sets environment variables (`AWS_REGION`, `S3_BUCKET`, `DYNAMO_TABLE`).
  * Defines the `frontend` service: Builds `Dockerfile.frontend`, maps host port `8080` to Nginx port `80`, and sets `depends_on: [backend]` so the backend starts before the frontend.

---

### 🔹 `.dockerignore` & `backend/.dockerignore`
* **Why they were created:** Prevents heavy, temporary local folders (like `node_modules/`, `venv/`, `.git/`, `.expo/`) from being copied into Docker containers during `docker build`.
* **Benefit:** Speeds up Docker build times from minutes to seconds.

---

## 2. ☸️ Kubernetes (K8s) Manifest Files (`k8s/`)

Kubernetes takes the Docker containers created above and manages them in a cluster (handling auto-restart on crashes, auto-scaling, load balancing, and rolling updates).

### 🔹 `k8s/backend-deployment.yaml`
* **Why it was created:** Tells Kubernetes how to run and scale your FastAPI AI backend.
* **What it contains:**
  * **Deployment Specs:** Runs **2 identical replicas (pods)** of your backend container for high availability. If 1 pod crashes, Kubernetes automatically spins up a replacement without downtime.
  * **Resource Limits:** Restricts memory usage (Max 512MB RAM) and CPU (Max 0.5 cores) so containers don't crash your server.
  * **Liveness Probe:** Automatically restarts pods if FastAPI stops responding.
  * **Service (ClusterIP):** Creates a stable internal network IP address (`mycotrack-backend-service`) on port `8000` so other pods can send requests to the backend.

---

### 🔹 `k8s/frontend-deployment.yaml`
* **Why it was created:** Tells Kubernetes how to run and scale your Expo Nginx frontend.
* **What it contains:**
  * **Deployment Specs:** Runs **2 replicas** of the Nginx frontend container.
  * **Service (ClusterIP):** Creates an internal network service (`mycotrack-frontend-service`) on port `80`.

---

### 🔹 `k8s/ingress.yaml`
* **Why it was created:** Acts as the **smart router / API gateway** for your Kubernetes cluster.
* **What it does:**
  * Routes web traffic coming to `/api` -> `mycotrack-backend-service:8000` (FastAPI backend).
  * Routes web traffic coming to `/` -> `mycotrack-frontend-service:80` (Nginx frontend).
  * Enables a single public entrypoint (or domain) for the entire app.

---

## 💡 How Everything Works Together

```
[ Your Computer / Phone Browser ]
              │
              ▼
    [ Nginx Ingress Router ] (k8s/ingress.yaml)
         │               │
         │ (Path: /)     │ (Path: /api)
         ▼               ▼
[ Expo Nginx Frontend ] [ FastAPI PyTorch Backend ]
(Dockerfile.frontend)   (backend/Dockerfile)
```
