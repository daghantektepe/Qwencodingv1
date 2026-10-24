import os
from PIL import Image, ImageDraw

def generate_icons():
    build_dir = os.path.join(os.path.dirname(__file__), "..", "build")
    os.makedirs(build_dir, exist_ok=True)

    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Koyu zarif dairesel arka plan (Antik Yazarlık Stüdyosu Tonu)
    # Daire merkez ve yarıçap
    margin = 12
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(28, 25, 23, 255),
        outline=(217, 119, 6, 255),
        width=6
    )

    # 2. İç altın çember
    inner_margin = 24
    draw.ellipse(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        outline=(245, 158, 11, 160),
        width=2
    )

    # 3. Stilize Kitap / Taslak Sayfası (Sol ve Sağ açık sayfalar)
    # Sol sayfa
    draw.polygon([
        (60, 160),
        (124, 175),
        (124, 100),
        (60, 85)
    ], fill=(245, 242, 234, 255), outline=(180, 83, 9, 255))

    # Sağ sayfa
    draw.polygon([
        (132, 175),
        (196, 160),
        (196, 85),
        (132, 100)
    ], fill=(255, 255, 255, 255), outline=(180, 83, 9, 255))

    # Sayfa çizgileri
    draw.line([(70, 105), (115, 115)], fill=(168, 162, 158, 255), width=2)
    draw.line([(70, 120), (115, 130)], fill=(168, 162, 158, 255), width=2)
    draw.line([(70, 135), (115, 145)], fill=(168, 162, 158, 255), width=2)

    draw.line([(140, 115), (185, 105)], fill=(168, 162, 158, 255), width=2)
    draw.line([(140, 130), (185, 120)], fill=(168, 162, 158, 255), width=2)
    draw.line([(140, 145), (185, 135)], fill=(168, 162, 158, 255), width=2)

    # 4. Altın Tüy Kalem (Quill Pen)
    draw.line([(120, 190), (180, 60)], fill=(245, 158, 11, 255), width=4)
    # Kalem ucu
    draw.polygon([(115, 198), (122, 185), (126, 188)], fill=(217, 119, 6, 255))
    # Tüy kanadı
    draw.polygon([
        (180, 60),
        (205, 80),
        (175, 115),
        (165, 100)
    ], fill=(251, 191, 36, 220), outline=(217, 119, 6, 255))

    # PNG Kaydet
    png_path = os.path.join(build_dir, "icon.png")
    img.save(png_path, "PNG")
    print(f"PNG kaydedildi: {png_path}")

    # Çoklu çözünürlüklü Windows ICO Kaydet
    ico_path = os.path.join(build_dir, "icon.ico")
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=icon_sizes)
    print(f"ICO kaydedildi: {ico_path}")

if __name__ == "__main__":
    generate_icons()
