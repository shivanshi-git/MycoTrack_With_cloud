"""
YOLOv8 Mushroom Object Detection Pipeline
==========================================
Handles:
  - Dataset folder structuring (train/val/test split)
  - YOLOv8 training
  - Performance metrics (mAP50, mAP50-95, Precision, Recall, F1)
  - Confusion matrix
  - Sample prediction visualization

Requirements:
    pip install ultralytics opencv-python matplotlib seaborn scikit-learn PyYAML

Folder structure expected BEFORE running:
    mushroom dataset/
        images/   <-- all your ~5100 images (.jpg/.png)
        labels/   <-- all your ~3300 YOLO-format .txt label files

Usage:
    python yolov8_mushroom_pipeline.py
"""

import os
import shutil
import random
import yaml
import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns
from pathlib import Path
from sklearn.metrics import confusion_matrix
from ultralytics import YOLO

# ─────────────────────────────────────────────
# CONFIG — adjust these as needed
# ─────────────────────────────────────────────
SOURCE_DIR       = "mushroom dataset"      # your root folder
OUTPUT_DIR       = "mushroom_yolo"         # structured output folder
MODEL_SIZE       = "yolov8n.pt"            # n/s/m/l/x (n=fastest, x=most accurate)
EPOCHS           = 50
IMG_SIZE         = 640
BATCH_SIZE       = 16
TRAIN_RATIO      = 0.70
VAL_RATIO        = 0.20
TEST_RATIO       = 0.10
SEED             = 42
CLASS_NAMES      = None   # Set to list like ["Amanita","Boletus"] or leave None to auto-detect

random.seed(SEED)


# ═══════════════════════════════════════════════
# STEP 1: Build YOLOv8 folder structure
# ═══════════════════════════════════════════════
def build_dataset_structure():
    print("\n" + "="*60)
    print("STEP 1: Building YOLOv8 Dataset Structure")
    print("="*60)

    src_images = Path(SOURCE_DIR) / "images"
    src_labels = Path(SOURCE_DIR) / "labels"

    assert src_images.exists(), f"Images folder not found: {src_images}"
    assert src_labels.exists(), f"Labels folder not found: {src_labels}"

    # Collect paired image-label files
    img_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    all_images = [f for f in src_images.iterdir() if f.suffix.lower() in img_extensions]

    paired, unpaired = [], []
    for img in all_images:
        label = src_labels / (img.stem + ".txt")
        if label.exists():
            paired.append((img, label))
        else:
            unpaired.append(img)

    print(f"  Total images found  : {len(all_images)}")
    print(f"  Paired (img+label)  : {len(paired)}")
    print(f"  Images without label: {len(unpaired)} (skipped)")

    # Shuffle and split
    random.shuffle(paired)
    n = len(paired)
    n_train = int(n * TRAIN_RATIO)
    n_val   = int(n * VAL_RATIO)
    splits = {
        "train": paired[:n_train],
        "val"  : paired[n_train:n_train + n_val],
        "test" : paired[n_train + n_val:]
    }

    # Create folders and copy files
    out = Path(OUTPUT_DIR)
    for split, items in splits.items():
        for sub in ["images", "labels"]:
            (out / split / sub).mkdir(parents=True, exist_ok=True)
        for img_path, lbl_path in items:
            shutil.copy2(img_path, out / split / "images" / img_path.name)
            shutil.copy2(lbl_path, out / split / "labels" / lbl_path.name)
        print(f"  {split:>5} split → {len(items)} samples")

    # Auto-detect class names from label files if not set
    global CLASS_NAMES
    if CLASS_NAMES is None:
        class_ids = set()
        for img_path, lbl_path in paired[:500]:  # sample first 500 for speed
            with open(lbl_path) as f:
                for line in f:
                    parts = line.strip().split()
                    if parts:
                        class_ids.add(int(parts[0]))
        CLASS_NAMES = [f"class_{i}" for i in sorted(class_ids)]
        print(f"\n  Auto-detected {len(CLASS_NAMES)} classes: {CLASS_NAMES}")
    
    # Write dataset YAML
    yaml_data = {
        "path"  : str(out.resolve()),
        "train" : "train/images",
        "val"   : "val/images",
        "test"  : "test/images",
        "nc"    : len(CLASS_NAMES),
        "names" : CLASS_NAMES
    }
    yaml_path = out / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(yaml_data, f, default_flow_style=False)

    print(f"\n  Dataset YAML saved → {yaml_path}")
    return str(yaml_path), splits


