from fastapi import FastAPI, UploadFile, File, Form, Depends
from pydantic import BaseModel
import numpy as np
import os
import uuid
from uuid import UUID          
import cv2
from dotenv import load_dotenv
from PIL import Image, ImageOps
from typing import List           

from scripts.card_detection import CardDetectionPipeline
from scripts.text_detection import TextExtraction
from scripts.pricing import price_card as run_pricing
from scripts.helpers import load_models

from utils.s3_images import upload_image

from sqlalchemy import asc   
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.model import Card, CardImage, CardPrice
from db.db_get import get_cards
from db.init_db import init_db
from db.schemas import TrendPoint

load_dotenv()

# AWS Credentials from .env variables
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET = os.getenv("S3_BUCKET")

app = FastAPI()

init_db()

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
    front_image_key: str
    back_image_key: str
    
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
    
# Helper to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/confirm-card")
def confirm_card(req: ConfirmCardRequest):
    """Endpoint to confirm card details and store in DB"""
    
    if not req.name or not req.card_series or not req.card_number:
        return err("INVALID_INPUT", "Missing required fields")
    
    db = SessionLocal()
    
    try:
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
        db.refresh(card) # Get new ID
        
        # Add Front Image
        front_image = CardImage(
            card_id=card.id,
            image_type="front",
            s3_key=req.front_image_key
        )
        
        db.add(front_image)

        # Add Back Image
        back_image = CardImage(
            card_id=card.id,
            image_type="back",
            s3_key=req.back_image_key
        )
        
        db.add(back_image)
        db.commit()
        
        return ok({"card_id": str(card.id)})
    
    except Exception as e:
        db.rollback()
        return err("DB_ERROR", str(e))
    finally:
        db.close()


@app.post("/extract-text")
def extract_text(file: UploadFile = File(...)):
    """Extracts text from a cropped card image"""
    
    # Save temp image
    ext = file.filename.split(".")[-1]
    tmp_path = f"/tmp/{uuid.uuid4()}.{ext}"

    with open(tmp_path, "wb") as f:
        f.write(file.file.read())

    image = cv2.imread(tmp_path)
    
    os.remove(tmp_path)
    
    if image is None:
        return err("INVALID_IMAGE", "Could not read uploaded image")

    fields = pipeline_two.run(image)

    if not fields:
        return err("OCR_FAILED", "Unable to extract text")

    return ok(fields)

