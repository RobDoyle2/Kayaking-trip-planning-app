"""Pixel-based WCAG contrast check. Text colour comes from computed style; the background is
sampled from a screenshot taken with all text made transparent, so gradients and overlays count."""
import json, glob, os, sys
from PIL import Image

OUT = os.environ.get('OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'audit')

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(rgb):
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])

def ratio(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)

def blend(fg, a, bg):
    return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3))

bad = []
checked = 0
for items_file in sorted(glob.glob(f'{OUT}/items-*.json')):
    name = os.path.basename(items_file)[len('items-'):-len('.json')]
    img = Image.open(f'{OUT}/bg-{name}.png').convert('RGB')
    W, H = img.size
    items = json.load(open(items_file))
    for it in items:
        x0, y0 = max(0, it['x']), max(0, it['y'])
        x1, y1 = min(W, it['x'] + it['w']), min(H, it['y'] + it['h'])
        if x1 - x0 < 2 or y1 - y0 < 2:
            continue
        # sample a grid of background pixels inside the element's box (inset 2px to skip borders)
        # central band only: avoids rounded corners and borders, which are not behind the text
        bx0 = x0 + int((x1 - x0) * 0.15); bx1 = max(bx0 + 1, x1 - int((x1 - x0) * 0.15))
        by0 = y0 + int((y1 - y0) * 0.3); by1 = max(by0 + 1, y0 + int((y1 - y0) * 0.7))
        xs = range(bx0, bx1, max(1, (bx1 - bx0) // 24))
        ys = range(by0, by1, max(1, (by1 - by0) // 6))
        c = it['color']
        fg_rgb = (c['r'], c['g'], c['b'])
        alpha = c['a'] * it['opacity']
        worst = None
        for y in ys:
            for x in xs:
                bg = img.getpixel((x, y))
                fg = blend(fg_rgb, alpha, bg) if alpha < 1 else fg_rgb
                r = ratio(fg, bg)
                if worst is None or r < worst:
                    worst = r
        if worst is None:
            continue
        large = it['size'] >= 24 or (it['size'] >= 18.66 and it['weight'] >= 700)
        need = 3.0 if large else 4.5
        checked += 1
        if worst < need:
            bad.append((name, it['sel'], it['text'], round(worst, 2), need, it['size']))

print(f'checked {checked} text elements across {len(glob.glob(OUT + "/items-*.json"))} screens')
# Collapse duplicates (same selector + text + ratio)
seen = set()
for b in bad:
    key = (b[1], b[2], b[3])
    if key in seen:
        continue
    seen.add(key)
    print('LOW CONTRAST', b)
print(f'{len(seen)} distinct low-contrast items')
