import re
import requests
from bs4 import BeautifulSoup


def extract_link(text: str):
    if not text:
        return None

    pattern = r'(https?://[^\s]+)'
    match = re.search(pattern, text)
    return match.group(0) if match else None


def fetch_link_preview(url: str):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }

        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, "html.parser")

        title = ""
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title.get("content").strip()
        elif soup.title and soup.title.string:
            title = soup.title.string.strip()

        description = ""
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            description = og_desc.get("content")
        else:
            desc = soup.find("meta", attrs={"name": "description"})
            if desc and desc.get("content"):
                description = desc.get("content")

        description = description.strip() if description else ""

        image = ""
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            image = og_image.get("content").strip()

        return title, description, image

    except Exception as e:
        print("Preview Error:", e)
        return "", "", ""