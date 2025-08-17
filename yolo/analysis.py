from ultralytics import YOLO
import glob, os, cv2, time, numpy as np

model = YOLO("runs/detect/train2/weights/best.pt")
metrics = model.val(data="dataset/card.yaml", imgsz=640, split="test", plots=True, save_json=True)

IMG_DIR = "dataset/images/test"
img_paths = []
for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
    img_paths.extend(glob.glob(os.path.join(IMG_DIR, ext)))

t = []
for p in img_paths:
    im = cv2.imread(p)
    s = time.time()
    model.predict(im, imgsz=640, conf=0.91, verbose=False)
    t.append(time.time() - s)
    
print("mAP50:", metrics.box.map50, "mAP50-95:", metrics.box.map)
print("Precision:", metrics.box.p, "Recall:", metrics.box.r, "F1:", metrics.box.f1)
print("Mean latency (ms):", 1000*np.mean(t), "FPS:", 1/np.mean(t))