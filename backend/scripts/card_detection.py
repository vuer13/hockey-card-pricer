import cv2
from helpers import detect_card, load_models

class CardDetectionPipeline:
    def __init__(self, yolo):
        self.yolo = yolo
        
    def run(self, image_path):
        """Card Detection on image"""
        
        image = cv2.imread(image_path)
        
        if image is None:
            raise ValueError("Could not load image")

        result = detect_card(self.yolo, image)

        if result is None:
            return None

        return result
 
def test_a():    
    yolo, _, _ = load_models()

    pipeline = CardDetectionPipeline(yolo)
    out = pipeline.run("card.jpg")

    if out:
        print("BBox:", out["bbox"])
        cv2.imwrite("card_crop.jpg", out["card_crop"])
    else:
        print("No card detected")
        
