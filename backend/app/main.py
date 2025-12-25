from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import os
import uuid
import cv2

from scripts.card_detection import CardDetectionPipeline
from scripts.text_detection import TextExtraction
from scripts.pricing import price_card as run_pricing
from scripts.helpers import load_models

from utils.s3_images import upload_image

from db.database import SessionLocal
from db.models import Card, CardImage, CardPrice

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
    
class ConfirmCardRequest(BaseModel):
    name: str
    card_series: str
    card_number: str
    team_name: str | None = None
    card_type: str | None = "Base"
    image_type: str
    s3_key: str
    
class PriceCardRequest(BaseModel):
    card_id: str
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
    """Endpoint to confirm card details and store in DB"""
    
    if not req.name or not req.card_series or not req.card_number:
        return err("INVALID_INPUT", "Missing required fields")
    
    db = SessionLocal()
    
    # Card Information
    card = Card(
        name=req.name,
        card_series=req.card_series,
        card_number=req.card_number,
        team_name=req.team_name,
        card_type=req.card_type if req.card_type else "Base"
    )
    
    # Adding Card to DB
    db.add(card)
    db.commit()
    db.refresh(card)
    
    image = CardImage(
        card_id=card.id,
        image_type=req.image_type,
        s3_key=req.s3_key
    )
    
    db.add(image)
    db.commit()

    return ok({"card_id": str(card.id)})


@app.post("/extract-text")
def extract_text(req: CropRequest):
    """Extracts text from a cropped card image"""
    
    # Save temp image
    ext = file.filename.split(".")[-1]
    tmp_path = f"/tmp/{uuid.uuid4()}.{ext}"

    with open(tmp_path, "wb") as f:
        f.write(file.file.read())

    image = cv2.imread(tmp_path)
    
    if image is None:
        return err("INVALID_IMAGE", "Could not read uploaded image")

    fields = pipeline_two.run(image)

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
def detect_card(file: UploadFile = File(...), image_type: str = Form(...)):
    """Receives an image and detects card in it"""
    
    if image_type is None or image_type not in ["front", "back"]:
        return err("INVALID_INPUT", "Image type must be 'front' or 'back'")

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
    
    s3_key = f"cards/{image_id}/{image_type}.{ext}"
    upload_image(image_path, s3_key)

    return ok({
        "s3_key": s3_key,
        "bbox": results["bbox"],
        "image_type": image_type
    })
    
@app.post('/price-card')
def price_card(req: PriceCardRequest):
    """Prices a card based on its details"""
    
    result = run_pricing(req.dict())
    pricing = result.get("pricing")
    
    if not pricing:
        return err("PRICING_NO_DATA", "Unable to price card with given details")
    
    db = SessionLocal()
    
    price = CardPrice(
        card_id=req.card_id,
        estimate=pricing["estimate"],
        low=pricing["low"],
        high=pricing["high"],
        num_sales=pricing["num_sales"]
    )
    
    db.add(price)
    db.commit()
    
    return ok({pricing})

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