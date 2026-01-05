from fastapi import FastAPI, UploadFile, File, Form, Depends
from pydantic import BaseModel
import numpy as np
import os
import uuid
import cv2
from dotenv import load_dotenv

from scripts.card_detection import CardDetectionPipeline
from scripts.text_detection import TextExtraction
from scripts.pricing import price_card as run_pricing
from scripts.helpers import load_models

from utils.s3_images import upload_image

from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.model import Card, CardImage, CardPrice
from db.db_get import get_cards
from db.init_db import init_db

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
    
    pricing_input = {
        "name": req.name,
        "card_series": req.card_series,
        "card_number": req.card_number
    }
    pricing = run_pricing(pricing_input)
    
    if "price_estimate" not in pricing:
        return err("PRICING_NO_DATA", "Unable to price card with given details")
    
    db = SessionLocal()
    
    price = CardPrice(
        card_info_id=req.card_id,
        estimate=pricing["estimate"],
        low=pricing["low"],
        high=pricing["high"],
        num_sales=pricing["num_sales"],
        confidence=pricing["confidence"]
    )
    
    db.add(price)
    db.commit()
    
    db.close()
    
    return ok({pricing})

# Read endpoints
@app.get("/card/{card_id}")
def get_card(card_id: str):
    """Fetches card details by ID (PK)"""
    
    db = SessionLocal()
    card = db.query(Card).get(card_id)
    
    db.close()
    return ok({
        "id": card.id,
        "name": card.name,
        "card_series": card.card_series,
        "card_number": card.card_number,
        "team_name": card.team_name,
        "card_type": card.card_type
    }) if card else err("INVALID_INPUT", "Not found")

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
            "image": f"{base_url}{s3_key}" if s3_key else None
        })
        
    return ok(formatted_cards)

# To ensure API is working
@app.get("/health-check")
def health_check():
    return {"status": "ok"}