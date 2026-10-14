"""Render the BassClass app icon to PNG (PWA + Android launcher sizes).

Usage: python tools/make_icons.py
Draws the same artwork as web/icons/icon.svg (full-bleed, so it also works as
a maskable/adaptive icon) with 4x supersampling for smooth edges.
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SS = 4  # supersampling factor


def draw(size, rounded=False):
    S = size * SS
    k = S / 512.0
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bg = (18, 20, 42, 255)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(112 * k), fill=bg)
    else:
        d.rectangle([0, 0, S, S], fill=bg)
    # keep artwork inside the adaptive-icon safe zone
    m = 0.82 if not rounded else 1.0
    off = (1 - m) * 256

    def X(v):
        return (off + v * m) * k

    d.rounded_rectangle([X(40), X(150), X(472), X(362)], radius=int(18 * k * m), fill=(38, 43, 85, 255))
    for x in (132, 232, 332, 432):
        d.rectangle([X(x - 3.5), X(150), X(x + 3.5), X(362)], fill=(170, 176, 214, 255))
    d.rounded_rectangle([X(34), X(144), X(52), X(368)], radius=int(5 * k), fill=(239, 231, 214, 255))
    for y, hgt in ((186, 5), (234, 7), (282, 9), (330, 11)):
        d.rectangle([X(40), X(y), X(472), X(y + hgt)], fill=(217, 210, 196, 255))
    for cx, cy, col in ((182, 336, (63, 193, 156)), (282, 286, (110, 128, 232)), (382, 238, (219, 168, 90))):
        r = 34
        d.ellipse([X(cx - r), X(cy - r), X(cx + r), X(cy + r)], fill=col + (255,))
    r = 22
    d.ellipse([X(382 - r), X(188 - r), X(382 + r), X(188 + r)], outline=(63, 193, 156, 255), width=int(8 * k * m))
    return img.resize((size, size), Image.LANCZOS)


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print('wrote', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    for s in (192, 512):
        save(draw(s), os.path.join(ROOT, 'web', 'icons', f'icon-{s}.png'))
    res = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
    for name, s in (('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)):
        save(draw(s, rounded=True), os.path.join(res, f'mipmap-{name}', 'ic_launcher.png'))
