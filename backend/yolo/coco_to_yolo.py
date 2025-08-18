import json, os, cv2

JSON = 'data/cards.json'
IMG_DIR = 'data/cards'
LBL_DIR = 'data/labels_all'
os.makedirs(LBL_DIR, exist_ok=True)

with open(JSON) as f:
    coco = json.load(f)

# Map image id to file name, width, height
imginfo = {im["id"]: (im["file_name"], im["width"], im["height"]) for im in coco['images']}

# Map categories into yolo_id
cat_ids = [c["id"] for c in coco["categories"]]
cat2yolo = {cid: i for i, cid in enumerate(cat_ids)}

per_image = {im_id: [] for im_id in imginfo} # For each id in image photo
for annotation in coco["annotations"]:
    im_id = annotation["image_id"]
    x, y, w, h = annotation["bbox"]
    file, W, H = imginfo[im_id]
    
    # Normalize to yolo format
    cx = (x + w / 2) / W
    cy = (y + h / 2) / H
    nw = w / W
    nh = h / H
    
    classes = cat2yolo[annotation["category_id"]]
    per_image[im_id].append(f"{classes} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
    
# For each image, write txt
for im_id, lines in per_image.items():
    fname, _, _ = imginfo[im_id]
    base = os.path.splitext(fname)[0]
    with open(os.path.join(LBL_DIR, base + ".txt"), "w") as f:
        f.write("\n".join(lines))