# ═══════════════════════════════════════════════
# STEP 2: Train YOLOv8
# ═══════════════════════════════════════════════
def train_model(yaml_path):
    print("\n" + "="*60)
    print("STEP 2: Training YOLOv8 Model")
    print("="*60)
    print(f"  Model     : {MODEL_SIZE}")
    print(f"  Epochs    : {EPOCHS}")
    print(f"  Image size: {IMG_SIZE}")
    print(f"  Batch size: {BATCH_SIZE}\n")

    model = YOLO(MODEL_SIZE)
    results = model.train(
        data     = yaml_path,
        epochs   = EPOCHS,
        imgsz    = IMG_SIZE,
        batch    = BATCH_SIZE,
        project  = OUTPUT_DIR,
        name     = "train_run",
        exist_ok = True,
        verbose  = True,
        plots    = True,   # saves training curves automatically
    )
    print("\n  Training complete!")
    return model, results


# ═══════════════════════════════════════════════
# STEP 3: Evaluate on validation set
# ═══════════════════════════════════════════════
def evaluate_model(model, yaml_path):
    print("\n" + "="*60)
    print("STEP 3: Evaluating Model — Performance Metrics")
    print("="*60)

    metrics = model.val(data=yaml_path, split="val", plots=True)

    print("\n  ┌─────────────────────────────────────────┐")
    print("  │         PERFORMANCE METRICS              │")
    print("  ├─────────────────────────────────────────┤")
    print(f"  │  mAP@50          : {metrics.box.map50:.4f}              │")
    print(f"  │  mAP@50-95       : {metrics.box.map:.4f}              │")
    print(f"  │  Precision       : {metrics.box.mp:.4f}              │")
    print(f"  │  Recall          : {metrics.box.mr:.4f}              │")
    f1 = 2 * metrics.box.mp * metrics.box.mr / (metrics.box.mp + metrics.box.mr + 1e-9)
    print(f"  │  F1-Score        : {f1:.4f}              │")
    print("  └─────────────────────────────────────────┘")

    # Save metrics to text file
    metrics_path = Path(OUTPUT_DIR) / "performance_metrics.txt"
    with open(metrics_path, "w") as f:
        f.write("YOLOv8 Mushroom Detection — Performance Metrics\n")
        f.write("="*50 + "\n")
        f.write(f"mAP@50       : {metrics.box.map50:.4f}\n")
        f.write(f"mAP@50-95    : {metrics.box.map:.4f}\n")
        f.write(f"Precision    : {metrics.box.mp:.4f}\n")
        f.write(f"Recall       : {metrics.box.mr:.4f}\n")
        f.write(f"F1-Score     : {f1:.4f}\n")

    print(f"\n  Metrics saved → {metrics_path}")
    return metrics


