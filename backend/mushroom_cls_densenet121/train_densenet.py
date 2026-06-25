import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader

# Dataset paths
train_dir = "mycotrack_split/train"
val_dir = "mycotrack_split/val"

# Image transforms
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

# Load datasets
train_dataset = datasets.ImageFolder(train_dir, transform=transform)
val_dataset = datasets.ImageFolder(val_dir, transform=transform)

print("Training Images:", len(train_dataset))
print("Validation Images:", len(val_dataset))

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# DenseNet121
model = models.densenet121(weights="DEFAULT")

for param in model.parameters():
    param.requires_grad = True

num_features = model.classifier.in_features
model.classifier = nn.Linear(num_features, 2)

device = torch.device("cpu")
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(
    model.parameters(),
    lr=0.0001,
    weight_decay=1e-4
)

epochs = 50
best_val_acc = 0.0

print("\nStarting Training...\n")

for epoch in range(epochs):

    model.train()

    running_loss = 0
    correct = 0
    total = 0

    print(f"\nEpoch {epoch+1:02d}/{epochs}")

    for batch_idx, (images, labels) in enumerate(train_loader):

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        _, preds = torch.max(outputs, 1)

        total += labels.size(0)
        correct += (preds == labels).sum().item()

    train_acc = correct / total

    # Validation
    model.eval()

    val_correct = 0
    val_total = 0
    val_loss = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)

            loss = criterion(outputs, labels)

            val_loss += loss.item()

            _, preds = torch.max(outputs, 1)

            val_total += labels.size(0)
            val_correct += (preds == labels).sum().item()

    val_acc = val_correct / val_total

    print(
        f"train {running_loss/len(train_loader):.4f}/{train_acc:.4f}   "
        f"val {val_loss/len(val_loader):.4f}/{val_acc:.4f}"
    )

    # Save best model
    if val_acc > best_val_acc:

        best_val_acc = val_acc

        torch.save(
            model.state_dict(),
            "results/densenet121_best.pth"
        )

        print("⭐ Best model saved")

print("\nTraining Complete")
print(f"Best Validation Accuracy: {best_val_acc:.4f}")

# Final model save
torch.save(
    model.state_dict(),
    "results/densenet121_final.pth"
)

print("Final model saved successfully")