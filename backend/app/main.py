from fastapi import FastAPI, UploadFile, File
import os
import uuid
import cv2

from ultralytics import YOLO

from scripts.card_detection import CardDetectionPipeline
from scripts.helpers import load_models

app = FastAPI()

# Temporary upload directory, will use a proper storage solution later
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Temporary crop directory, will use properly stored crops later
CROP_DIR = "uploads/crops"
os.makedirs(CROP_DIR, exist_ok=True)

# Loading models and ocr
yolo, model, ocr = load_models()
pipeline_one = CardDetectionPipeline(yolo)

@app.post('/detect-card')
def detect_card(file: UploadFile = File(...)):
    """Receives an image and detects card in it"""

    # Save uploaded image
    ext = file.filename.split(".")[-1]
    image_id = str(uuid.uuid4())
    image_path = f"{UPLOAD_DIR}/{image_id}.{ext}"
    
    with open(image_path, "wb") as f:
        f.write(file.file.read())
        
    # Run detection pipeline
    results = pipeline_one.run(image_path)
    
    if results is None:
        return {
            "error": "No card detected"
        }
    
    # Save cropped card image
    crop_path = f"{CROP_DIR}/{image_id}_crop.jpg"
    cv2.imwrite(crop_path, results["card_crop"])
    
    return {
        "image_path": image_path,
        "crop_path": crop_path,
        "bbox": results["bbox"]
    }

@app.post('/upload-image')
def upload_image(file: UploadFile = File(...)):
    """Receives an image and saves it"""

    # Generate filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file to disk
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    return {
        "filename": filename,
        "path": filepath
    }


@app.get("/health-check")
def health_check():
    return {"status": "ok"}