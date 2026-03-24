import os
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

MEDAL_DIR = "medals"
os.makedirs(MEDAL_DIR, exist_ok=True)


def create_medal(user_id, achievements):
    filename = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(MEDAL_DIR, filename)

    img = Image.new("RGB", (700, 700), color=(245, 239, 220))
    draw = ImageDraw.Draw(img)

    draw.ellipse((150, 80, 550, 480), fill=(212, 175, 55), outline=(100, 80, 20), width=8)
    draw.rectangle((270, 450, 330, 680), fill=(180, 30, 30))
    draw.rectangle((370, 450, 430, 680), fill=(30, 60, 180))

    try:
        title_font = ImageFont.truetype("arial.ttf", 32)
        body_font = ImageFont.truetype("arial.ttf", 22)
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    draw.text((240, 180), "Daily Medal", fill="black", font=title_font)

    y = 520
    draw.text((60, y), f"User: {user_id}", fill="black", font=body_font)
    y += 40

    for i, item in enumerate(achievements[:3], start=1):
        draw.text((60, y), f"{i}. {item}", fill="black", font=body_font)
        y += 35

    img.save(path)
    return path