import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public', exist_ok=True)

sizes = [16, 32, 48, 128]

for sz in sizes:
    img = Image.new('RGBA', (sz, sz), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    pad = max(1, sz // 16)
    
    # Background rounded rect / shield
    r = sz // 6
    bg_box = [pad, pad, sz - pad, sz - pad]
    
    # Draw background gradient-like dark violet rectangle
    draw.rounded_rectangle(bg_box, radius=r, fill=(18, 18, 28, 255), outline=(99, 102, 241, 255), width=max(1, sz // 32))
    
    # Draw Tab Icon outline
    tab_left = sz * 0.22
    tab_top = sz * 0.28
    tab_right = sz * 0.78
    tab_bottom = sz * 0.78
    corner = max(1, sz // 16)
    
    # Tab body
    draw.rounded_rectangle([tab_left, tab_top, tab_right, tab_bottom], radius=corner, fill=(30, 32, 52, 255), outline=(129, 140, 248, 255), width=max(1, sz // 32))
    
    # Tab handle top
    handle_w = (tab_right - tab_left) * 0.45
    draw.rounded_rectangle([tab_left + sz*0.05, tab_top - sz*0.1, tab_left + sz*0.05 + handle_w, tab_top + 1], radius=max(1, corner//2), fill=(99, 102, 241, 255))
    
    # Echo waves (3 arc-like lines on the right top)
    center_x = sz * 0.5
    center_y = sz * 0.55
    
    for idx, radius in enumerate([sz * 0.15, sz * 0.25, sz * 0.35]):
        if sz >= 32 or idx < 2:
            bbox = [center_x - radius, center_y - radius, center_x + radius, center_y + radius]
            width = max(1, int(sz * 0.05))
            alpha_color = (56, 189, 248, 255 - idx * 50)
            draw.arc(bbox, start=290, end=350, fill=alpha_color, width=width)
            
    img.save(f'public/icon{sz}.png')

# Also write SVG source
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="24" fill="#12121c"/>
  <rect x="2" y="2" width="124" height="124" rx="22" stroke="#6366f1" stroke-width="4" fill="none"/>
  <!-- Tab card -->
  <path d="M 28 36 L 60 36 L 66 44 L 100 44 A 6 6 0 0 1 106 50 L 106 94 A 6 6 0 0 1 100 100 L 28 100 A 6 6 0 0 1 22 94 L 22 42 A 6 6 0 0 1 28 36 Z" fill="#1e2034" stroke="#818cf8" stroke-width="4"/>
  <!-- Echo waves -->
  <path d="M 70 54 A 20 20 0 0 1 90 74" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
  <path d="M 76 46 A 30 30 0 0 1 106 76" stroke="#38bdf8" stroke-dasharray="8 4" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
  <path d="M 82 38 A 40 40 0 0 1 118 74" stroke="#818cf8" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
</svg>"""

with open('public/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Icons generated successfully!")
