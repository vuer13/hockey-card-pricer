from fastapi import FastAPI, UploadFile, File
import os
import uuid
import cv2
from pydantic import BaseModel

from ultralytics import YOLO

from scripts.card_detection import CardDetectionPipeline
from scripts.text_detection import TextExtraction
from scripts.helpers import load_models

app = FastAPI()

# Temporary upload directory, will use a proper storage solution later
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Temporary crop directory, will use properly stored crops later
CROP_DIR = "uploads/crops"
os.makedirs(CROP_DIR, exist_ok=True)

# Loading models and ocr and pipelines
yolo, model, ocr = load_models()
pipeline_one = CardDetectionPipeline(yolo)
pipeline_two = TextExtraction(model, ocr)

# Request schema; to accept crop path for text extraction
# Since crop_path is returned in json from detect-card endpoint, we can use that directly here instead of URL
class CropRequest(BaseModel):
    crop_path: str
    
class ConfirmCardRequest(BaseModel):
    name: str
    card_series: str
    card_number: str
    image_path: str
    crop_path: str
    
@app.post("/confirm-card")
def confirm_card(req: ConfirmCardRequest):
    """Endpoint to confirm card details"""
    
    if not req.name or not req.card_series:
        return {"error": "Missing required fields"}
    
    confirmed_card = {
        "name": req.name.strip(),
        "card_series": req.card_series.strip(),
        "card_number": req.card_number.strip(),
        "image_path": req.image_path,
        "crop_path": req.crop_path
    }

    return {
        "status": "confirmed",
        "card": confirmed_card
    }


@app.post("/extract-text")
def extract_text(req: CropRequest):
    """Extracts text from a cropped card image"""
    
    crop_path = req.crop_path
    
    if not os.path.exists(crop_path):
        return {"error": "Cropped image path does not exist"}

    # Read cropped image
    card_crop = cv2.imread(crop_path)
    if card_crop is None:
        return {"error": "Could not read cropped image"}
    
    # Run text extraction pipeline
    fields = pipeline_two.run(card_crop)
    
    return {"fields": fields}

# Endpoint handles upload + detection
@app.post('/detect-card')
def detect_card(file: UploadFile = File(...)):
    """Receives an image and detects card in it"""

    # Save uploaded image
    ext = file.filename.split(".")[-1]
    image_id = str(uuid.uuid4())  # Generates identifier so uploaded files don't get overwritten
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
    
# Upload endpoint only; no cropping
@app.post('/upload-image')
def upload_image(file: UploadFile = File(...)):
    """Receives an image and saves it"""

    # Generate filename
    ext = file.filename.split(".")[-1]
    image_id = str(uuid.uuid4())
    image_path = os.path.join(UPLOAD_DIR, f"{image_id}.{ext}")

    # Save file to disk
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    return {
        "image_id": image_id,
        "image_path": image_path
    }

# To ensure API is working
@app.get("/health-check")
def health_check():
    return {"status": "ok"}