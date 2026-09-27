#!/usr/bin/env python3
"""Render the site's brand assets from their sources in site/assets/shared/:
  favicon.svg      -> favicon.ico (16, 32, 48) and apple-touch-icon.png (180, full square)
  social-card.html -> social-card.png (1200x630, rendered at 2x for sharp text)
Needs Python Playwright (Chromium) and Pillow.   python3 tools/render-brand-assets.py
"""
import io, os
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'assets', 'shared')
path = lambda name: os.path.abspath(os.path.join(HERE, name))

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    # The icon, large, on a transparent page; then the same without its rounded corners for iOS, which rounds its own.
    big = open(path('favicon.svg')).read().replace('<svg ', '<svg width="512" height="512" ', 1)
    page = browser.new_page(viewport={'width': 512, 'height': 512})
    shot = lambda markup: Image.open(io.BytesIO((page.set_content('<html><body style="margin:0;background:transparent">' + markup + '</body></html>'), page.screenshot(omit_background=True))[1]))
    icon = shot(big).convert('RGBA')
    square = shot(big.replace(' rx="7"', '')).convert('RGB')
    page.close()
    icon.save(path('favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    square.resize((180, 180), Image.LANCZOS).save(path('apple-touch-icon.png'), optimize=True)

    page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=2)
    page.goto('file://' + path('social-card.html'))
    page.wait_for_load_state('networkidle')
    card = Image.open(io.BytesIO(page.screenshot())).convert('RGB')
    card.save(path('social-card.png'), optimize=True)
    browser.close()

for name in ('favicon.ico', 'apple-touch-icon.png', 'social-card.png'):
    print(name, os.path.getsize(path(name)), 'bytes')
