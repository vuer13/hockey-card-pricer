import cv2
import numpy as np
from ultralytics import YOLO
import torch
import easyocr
import torchvision.transforms as T
from torchvision.models.detection import fasterrcnn_resnet50_fpn

def load_models():
    # Error handling for model loading
    try:
        yolo = YOLO("./models/final_model.pt")
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None
    
    try:
        frcnn = fasterrcnn_resnet50_fpn(num_classes=6)
        checkpoint = torch.load("./models/best_model.pth", map_location="cpu")
        frcnn.load_state_dict(checkpoint["model_state_dict"])
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None
    
    frcnn.eval() # Set to eval mode for inference
    
    # PaddleOCR model loading to extract text
    reader = easyocr.Reader(['en'], gpu=False)
    
    return yolo, frcnn, reader

def detect_card(yolo, image):
    """Using yolo, detect the card in the image and return the cropped card image."""
    
    # Error handling for model loading
    if yolo is None:
        return None
    
    # Yolo detection
    res = yolo(image)[0]
    print("Detected classes:", [int(box.cls[0]) for box in res.boxes])
    print("Class names:", yolo.names)
    
    # Loop through all boxes
    for box in res.boxes:
        # Get card mappings
        if yolo.names[int(box.cls[0])] == "hockey_card":
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = image[y1:y2, x1:x2]

            # Return bounding box and cropped card image
            return {
                "bbox": [x1, y1, x2, y2],
                "card_crop": crop
            }

    return None

def detect_boxes(fastrcnn, card):
    """Using Faster R-CNN, detect boxes in the card image and return predictions."""
    
    if fastrcnn is None:
        return []
    
    fastrcnn.eval()  # Ensure model is in eval mode
    
    LABEL_NAMES = {
        1: "name",
        2: "card_number",
        3: "card_series",
        4: "team_name",
        5: "card_type"
    }
    
    transform = T.ToTensor()
    preds = fastrcnn([transform(card)])[0]
    
    detected_boxes = []
    
    for box, score, label in zip(preds["boxes"], preds["scores"], preds["labels"]):
        # Only take scores above 0.85
        if score > 0.85: 
            detected_boxes.append({
                "bbox": tuple(map(int, box.tolist())), # Convert box to int tuple
                "field": LABEL_NAMES[int(label)] # Map label to field name
            })

    return detected_boxes

def deskew(image):
    """To correct tilt/angle in the image"""
    
    # Converts image to gray scale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Get all non-gray pixels, return as (x,y) coordinates
    coords = np.column_stack(np.where(gray > 0))
    
    if len(coords) < 10:
        return image  # Not enough points to compute angle
    
    # Minimum rectangle area, angle telling text orientation
    angle = cv2.minAreaRect(coords)[-1]
    
    if angle < -45:
        angle += 90
        
    h, w = image.shape[:2]

    # Rotation matrix centered at the image center
    M = cv2.getRotationMatrix2D(
        (w // 2, h // 2),  # center of rotation
        angle,            # rotation angle
        1                 # no scaling
    )

    # Rotate the image to straighten the text
    return cv2.warpAffine(image, M, (w, h))

def easy_ocr(reader, image):
    result = reader.readtext(image, detail=0)
    return " ".join(result)