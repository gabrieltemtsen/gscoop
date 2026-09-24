import os
import math
from PIL import Image, ImageDraw, ImageFilter

SVG_CONTENT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#182226" />
      <stop offset="60%" stop-color="#0a0e12" />
      <stop offset="100%" stop-color="#040608" />
    </radialGradient>

    <!-- Border Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.8" />
    </linearGradient>

    <!-- Brand Arc Gradient -->
    <linearGradient id="gScoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="40%" stop-color="#10b981" />
      <stop offset="85%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <!-- Coin / Spark Gradient -->
    <radialGradient id="sparkGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#a7f3d0" />
      <stop offset="55%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </radialGradient>

    <!-- Subtle Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Squircle Base Canvas -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="12" />

  <!-- GScoop Rotating Loop "G" -->
  <path d="M 344 168 A 125 125 0 1 0 381 256 L 256 256"
        fill="none"
        stroke="url(#gScoopGrad)"
        stroke-width="44"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#glow)" />

  <!-- Dynamic Rotating Coin Node (completing the cooperative loop cycle) -->
  <circle cx="354" cy="158" r="28" fill="url(#sparkGrad)" filter="url(#glow)" />
  <circle cx="354" cy="158" r="14" fill="#ffffff" opacity="0.75" />
</svg>
'''

def generate_png_and_ico():
    # Render at high-resolution 1024x1024 and downsample for extreme sharpness and antialiasing
    scale = 4
    size = 256 * scale # 1024x1024
    
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Squircle background
    padding = 12 * scale
    rect_box = [padding, padding, size - padding, size - padding]
    corner_radius = 56 * scale
    
    # Outer dark background
    draw.rounded_rectangle(rect_box, radius=corner_radius, fill=(10, 14, 18, 255), outline=(16, 185, 129, 200), width=6 * scale)

    # 2. Draw rotating loop G with high quality arcs
    center = (size // 2, size // 2)
    radius = 64 * scale
    stroke_width = 22 * scale

    # Arc bounding box
    bbox = [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius]

    # Angles for 'G': from ~315 deg to ~360 deg
    # In PIL arc, 0 is 3 o'clock, 90 is 6 o'clock, 180 is 9 o'clock, 270 is 12 o'clock
    start_angle = 315
    end_angle = 360 # full circle almost
    # Draw arc from 315 deg through 270, 180, 90, 0
    # In PIL: start to end is clockwise if start < end
    # We want from 315 to 360 (which is 0), so sweep is from -45 to 0 or 315 to 360
    # Actually 'G' starts at top-right (around 315) and goes around counter-clockwise or clockwise
    # If 0 is right, 90 is bottom, 180 is left, 270 is top:
    # Top-right is ~300-315.
    # We want it to go through 270 (top), 180 (left), 90 (bottom), 0 (right)
    # PIL arc takes (start, end) where angles are measured clockwise from 3 o'clock.
    # So to go from 0 -> 90 -> 180 -> 270 -> 315, that's start=0, end=315!
    # Wait, the opening of G is in the first quadrant (between 0 and 315).
    # So the circle exists from 0 clockwise to 90, 180, 270, 315!
    # Let's draw arc from -45 to 0? No, from 0 to 315!
    # Wait, let's test: 0 is (center_x + r, center_y).
    # 90 is (center_x, center_y + r).
    # 180 is (center_x - r, center_y).
    # 270 is (center_x, center_y - r).
    # 315 is top right.
    # So an arc from 0 to 315 covers right, bottom, left, top!
    # Then from 0 (center_x + r, center_y), a horizontal line moves left to center (center_x, center_y).
    # That forms an exact, gorgeous "G"!
    
    # We can draw multiple concentric arcs for smooth thick stroke or polygon
    for w in range(-stroke_width // 2, stroke_width // 2 + 1):
        r_current = radius + w
        b = [center[0] - r_current, center[1] - r_current, center[0] + r_current, center[1] + r_current]
        draw.arc(b, start=0, end=315, fill=(16, 185, 129, 255))
    
    # Draw horizontal inner bar of G: from (center_x + radius, center_y) to (center_x + 5*scale, center_y)
    bar_y = center[1]
    bar_x_start = center[0] + radius
    bar_x_end = center[0]
    draw.line([(bar_x_start, bar_y), (bar_x_end, bar_y)], fill=(6, 182, 212, 255), width=stroke_width)
    
    # Caps on endpoints for smooth rounded look
    cap_radius = stroke_width // 2
    # At bar_x_end:
    draw.ellipse([bar_x_end - cap_radius, bar_y - cap_radius, bar_x_end + cap_radius, bar_y + cap_radius], fill=(6, 182, 212, 255))
    
    # At 315 deg endpoint:
    ang_rad = math.radians(315)
    p315_x = center[0] + radius * math.cos(ang_rad)
    p315_y = center[1] + radius * math.sin(ang_rad)
    draw.ellipse([p315_x - cap_radius, p315_y - cap_radius, p315_x + cap_radius, p315_y + cap_radius], fill=(16, 185, 129, 255))

    # 3. Dynamic glowing coin / spark node near the gap (completing the loop circle at ~335 deg)
    ang_coin = math.radians(335)
    coin_x = center[0] + (radius + 2 * scale) * math.cos(ang_coin)
    coin_y = center[1] + (radius + 2 * scale) * math.sin(ang_coin)
    coin_r = 14 * scale
    draw.ellipse([coin_x - coin_r, coin_y - coin_r, coin_x + coin_r, coin_y + coin_r], fill=(52, 211, 153, 255), outline=(167, 243, 208, 255), width=3 * scale)
    
    # Center white gleam in coin
    gleam_r = 6 * scale
    draw.ellipse([coin_x - gleam_r, coin_y - gleam_r, coin_x + gleam_r, coin_y + gleam_r], fill=(255, 255, 255, 230))

    # Downsample with high-quality Lanczos resampling
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    img_48 = img.resize((48, 48), Image.Resampling.LANCZOS)

    # Save PNGs
    img_512.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/app/icon.png", "PNG")
    img_512.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/public/icon.png", "PNG")
    img_180.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/app/apple-icon.png", "PNG")
    img_180.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/public/apple-touch-icon.png", "PNG")

    # Save multi-resolution ICOs
    img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
    img_256.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    img_256.save("/Users/gabrieltemtsen/Desktop/Projects/gscoop/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    print("All icons successfully generated!")

def main():
    os.makedirs("/Users/gabrieltemtsen/Desktop/Projects/gscoop/app", exist_ok=True)
    os.makedirs("/Users/gabrieltemtsen/Desktop/Projects/gscoop/public", exist_ok=True)

    with open("/Users/gabrieltemtsen/Desktop/Projects/gscoop/app/icon.svg", "w") as f:
        f.write(SVG_CONTENT.strip())

    with open("/Users/gabrieltemtsen/Desktop/Projects/gscoop/public/icon.svg", "w") as f:
        f.write(SVG_CONTENT.strip())

    generate_png_and_ico()

if __name__ == "__main__":
    main()
