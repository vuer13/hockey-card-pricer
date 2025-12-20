from fastapi import FastAPI, UploadFile, File
import os
import uuid

from scripts.card_detection import CardDetectionPipeline

app = FastAPI()

# Temporary upload directory, will use a proper storage solution in production
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post('/detect-card')
def detect_card(file: UploadFile = File(...)):
    """Receives an image and detects card in it"""
    # TODO

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