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

def detect_card(yolo, image):
    """Using yolo, detect the card in the image and return the cropped card image."""
    # Yolo detection
    res = yolo(image)[0]
    
    # Loop through all boxes
    for box in res.boxes:
        # Get card mappings
        if yolo.names[int(box.cls[0])] == "hockey_card":
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # Return cropped card
            return image[y1:y2, x1:x2]

    return None