# Endpoint handles upload + detection
@app.post('/detect-card')
def detect_card(file: UploadFile = File(...), image_type: str = Form(...)):
    """Receives an image and detects card in it"""
    
    if image_type is None or image_type not in ["front", "back"]:
        return err("INVALID_INPUT", "Image type must be 'front' or 'back'")

    # Setup Paths
    ext = file.filename.split(".")[-1]
    image_id = str(uuid.uuid4())
    image_path = f"{UPLOAD_DIR}/{image_id}.{ext}"
    crop_path = f"{UPLOAD_DIR}/{image_id}_{image_type}_crop.{ext}"

    try:
        img = Image.open(file.file)
        img = ImageOps.exif_transpose(img) 
        
        MAX_LONG_SIDE = 1600
        w, h = img.size
        scale = min(1.0, MAX_LONG_SIDE / max(w, h))
        
        if scale < 1.0:
            new_w, new_h = int(w * scale), int(h * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            
        img = img.convert("RGB")
        img.save(image_path, quality=92, optimize=True)
        
        results = pipeline_one.run(image_path)
        
        if results is None or "bbox" not in results:
            return err("NO_CARD_DETECTED", "No card detected")
    
        bbox = results["bbox"]
        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        
        # Edge cases
        img_w, img_h = img.size
        left = max(0, int(x1))
        top = max(0, int(y1))
        right = min(img_w, int(x2))  
        bottom = min(img_h, int(y2)) 
        
        # Perform Crop
        cropped_img = img.crop((left, top, right, bottom))
        cropped_img.save(crop_path, quality=95)

        s3_key_original = f"cards/{image_id}/{image_type}.{ext}"
        s3_key_crop = f"cards/{image_id}/{image_type}_crop.{ext}"
        
        upload_image(image_path, s3_key_original)
        upload_image(crop_path, s3_key_crop)

        return ok({
            "s3_key_original": s3_key_original,
            "s3_key_crop": s3_key_crop,
            "bbox": results["bbox"],
            "image_type": image_type
        })

    except Exception as e:
        print(f"Error processing card: {e}")
        return err("PROCESSING_ERROR", str(e))
    
@app.post('/price-card')
def price_card(req: PriceCardRequest):
    """Prices a card based on its details"""
    
    pricing_input = {
        "name": req.name,
        "card_series": req.card_series,
        "card_number": req.card_number
    }
    pricing = run_pricing(pricing_input)
    
    if "estimate" not in pricing:
        return err("PRICING_NO_DATA", "Unable to price card with given details")
    
    db = SessionLocal()
    
    try:
        price = CardPrice(
            card_info_id=req.card_id,
            estimate=pricing["estimate"],
            low=pricing["price_low"],
            high=pricing["price_high"],
            num_sales=pricing["sales_count"],
            confidence=pricing["confidence"]
        )
    
        db.add(price)
        db.commit()
    except Exception as e:
        db.rollback()
        return err("DB_ERROR", str(e))
    finally:
        db.close()
    
    return ok({pricing})

# Read endpoints
@app.get("/card/{card_id}")
def get_card(card_id: str):
    """Fetches card details by ID (PK)"""
    
    db = SessionLocal()
    try:
        card = db.query(Card).get(card_id)
        
        if not card:
            return err("INVALID_INPUT", "Not found")    
        
        images = db.query(CardImage).filter(CardImage.card_id == card_id).all()
        
        # Organize/sort keys to get front key and back key
        front_key = next((img.s3_key for img in images if img.image_type == "front"), None)
        back_key = next((img.s3_key for img in images if img.image_type == "back"), None)
        
        return ok({
            "id": card.id,
            "name": card.name,
            "card_series": card.card_series,
            "card_number": card.card_number,
            "team_name": card.team_name,
            "card_type": card.card_type,
            "front_image_key": front_key,
            "back_image_key": back_key,
            "saved": card.saved
        })
    finally:
        db.close()

@app.get("/card/{card_id}/prices")
def get_prices(card_id: str):
    """Fetches card pricing details by Card ID (FK)"""
    
    db = SessionLocal()
    prices = db.query(CardPrice).filter(CardPrice.card_id == card_id).all()
    
    db.close()
    return ok([{
        "id": p.id,
        "estimate": p.estimate,
        "low": p.low,
        "high": p.high,
        "num_sales": p.num_sales
    } for p in prices]) if prices else err("NOT_FOUND", "No prices found")
    
@app.get("/cards")
def read_cards(q: str = None, db: Session = Depends(get_db)):
    results = get_cards(db, q)

    formatted_cards = []
    
    base_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/"
    
    for card, s3_key in results:
        formatted_cards.append({
            "id": str(card.id),
            "name": card.name,
            "card_series": card.card_series,
            "card_number": card.card_number,
            "team_name": card.team_name,
            "card_type": card.card_type,
            "image": f"{base_url}{s3_key}" if s3_key else None,
            "saved": card.saved
        })
        
    return ok(formatted_cards)

@app.get("/card/{card_id}/price-trend", response_model=List[TrendPoint])
def get_price_trend(card_id: UUID, db: Session = Depends(get_db)):
    """
    Fetches price history sorted by date 
    """
    trends = (
        db.query(CardPrice)
        .filter(CardPrice.card_info_id == card_id)
        .order_by(asc(CardPrice.created_at))  # Oldest first for the chart
        .all()
    )
    
    return trends # For response_model above, no ok

# To ensure API is working
@app.get("/health-check")
def health_check():
    return {"status": "ok"}