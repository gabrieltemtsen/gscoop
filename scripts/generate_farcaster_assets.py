import os
import math
from PIL import Image, ImageDraw, ImageFont

PUBLIC_DIR = "/Users/gabrieltemtsen/Desktop/Projects/gscoop/public"

def draw_gscoop_emblem(draw, center, radius, stroke_width, scale=1):
    # Draw rotating 'G' circle arc
    for w in range(-stroke_width // 2, stroke_width // 2 + 1):
        r_cur = radius + w
        b = [center[0] - r_cur, center[1] - r_cur, center[0] + r_cur, center[1] + r_cur]
        draw.arc(b, start=0, end=315, fill=(16, 185, 129, 255))

    # Horizontal bar of G
    bar_y = center[1]
    bar_x_start = center[0] + radius
    bar_x_end = center[0]
    draw.line([(bar_x_start, bar_y), (bar_x_end, bar_y)], fill=(6, 182, 212, 255), width=stroke_width)

    # Rounded caps
    cap_r = stroke_width // 2
    draw.ellipse([bar_x_end - cap_r, bar_y - cap_r, bar_x_end + cap_r, bar_y + cap_r], fill=(6, 182, 212, 255))

    ang_rad = math.radians(315)
    p315_x = center[0] + radius * math.cos(ang_rad)
    p315_y = center[1] + radius * math.sin(ang_rad)
    draw.ellipse([p315_x - cap_r, p315_y - cap_r, p315_x + cap_r, p315_y + cap_r], fill=(16, 185, 129, 255))

    # Spark / Coin node at 335 deg
    ang_coin = math.radians(335)
    coin_x = center[0] + (radius + 4 * scale) * math.cos(ang_coin)
    coin_y = center[1] + (radius + 4 * scale) * math.sin(ang_coin)
    coin_r = int(stroke_width * 0.65)
    draw.ellipse([coin_x - coin_r, coin_y - coin_r, coin_x + coin_r, coin_y + coin_r],
                 fill=(52, 211, 153, 255), outline=(167, 243, 208, 255), width=max(2, int(stroke_width * 0.14)))
    gleam_r = max(2, int(coin_r * 0.42))
    draw.ellipse([coin_x - gleam_r, coin_y - gleam_r, coin_x + gleam_r, coin_y + gleam_r], fill=(255, 255, 255, 235))


def generate_icon_and_splash():
    # 1024x1024 RGB (no alpha as required by Farcaster manifest spec)
    size = 1024
    img = Image.new("RGB", (size, size), (9, 9, 11))
    draw = ImageDraw.Draw(img)

    # Inner card frame
    pad = 48
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=220, fill=(12, 16, 20), outline=(16, 185, 129), width=18)

    draw_gscoop_emblem(draw, center=(512, 512), radius=250, stroke_width=88, scale=4)

    img.save(os.path.join(PUBLIC_DIR, "farcaster-icon.png"), "PNG")

    # 200x200 Splash Image
    splash = img.resize((200, 200), Image.Resampling.LANCZOS)
    splash.save(os.path.join(PUBLIC_DIR, "farcaster-splash.png"), "PNG")


def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def generate_banner(width, height, filename):
    img = Image.new("RGB", (width, height), (9, 9, 11))
    draw = ImageDraw.Draw(img)

    # Subtle grid pattern
    for x in range(0, width, 60):
        draw.line([(x, 0), (x, height)], fill=(20, 26, 31), width=1)
    for y in range(0, height, 60):
        draw.line([(0, y), (width, y)], fill=(20, 26, 31), width=1)

    # Outer glowing border card
    margin = 36
    draw.rounded_rectangle(
        [margin, margin, width - margin, height - margin],
        radius=36,
        fill=(13, 17, 22),
        outline=(16, 185, 129),
        width=4
    )

    # Left emblem container
    emblem_cx = 230
    emblem_cy = height // 2
    draw.rounded_rectangle(
        [emblem_cx - 120, emblem_cy - 120, emblem_cx + 120, emblem_cy + 120],
        radius=52,
        fill=(9, 12, 16),
        outline=(6, 182, 212),
        width=4
    )
    draw_gscoop_emblem(draw, center=(emblem_cx, emblem_cy), radius=68, stroke_width=24, scale=1)

    # Text section on right
    text_x = 400
    font_badge = load_font(22, bold=True)
    font_title = load_font(68, bold=True)
    font_sub = load_font(30, bold=False)
    font_pill = load_font(22, bold=True)

    # Badge
    badge_y = emblem_cy - 145
    draw.rounded_rectangle([text_x, badge_y, text_x + 380, badge_y + 42], radius=21, fill=(16, 45, 38), outline=(16, 185, 129), width=2)
    draw.text((text_x + 20, badge_y + 9), "ARC MAINNET • NATIVE USDC", fill=(52, 211, 153), font=font_badge)

    # Main Title
    draw.text((text_x, emblem_cy - 82), "GScoop Protocol", fill=(255, 255, 255), font=font_title)

    # Subtitle
    draw.text((text_x, emblem_cy + 8), "Collaborative Rotating Savings & Lending Pools", fill=(161, 161, 170), font=font_sub)

    # Feature pills
    pills = [
        ("5.2% Float APY", (16, 185, 129)),
        ("0% Turn Advances", (6, 182, 212)),
        ("$0.005 USDC Gas", (52, 211, 153)),
    ]
    px = text_x
    py = emblem_cy + 78
    for label, color in pills:
        pw = 225
        draw.rounded_rectangle([px, py, px + pw, py + 48], radius=14, fill=(18, 24, 30), outline=color, width=2)
        draw.text((px + 18, py + 12), label, fill=color, font=font_pill)
        px += pw + 20

    img.save(os.path.join(PUBLIC_DIR, filename), "PNG")


if __name__ == "__main__":
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    generate_icon_and_splash()
    generate_banner(1200, 800, "farcaster-embed.png")  # 3:2 aspect ratio for fc:miniapp
    generate_banner(1200, 630, "farcaster-og.png")     # 1.91:1 aspect ratio for OpenGraph
    print("Farcaster assets generated successfully!")
