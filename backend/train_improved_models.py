"""
Mushroom Health & Detection Improvement Training Script
======================================================
Supports:
  1. EfficientNetV2-S & ConvNeXt-Tiny ImageNet Transfer Learning
  2. Cosine Annealing Learning Rate Scheduler
  3. Advanced Augmentation (Color Jitter, Random Auto-Augment, Flips)
  4. Label Smoothing Cross-Entropy Loss
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import time

# Configuration
DATASET_DIR = "/home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/dataset/MycoTrack/mycotrack_split"
MODEL_SAVE_PATH = "/home/altos/.gemini/antigravity-ide/scratch/MycoTrack_With_cloud/backend/efficientnet_v2_best.pth"
BATCH_SIZE = 16
EPOCHS = 25
LR = 1e-4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def get_train_val_loaders():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degree=25),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(os.path.join(DATASET_DIR, "train"), transform=train_transform)
    val_dataset = datasets.ImageFolder(os.path.join(DATASET_DIR, "val"), transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    return train_loader, val_loader

def build_efficientnet_model():
    # Use ImageNet pretrained weights for transfer learning
    model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
    
    # Replace classifier head with Dropout + Linear
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.SiLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, 2)
    )
    return model.to(DEVICE)

def build_convnext_model():
    model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
    in_features = model.classifier[2].in_features
    model.classifier[2] = nn.Linear(in_features, 2)
    return model.to(DEVICE)

def train_model():
    print(f"Using device: {DEVICE}")
    train_loader, val_loader = get_train_val_loaders()
    model = build_efficientnet_model()

    # Loss function with Label Smoothing (reduces overconfidence)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-2)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

    best_val_acc = 0.0

    print("\n🚀 Starting Training...")
    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0

        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * imgs.size(0)
            preds = outputs.argmax(dim=1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)

        scheduler.step()

        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                outputs = model(imgs)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * imgs.size(0)
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_train_acc = (train_correct / train_total) * 100
        epoch_val_acc = (val_correct / val_total) * 100
        elapsed = time.time() - t0

        print(f"Epoch {epoch:02d}/{EPOCHS:02d} | Train Acc: {epoch_train_acc:.2f}% | Val Acc: {epoch_val_acc:.2f}% | Time: {elapsed:.1f}s")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"  ⭐ Saved new best model to {MODEL_SAVE_PATH} (Val Acc: {best_val_acc:.2f}%)")

    print(f"\n✅ Training Complete! Best Validation Accuracy: {best_val_acc:.2f}%")

if __name__ == "__main__":
    train_model()
