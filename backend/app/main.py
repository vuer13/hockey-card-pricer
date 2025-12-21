from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import os
import uuid
import cv2

from scripts.card_detection import CardDetectionPipeline
from scripts.text_detection import TextExtraction
from scripts.pricing import price_card
from scripts.helpers import load_models

app = FastAPI()

# TODO: Use AWS Storage instead of local; host models on S3

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
    
class PriceCardRequest(BaseModel):
    name: str
    card_series: str
    card_number: str
    
# Response Helpers
def ok(data):
    return {"status": "ok", "data": data, "error": None}

def err(code, message):
    return {
        "status": "error",
        "data": None,
        "error": {"code": code, "message": message}
    }
    
@app.post("/confirm-card")
def confirm_card(req: ConfirmCardRequest):
    """Endpoint to confirm card details"""
    
    if not req.name or not req.card_series:
        return err("INVALID_INPUT", "Missing required fields")

    return ok({
        "confirmed": True,
        "card": req.dict()
    })


@app.post("/extract-text")
def extract_text(req: CropRequest):
    """Extracts text from a cropped card image"""
    
    crop_path = req.crop_path
    
    if not os.path.exists(crop_path):
        return err("INVALID_INPUT", "Crop path does not exist")

    # Read cropped image
    card_crop = cv2.imread(crop_path)
    
    if card_crop is None:
        return err("INVALID_IMAGE", "Unable to read image")
    
    # Run text extraction pipeline
    fields = pipeline_two.run(card_crop)
    if not fields:
        return err("OCR_FAILED", "Unable to extract text")
    
    return ok(fields)

@app.post('/manual-detect-extract')
def manual_detect_extract(file: UploadFile = File(...)):
    """Receives manually cropped image and extracts text"""
    
    # Save uploaded image
    ext = file.filename.split(".")[-1]
    image_id = str(uuid.uuid4())  # Generates identifier so uploaded files don't get overwritten
    crop_path = f"{CROP_DIR}/{image_id}_crop.jpg"
    
    with open(crop_path, "wb") as f:
        f.write(file.file.read())
        
    image = cv2.imread(crop_path)
    
    if image is None:
        return err("INVALID_IMAGE", "Unable to read image")
    
    fields = pipeline_two.run(image)
    
    if not fields:
        return err("OCR_FAILED", "Unable to extract text")
    
    return ok({
        "crop_path": crop_path,
        "fields": fields
    })

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
        return err("NO_CARD_DETECTED", "No card detected in image")
    
    # Save cropped card image
    crop_path = f"{CROP_DIR}/{image_id}_crop.jpg"
    cv2.imwrite(crop_path, results["card_crop"])
    
    return {
        "image_path": image_path,
        "crop_path": crop_path,
        "bbox": results["bbox"]
    }
    
@app.post('/price-card')
def price_card(req: PriceCardRequest):
    """Prices a card based on its details"""
    
    result = price_card(req.dict())
    pricing = result.get("pricing")
    
    if not pricing:
        return err("PRICING_NO_DATA", "Unable to price card with given details")
    
    return ok({ pricing})

"""
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
"""

# To ensure API is working
@app.get("/health-check")
def health_check():
    return {"status": "ok"}