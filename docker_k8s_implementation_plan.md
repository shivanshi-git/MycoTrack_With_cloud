MycoTrack Docker and Kubernetes Implementation Plan

ARCHITECTURE OVERVIEW

Client / Browser / Mobile App
       │
       ▼
Nginx Ingress Controller (k8s/ingress.yaml)
       │
       ├── /api Path ──► FastAPI Backend Service (k8s/backend-deployment.yaml)
       └── /    Path ──► Expo Nginx Frontend Service (k8s/frontend-deployment.yaml)


IMPLEMENTATION STEPS AND DETAILS

1. Containerizing the FastAPI PyTorch Backend

Optimization Strategy:
Standard GPU PyTorch packages exceed 4GB in size. To optimize container build time and resource consumption, CPU-only PyTorch binaries are installed via PyTorch's official CPU wheel URL. This reduces the image size from ~4.5GB down to ~500MB.

Files Created:
- backend/Dockerfile: Uses python:3.10-slim base image, installs system tools like curl, installs CPU PyTorch and Python dependencies, sets healthcheck on /docs endpoint, and runs Uvicorn on port 8000.
- backend/.dockerignore: Excludes cache files, virtual environments, and local git histories to keep build context lightweight.


2. Containerizing the Expo Web Frontend

Optimization Strategy:
Building an Expo Web app requires Node dependencies. A multi-stage Docker build is used to keep the final image minimal:
- Stage 1 (Builder): Uses node:20-alpine to install dependencies and compile static web files into /app/dist.
- Stage 2 (Production): Uses lightweight nginx:alpine (~25MB) to serve only the compiled web bundle on port 80.

Files Created:
- Dockerfile.frontend: Multi-stage build definition for static export and Nginx hosting.
- .dockerignore: Excludes node_modules and temporary Expo build files.


3. Local Orchestration with Docker Compose

File Created:
- docker-compose.yml: Runs the frontend and backend services together locally.
  - Backend Service: Builds backend/Dockerfile, exposes port 8000, and sets AWS environment variables.
  - Frontend Service: Builds Dockerfile.frontend, exposes port 8080, and links to the backend.


4. Kubernetes Cluster Configuration

Files Created in k8s directory:
- k8s/backend-deployment.yaml: Runs 2 backend pod replicas for high availability, sets CPU and memory limits, defines a liveness probe on /docs, and exposes an internal service on port 8000.
- k8s/frontend-deployment.yaml: Runs 2 Nginx frontend pod replicas and exposes an internal service on port 80.
- k8s/ingress.yaml: Configures Nginx ingress routing for /api traffic to the backend and / traffic to the frontend.


COMMANDS REFERENCE GUIDE

1. Docker Image Building and Testing

Build Backend Image:
docker build -t my-app-backend -f backend/Dockerfile backend/

Run Backend Standalone:
docker run -d --name mycotrack-backend -p 8000:8000 my-app-backend

Build Frontend Image:
docker build -t my-app-frontend -f Dockerfile.frontend .

Run Frontend Standalone:
docker run -d --name mycotrack-frontend -p 8080:80 my-app-frontend


2. Docker Compose Commands

Build and launch services:
docker compose up --build -d

Check running containers:
docker ps

View container logs:
docker compose logs -f
docker logs -f mycotrack-backend
docker logs -f mycotrack-frontend

Stop containers:
docker compose down


3. Kubernetes Commands

Apply all manifests to cluster:
kubectl apply -f k8s/

Check status of pods and services:
kubectl get pods
kubectl get services
kubectl get ingress

View pod logs:
kubectl logs -l app=mycotrack-backend --tail=100 -f

Delete Kubernetes resources:
kubectl delete -f k8s/


VERIFICATION RESULTS

Container: mycotrack-frontend
Image: my-app-frontend
Port: 8080 -> 80
Status: Up

Container: mycotrack-backend
Image: my-app-backend
Port: 8000 -> 8000
Status: Up and Healthy

Access Points:
- FastAPI Backend Documentation: http://localhost:8000/docs
- Frontend Application: http://localhost:8080
