from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright


url = input("URLを入力してください: ")

project_root = Path(__file__).resolve().parents[1]
output_dir = project_root / "data" / "raw" / "web_pages"
output_dir.mkdir(parents=True, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_path = output_dir / f"{timestamp}_page_text.txt"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(url, wait_until="networkidle")

    text = page.inner_text("body")

    with output_path.open("w", encoding="utf-8") as f:
        f.write(text)

    browser.close()

print(f"{output_path} に保存しました")