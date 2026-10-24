# LightGBM model scaffold - only used if labels suitable; do not force install
from typing import Dict, Any

class PatternLGBM:
    def __init__(self):
        self.model = None
        self.fitted = False

    def fit(self, X, y):
        # Placeholder - not trained by default; see docs
        self.fitted = False
        raise NotImplementedError("PatternLGBM.fit not implemented by default; use baseline or provide labels")

    def predict(self, X):
        raise NotImplementedError("Model not fitted")
