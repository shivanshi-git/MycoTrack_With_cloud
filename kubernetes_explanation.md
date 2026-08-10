MycoTrack Kubernetes and Container Orchestration Explanation


1. CORE CONCEPT CLARIFICATION

What is an Image versus a Container?

Image (The Blueprint / Recipe):
An image is a static file containing the application code, runtime libraries, and environment settings.
In MycoTrack, we have 2 Docker Images:
- my-app-frontend: Created from Dockerfile.frontend
- my-app-backend: Created from backend/Dockerfile

Container (The Running Instance):
A container is the active, running process created from an image.
You do NOT have just 1 container. You have AT LEAST 2 active containers running at the same time:
- 1 Frontend Container: Serves the web interface on port 8080.
- 1 Backend Container: Runs the FastAPI PyTorch AI engine on port 8000.

In Production Kubernetes, you run 4 or more containers (Pods) simultaneously:
- 2 Backend Container Replicas
- 2 Frontend Container Replicas


2. WHY DO WE NEED CONTAINER ORCHESTRATION?

1. Single-Command Multi-Container Launch
Without orchestration, starting your app requires running multiple complex commands to build and link containers. Docker Compose lets you launch your entire application stack using one simple command: docker compose up.

2. Container Inter-Communication
Docker containers run in isolated networks by default. Orchestration creates an internal virtual network so the frontend container can talk directly to the backend container using service names (mycotrack-backend-service) instead of changing IP addresses.

3. High Availability and Self-Healing
If the AI backend container crashes due to high memory usage while analyzing an image:
- Without Kubernetes: The entire website crashes until someone manually restarts the server.
- With Kubernetes: Kubernetes detects the crash in seconds, routes user traffic to a second active backend container, and automatically restarts the crashed container without user downtime.

4. Dynamic Auto-Scaling
If hundreds of ESP32-CAM devices send mushroom photos simultaneously, a single backend container will freeze. Kubernetes automatically monitors CPU and RAM usage and scales your backend from 2 containers to 10 or 20 containers across multiple cloud servers.

5. Zero-Downtime Updates
When deploying a new AI model or web update, Kubernetes replaces containers one by one. It keeps old containers active until new ones pass health checks, ensuring 0 seconds of app downtime.


3. FEATURE COMPARISON TABLE

Feature                          | Single Container Run | Docker Compose | Kubernetes (K8s)
---------------------------------|----------------------|----------------|------------------
Target Environment               | Single Machine       | Local Testing  | Cloud Production
Number of Running Containers     | 1 at a time          | Multiple local | Hundreds across cloud
Launch Command                   | Manual docker run    | docker compose | kubectl apply -f k8s/
Container Networking             | Manual setup         | Automatic      | Advanced Service DNS
Automatic Self-Healing           | No                   | Basic restart  | Probes & auto-restart
Auto-Scaling under Traffic       | No                   | No             | Yes (Dynamic pod scaling)
Zero-Downtime Code Upgrades      | No                   | No             | Yes (Rolling updates)


4. KUBERNETES COMPONENT ARCHITECTURE IN MYCOTRACK

System Traffic Flow:

User / Web Browser / ESP32-CAM Camera
                 │
                 ▼
    Nginx Ingress Controller (k8s/ingress.yaml)
                 │
                 ├── Path /api ──► Backend Service (Port 8000) ──► Load Balances (Backend Pod 1 & Backend Pod 2)
                 └── Path /    ──► Frontend Service (Port 80)   ──► Load Balances (Frontend Pod 1 & Frontend Pod 2)


Manifest Files Breakdown:

1. k8s/backend-deployment.yaml
- Deployment: Maintains 2 replica pods of the FastAPI PyTorch container.
- Resource Limits: Restricts memory to 512MB RAM and CPU to 0.5 cores per pod.
- Liveness Probe: Automatically checks http://localhost:8000/docs every 20 seconds.
- Service: Exposes internal ClusterIP on port 8000 (mycotrack-backend-service).

2. k8s/frontend-deployment.yaml
- Deployment: Maintains 2 replica pods of the Nginx Expo web container.
- Resource Limits: Restricts memory to 128MB RAM and CPU to 0.25 cores per pod.
- Service: Exposes internal ClusterIP on port 80 (mycotrack-frontend-service).

3. k8s/ingress.yaml
- Acts as the smart API Gateway and public entrypoint.
- Routes path /api to the backend AI service.
- Routes path / to the frontend web service.
