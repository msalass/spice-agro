#!/usr/bin/env python3
"""Láminas QR imprimibles para corredoras de «El plano de tu parcela».

Genera PNG en qr/corredoras/. No hace falta correrlo para usar las láminas:
los PNG ya están en el repo. Para regenerar:

    pip install 'qrcode[pil]' pillow
    python3 qr/generar_qr.py
"""

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "corredoras"

NAVY = (25, 31, 57)       # #191f39
CREAM = (255, 251, 220)   # #fffbdc
TEAL = (49, 114, 134)     # #317286
SAGE = (168, 168, 148)    # #a8a894

PAGE = "https://agro.spicelab.cl/analisis-de-suelo.html"
UTM = "utm_source=corredora&utm_medium=qr&utm_campaign=plano"
TAGLINE = "El plano de tu parcela · SPICe Agro"

# (slug, etiqueta impresa, prioridad)
BROKERS = [
    ("riocruces", "Río Cruces", True),
    ("ramon", "Ramón", False),
    ("cesar", "César", False),
    ("patricio", "Patricio", False),
    ("camposchile", "Campos Chile", False),
    ("godben", "Godben", False),
    ("carolina", "Carolina", False),
]

WIDTH = 1600
QR_TARGET = 1200
EC = qrcode.constants.ERROR_CORRECT_H


def url_for(slug: str) -> str:
    return f"{PAGE}?ref={slug}&{UTM}"


def load_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def qr_image(data: str) -> Image.Image:
    probe = qrcode.QRCode(error_correction=EC, box_size=1, border=4)
    probe.add_data(data)
    probe.make(fit=True)
    modules = probe.modules_count + 8
    scale = max(1, -(-QR_TARGET // modules))  # ceil
    qr = qrcode.QRCode(error_correction=EC, box_size=scale, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#191f39", back_color="#fffbdc").convert("RGB")
    if img.size[0] < QR_TARGET:
        raise SystemExit(f"QR quedó en {img.size[0]}px, se pedían ≥{QR_TARGET}")
    return img


def render(slug: str, label: str) -> Image.Image:
    code = qr_image(url_for(slug))
    name_font = load_font([
        "/usr/share/fonts/truetype/croscore/Tinos-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    ], 84)
    tag_font = load_font([
        "/usr/share/fonts/truetype/macos/Inter-Medium.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ], 32)

    top = 72
    gap_after_qr = 48
    gap_after_rule = 36
    bottom = 88
    rule_w = 220
    rule_h = 4

    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    name_box = dummy.textbbox((0, 0), label, font=name_font)
    # Alto fijo para que las 7 láminas salgan del mismo tamaño.
    name_h = 100
    tag_h = 44

    height = (
        top
        + code.size[1]
        + gap_after_qr
        + rule_h
        + gap_after_rule
        + name_h
        + 18
        + tag_h
        + bottom
    )
    canvas = Image.new("RGB", (WIDTH, height), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, WIDTH, 16), fill=TEAL)

    qx = (WIDTH - code.size[0]) // 2
    canvas.paste(code, (qx, top))

    rule_y = top + code.size[1] + gap_after_qr
    rule_x = (WIDTH - rule_w) // 2
    draw.rectangle((rule_x, rule_y, rule_x + rule_w, rule_y + rule_h), fill=SAGE)

    name_y = rule_y + rule_h + gap_after_rule - name_box[1]
    draw.text((WIDTH / 2, name_y), label, font=name_font, fill=NAVY, anchor="mt")

    tag_y = name_y + name_h + 18
    draw.text((WIDTH / 2, tag_y), TAGLINE, font=tag_font, fill=TEAL, anchor="mt")

    draw.rectangle((0, height - 10, WIDTH, height), fill=SAGE)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, label, _prio in BROKERS:
        img = render(slug, label)
        path = OUT / f"{slug}.png"
        img.save(path, format="PNG", optimize=True)
        print(f"{path.name} {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    main()
