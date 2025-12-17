import cv2
import numpy as np
from ultralytics import YOLO
import torch
from paddleocr import PaddleOCR
import torchvision.transforms as T

def load_models():
    try:
        yolo = YOLO("./models/final_model.pt")
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None
    
    try:
        frcnn = torch.load("./models/best_model.pth", map_location="cpu")
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None
    
    frcnn.eval() # Set to eval mode for inference
    
    # PaddleOCR model loading to extract text
    ocr = PaddleOCR(use_angle_cls=True, lang="en")
    
    return yolo, frcnn, ocr