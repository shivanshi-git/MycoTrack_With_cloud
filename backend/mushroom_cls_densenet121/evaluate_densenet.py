import torch
import torch.nn as nn

from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)

# Test dataset
test_dir = "mycotrack_split/test"
val_dir = "mycotrack_split/val"

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

test_dataset = datasets.ImageFolder(
    test_dir,
    transform=transform
)

test_loader = DataLoader(
    test_dataset,
    batch_size=32,
    shuffle=False
)

val_dataset = datasets.ImageFolder(val_dir, transform=transform)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# DenseNet121
model = models.densenet121(weights=None)

num_features = model.classifier.in_features
model.classifier = nn.Linear(num_features, 2)

# Load BEST model
model.load_state_dict(
    torch.load("results/densenet121_30epochs.pth")
)


device = torch.device("cpu")
model = model.to(device)

model.eval()
def evaluate(loader):
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)

            outputs = model(images)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    accuracy = accuracy_score(all_labels, all_preds)

    return accuracy
val_accuracy = evaluate(val_loader)
print(f"\nValidation Accuracy: {val_accuracy:.4f}")

all_preds = []
all_labels = []
all_probs = []

with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(device)

        outputs = model(images)

        probs = torch.softmax(outputs, dim=1)

        _, preds = torch.max(outputs, 1)

        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())
        all_probs.extend(probs[:, 1].cpu().numpy())

# Metrics
accuracy = accuracy_score(
    all_labels,
    all_preds
)

precision = precision_score(
    all_labels,
    all_preds,
    average="weighted"
)

recall = recall_score(
    all_labels,
    all_preds,
    average="weighted"
)

f1 = f1_score(
    all_labels,
    all_preds,
    average="weighted"
)

auc = roc_auc_score(
    all_labels,
    all_probs
)

print("\n")
print("=" * 40)
print("MycoTrack - Test Set Metrics")
print("=" * 40)

print(f"Accuracy  : {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {auc:.4f}")

print("\n")

print(
    classification_report(
        all_labels,
        all_preds,
        target_names=[
            "Healthy",
            "Unhealthy"
        ]
    )
)

print("Confusion Matrix")
print(
    confusion_matrix(
        all_labels,
        all_preds
    )
)

print("\n" + "="*40)

print("Saved          : results/densenet121_30epochs.pth")
print("Architecture   : DenseNet121")
print(f"Val accuracy   : {val_accuracy:.4f}")
print(f"Test accuracy  : {accuracy:.4f}")
print(f"Test AUC       : {auc:.4f}")

print("="*40)