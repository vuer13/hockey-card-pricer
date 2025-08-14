import os, uuid
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

input_dir = '../data/yolo/images_raw'
output_dir = '../data/yolo/cards'
os.makedirs(output_dir, exist_ok=True)

MAX_LONG_SIDE = 1600 
count = 1

def save_jpg(src_path, dst_dir, i):
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)
    w, h = img.size
    
    scale = min(1.0, MAX_LONG_SIDE / max(w, h))
    if scale < 1.0:
        img = img.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
        
    img = img.convert("RGB")
    
    out_name = f"card_{i:04d}.jpg"
    out_path = os.path.join(dst_dir, out_name)
    img.save(out_path, "JPEG", quality=92, optimize=True, progressive=True)
    return out_name

for fname in sorted(os.listdir(input_dir)):
    if fname.lower().endswith((".heic", ".heif")):
        src = os.path.join(input_dir, fname)
        new_name = save_jpg(src, output_dir, count)
        count += 1