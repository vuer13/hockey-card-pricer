import cv2
from scripts.helpers import load_models, detect_boxes, deskew, easy_ocr

class TextExtraction:
    def __init__(self, model, ocr):
        self.model = model
        self.ocr = ocr
        
    def run(self, image):
        # Find boxes
        detections = detect_boxes(self.model, image)
        fields = {}

        # For each detection found
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            field = det["field"]

            crop = card_crop[y1:y2, x1:x2] # Crop the area
            # crop = deskew(crop) # Deskew the crop
            # crop = preprocess_for_ocr(crop)
            
            crop = cv2.resize(
                crop, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC
            )
            text = easy_ocr(self.ocr, crop) # Extract text via OCR
            
            cv2.imwrite(f"debug_{field}.jpg", crop)

            fields[field] = text # Add to results

        return fields

def pipeline_b():
    _, frcnn, reader = load_models()

    pipeline_b = TextExtraction(frcnn, reader)

    card_crop = cv2.imread("card_crop.jpg")

    if card_crop is None:
        raise ValueError("Could not load test card crop")

    fields = pipeline_b.run(card_crop)

    print("Extracted fields:")
    print(fields)