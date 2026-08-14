# 🎯 Model Accuracy Optimization Implementation Plan

A comprehensive plan to upgrade model architectures, training strategies, and data augmentation techniques to maximize validation accuracy and mAP metrics for the **MycoTrack AI System**.

---

## User Review Required

> [!IMPORTANT]
> **1. Model Architecture Upgrades**:
> We are upgrading the classification backbone from ResNet50 (`weights=None`) to **EfficientNetV2-S** (pre-trained on ImageNet) and upgrading the object detector from **YOLOv8n** to **YOLOv8m / YOLOv11s**.

> [!NOTE]
> **2. Training Resource Requirement**:
> Training EfficientNetV2-S and YOLOv8m takes ~15–25 epochs. CUDA GPU recommended for optimal training speed, though CPU execution is fully supported.

---

## Proposed Technical Changes

---

### Phase 1: Classification Architecture Upgrade

#### [NEW] [backend/train_improved_models.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/train_improved_models.py)
- Replace baseline ResNet50 with **EfficientNetV2-S** using `models.EfficientNet_V2_S_Weights.DEFAULT`.
- Implement **Label Smoothing Cross-Entropy Loss (`label_smoothing=0.1`)**.
- Configure **AdamW Optimizer** (`lr=1e-4`, `weight_decay=1e-2`) and **Cosine Annealing LR Scheduler** down to `1e-6`.
- Apply enhanced color & spatial data augmentations (`ColorJitter`, `RandomRotation(25°)`, `RandomHorizontalFlip`, `RandomVerticalFlip`).

---

### Phase 2: Object Detection Upgrade (YOLOv8m / YOLOv11s)

#### [MODIFY] [backend/yolov8_mushroom_pipeline.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/yolov8_mushroom_pipeline.py)
- Change `MODEL_SIZE` from `yolov8n.pt` to `yolov8m.pt` (or `yolo11s.pt`).
- Update image resolution to `IMG_SIZE = 640` with Mosaic & MixUp augmentation.
- Enable automatic generation of custom confusion matrix and precision-recall metrics.

---

### Phase 3: Real-Time Backend Model Integration

#### [MODIFY] [backend/realtime_mushroom.py](file:///home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/realtime_mushroom.py)
- Update classifier loading function to load `efficientnet_v2_best.pth` with EfficientNetV2-S architecture.
- Update YOLO object detector path to load `yolov8m.pt`.
- Enable batch crop inference for fast multi-mushroom classification per frame.

---

## Verification Plan

### Automated Tests
- Train EfficientNetV2-S model and verify top validation accuracy:
```bash
python3 backend/train_improved_models.py
```
- Compile check backend service:
```bash
python3 -m py_compile backend/realtime_mushroom.py
```

### Manual Verification
1. Verify validation accuracy improvements on `mycotrack_split/val` (target: **>92% Validation Accuracy**).
2. Test bounding box detection accuracy on dense mushroom images (target: **mAP@50 > 0.88**).
3. Benchmark inference latency on `/predict` endpoint.
