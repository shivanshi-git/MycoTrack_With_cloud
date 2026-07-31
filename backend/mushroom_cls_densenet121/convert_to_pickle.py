import torch
import torch.nn as nn
from torchvision import models
import pickle

# Create DenseNet121 architecture
model = models.densenet121(weights=None)

num_features = model.classifier.in_features
model.classifier = nn.Linear(num_features, 2)

# Load trained weights
model.load_state_dict(
    torch.load("results/densenet121_30epochs.pth")
)

model.eval()

# Save as pickle
with open("results/mushroom_cls_densenet121.pkl", "wb") as f:
    pickle.dump(model, f)

print("Pickle file created successfully!")