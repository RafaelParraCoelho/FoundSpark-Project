import os
import re
import json
import requests
import psycopg2
from bs4 import BeautifulSoup

DATABASE_URL = os.environ["DATABASE_URL"]  # e.g. postgresql://user:pass@your-rds-endpoint:5432/pricetracker

# Track specific Kabum product pages (not search results — search is disallowed
# by Kabum's robots.txt, individual product pages are not).
# Paste full product URLs, comma-separated, e.g.:
# https://www.kabum.com.br/produto/934759/console-sony-playstation-5-...
KABUM_URLS = [u.strip() for u in os.environ.get("KABUM_URLS", "").split(",") if u.strip()]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FoundSparkBot/1.0; personal price-tracking project)"
}

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS price_snapshots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    price_brl NUMERIC(12, 2) NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT now()
);
"""

PRICE_RE = re.compile(r"R\$\s*([\d\.]+,\d{2})")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()


def parse_brl(text: str) -> float:
    # "4.699,00" -> 4699.00
    return float(text.replace(".", "").replace(",", "."))


def extract_external_id(url: str) -> str:
    # https://www.kabum.com.br/produto/934759/nome-do-produto -> kabum-934759
    match = re.search(r"/produto/(\d+)", url)
    product_number = match.group(1) if match else url
    return f"kabum-{product_number}"


def scrape_kabum_product(url: str) -> dict:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Prefer structured data (JSON-LD) if the page provides it — more stable
    # than scraping visual elements, since it's meant to be machine-readable.
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
        except (TypeError, ValueError):
            continue
        candidates = data if isinstance(data, list) else [data]
        for entry in candidates:
            if entry.get("@type") == "Product":
                offers = entry.get("offers", {})
                price = offers.get("price") or offers.get("lowPrice")
                if price:
                    return {
                        "title": entry.get("name", "").strip(),
                        "price": float(price),
                    }

    # Fallback: grab the first BRL-formatted price on the page.
    title_tag = soup.find("meta", property="og:title") or soup.find("title")
    title = title_tag.get("content") if title_tag and title_tag.has_attr("content") else (
        title_tag.text if title_tag else url
    )

    price_match = PRICE_RE.search(soup.get_text())
    if not price_match:
        raise ValueError(f"Could not find a price on the page: {url}")

    return {"title": title.strip(), "price": parse_brl(price_match.group(1))}


def upsert_snapshot(conn, external_id: str, title: str, price: float, url: str, category: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO products (external_id, title, source, url, category)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (external_id) DO UPDATE
                SET title = EXCLUDED.title, url = EXCLUDED.url
            RETURNING id
            """,
            (external_id, title, "kabum", url, category),
        )
        product_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO price_snapshots (product_id, price_brl)
            VALUES (%s, %s)
            """,
            (product_id, price),
        )
    conn.commit()


def lambda_handler(event, context):
    if not KABUM_URLS:
        print("No KABUM_URLS configured — nothing to do.")
        return {"statusCode": 200, "saved": 0}

    conn = get_connection()
    total_saved = 0
    try:
        ensure_schema(conn)
        for url in KABUM_URLS:
            print(f"Fetching: {url}")
            try:
                data = scrape_kabum_product(url)
            except Exception as exc:
                print(f"Skipping {url}: {exc}")
                continue
            external_id = extract_external_id(url)
            upsert_snapshot(conn, external_id, data["title"], data["price"], url, category="console")
            total_saved += 1
    finally:
        conn.close()

    print(f"Saved {total_saved} price snapshots")
    return {"statusCode": 200, "saved": total_saved}