# ═══════════════════════════════════════════════
# STEP 4: Confusion Matrix
# ═══════════════════════════════════════════════
def plot_confusion_matrix(model, splits):
    print("\n" + "="*60)
    print("STEP 4: Generating Confusion Matrix")
    print("="*60)

    test_img_dir = Path(OUTPUT_DIR) / "test" / "images"
    test_lbl_dir = Path(OUTPUT_DIR) / "test" / "labels"

    y_true, y_pred = [], []

    for img_file in list(test_img_dir.iterdir())[:200]:  # use up to 200 test images
        lbl_file = test_lbl_dir / (img_file.stem + ".txt")
        if not lbl_file.exists():
            continue

        # Ground truth classes
        with open(lbl_file) as f:
            gt_classes = [int(line.split()[0]) for line in f if line.strip()]

        # Predictions
        result = model(str(img_file), verbose=False)[0]
        pred_classes = [int(c) for c in result.boxes.cls.cpu().numpy()] if result.boxes else []

        # Align for confusion matrix (use most frequent class per image)
        if gt_classes:
            y_true.append(max(set(gt_classes), key=gt_classes.count))
        if pred_classes:
            y_pred.append(max(set(pred_classes), key=pred_classes.count))
        elif gt_classes:
            y_pred.append(-1)  # missed detection

    # Filter valid pairs
    valid = [(t, p) for t, p in zip(y_true, y_pred) if p != -1]
    if not valid:
        print("  Not enough predictions for confusion matrix. Skipping.")
        return

    yt, yp = zip(*valid)
    labels = sorted(set(yt) | set(yp))
    label_names = [CLASS_NAMES[i] if i < len(CLASS_NAMES) else str(i) for i in labels]

    cm = confusion_matrix(yt, yp, labels=labels)
    cm_norm = cm.astype(float) / (cm.sum(axis=1, keepdims=True) + 1e-9)

    fig, axes = plt.subplots(1, 2, figsize=(18, 7))
    fig.suptitle("YOLOv8 Mushroom Detection — Confusion Matrix", fontsize=14, fontweight="bold")

    # Raw counts
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=label_names, yticklabels=label_names, ax=axes[0])
    axes[0].set_title("Raw Counts")
    axes[0].set_xlabel("Predicted")
    axes[0].set_ylabel("True")

    # Normalized
    sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="Greens",
                xticklabels=label_names, yticklabels=label_names, ax=axes[1])
    axes[1].set_title("Normalized (Recall per class)")
    axes[1].set_xlabel("Predicted")
    axes[1].set_ylabel("True")

    plt.tight_layout()
    cm_path = Path(OUTPUT_DIR) / "confusion_matrix_custom.png"
    plt.savefig(cm_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Confusion matrix saved → {cm_path}")


# ═══════════════════════════════════════════════
# STEP 5: Sample Prediction Images
# ═══════════════════════════════════════════════
def visualize_predictions(model, n_samples=9):
    print("\n" + "="*60)
    print("STEP 5: Generating Sample Prediction Images")
    print("="*60)

    test_img_dir = Path(OUTPUT_DIR) / "test" / "images"
    all_test_imgs = list(test_img_dir.iterdir())
    random.shuffle(all_test_imgs)
    samples = all_test_imgs[:n_samples]

    cols = 3
    rows = (n_samples + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(18, 6 * rows))
    fig.suptitle("YOLOv8 Mushroom Detection — Sample Predictions", fontsize=16, fontweight="bold")
    axes = axes.flatten()

    colors = plt.cm.get_cmap("tab10", len(CLASS_NAMES))

    for idx, img_path in enumerate(samples):
        result = model(str(img_path), verbose=False)[0]
        img_bgr = cv2.imread(str(img_path))
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        ax = axes[idx]
        ax.imshow(img_rgb)

        if result.boxes:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                conf   = float(box.conf[0].cpu().numpy())
                label  = f"{CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else cls_id} {conf:.2f}"
                color  = colors(cls_id)

                rect = patches.Rectangle((x1, y1), x2-x1, y2-y1,
                                          linewidth=2, edgecolor=color, facecolor="none")
                ax.add_patch(rect)
                ax.text(x1, y1 - 4, label, fontsize=8, color="white",
                        bbox=dict(facecolor=color, alpha=0.75, pad=1, edgecolor="none"))

        ax.set_title(img_path.name, fontsize=8)
        ax.axis("off")

    # Hide empty subplots
    for j in range(len(samples), len(axes)):
        axes[j].axis("off")

    plt.tight_layout()
    pred_path = Path(OUTPUT_DIR) / "sample_predictions.png"
    plt.savefig(pred_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Sample predictions saved → {pred_path}")


# ═══════════════════════════════════════════════
# STEP 6: Plot Training Curves
# ═══════════════════════════════════════════════
def plot_training_curves():
    results_csv = Path(OUTPUT_DIR) / "train_run" / "results.csv"
    if not results_csv.exists():
        print("  results.csv not found, skipping training curves.")
        return

    import pandas as pd
    df = pd.read_csv(results_csv)
    df.columns = df.columns.str.strip()

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("YOLOv8 Training Curves — Mushroom Detection", fontsize=14, fontweight="bold")

    metrics_to_plot = [
        ("train/box_loss", "Train Box Loss", "blue"),
        ("train/cls_loss", "Train Class Loss", "orange"),
        ("metrics/precision(B)", "Precision", "green"),
        ("metrics/recall(B)", "Recall", "red"),
        ("metrics/mAP50(B)", "mAP@50", "purple"),
        ("metrics/mAP50-95(B)", "mAP@50-95", "brown"),
    ]

    for ax, (col, title, color) in zip(axes.flatten(), metrics_to_plot):
        if col in df.columns:
            ax.plot(df["epoch"], df[col], color=color, linewidth=2)
            ax.set_title(title)
            ax.set_xlabel("Epoch")
            ax.grid(True, alpha=0.3)
        else:
            ax.set_title(f"{title} (not found)")
            ax.axis("off")

    plt.tight_layout()
    curves_path = Path(OUTPUT_DIR) / "training_curves.png"
    plt.savefig(curves_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Training curves saved → {curves_path}")


# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    print("\n🍄  YOLOv8 MUSHROOM DETECTION PIPELINE  🍄")
    print("="*60)

    # Step 1: Structure dataset
    yaml_path, splits = build_dataset_structure()

    # Step 2: Train
    model, train_results = train_model(yaml_path)

    # Step 3: Evaluate
    metrics = evaluate_model(model, yaml_path)

    # Step 4: Confusion Matrix
    plot_confusion_matrix(model, splits)

    # Step 5: Sample Predictions
    visualize_predictions(model, n_samples=9)

    # Step 6: Training Curves
    plot_training_curves()

    print("\n" + "="*60)
    print("✅  ALL DONE! Check the output folder:", OUTPUT_DIR)
    print("="*60)
    print(f"""
Output Files:
  📁 {OUTPUT_DIR}/
  ├── dataset.yaml                  ← YOLOv8 dataset config
  ├── train/val/test/               ← Structured dataset splits
  ├── train_run/weights/best.pt     ← Best trained model
  ├── train_run/results.csv         ← Per-epoch metrics
  ├── train_run/confusion_matrix.png
  ├── confusion_matrix_custom.png   ← Custom confusion matrix
  ├── sample_predictions.png        ← Visual predictions
  ├── training_curves.png           ← Loss & metric curves
  └── performance_metrics.txt       ← mAP, P, R, F1 summary
""")
