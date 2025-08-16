import os, shutil, random

IMG_DIR = 'data/cards'
LABEL_DIR = 'data/labels_all'
ROOT = 'dataset'

# Create new directories
splits = ['train', 'val', 'test']
for s in splits:
    os.makedirs(os.path.join(ROOT, "images", s), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "labels", s), exist_ok=True)

# Get all files in images
files = [f for f in os.listdir(IMG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

random.seed(42)
random.shuffle(files)

n = len(files)
n_train = int(0.7 * n)
n_val = int(0.2 * n)

split_map = {
    'train': files[:n_train],
    'val': files[n_train:n_train+n_val],
    'test': files[n_train+n_val:]
}

for split, flist in split_map.items():
    for fn in flist:
        base, _ = os.path.splitext(fn)
        
        # Copy image to new directory
        shutil.copy2(os.path.join(IMG_DIR, fn), os.path.join(ROOT, "images", split, fn))
        
        # Copy coressponding label file
        src_lbl = os.path.join(LABEL_DIR, base + ".txt")
        dst_lbl = os.path.join(ROOT, "labels", split, base + ".txt")
        if os.path.exists(src_lbl):
            shutil.copy2(src_lbl, dst_lbl)
        else:
            open(dst_lbl, "w").close()