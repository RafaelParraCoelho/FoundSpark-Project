"""
Amazon Brazil price collector.

Scrapes individual Amazon.com.br product pages using Playwright (headless browser)
to bypass bot detection. URLs must be curated manually (browse → copy URL).

Usage:
  Set AMAZON_URLS env var with comma-separated Amazon product URLs.
  Set DATABASE_URL env var with PostgreSQL connection string.
"""

import os
import re
import json
import time
import random
import asyncio
from typing import Optional

import psycopg2
from playwright.async_api import async_playwright, Page

DATABASE_URL = os.environ["DATABASE_URL"]

# Curated Amazon.com.br product URLs (not search results).
# Paste full product URLs, comma-separated, e.g.:
# https://www.amazon.com.br/dp/B0DFMJQ7VH
AMAZON_URLS = [u.strip() for u in os.environ.get("AMAZON_URLS", "").split(",") if u.strip()]

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

# Realistic browser headers
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
]

HEADERS = {
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()


def extract_external_id(url: str) -> str:
    """Extract ASIN from Amazon URL -> 'amazon-B0DFMJQ7VH'."""
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if match:
        return f"amazon-{match.group(1)}"
    match = re.search(r"/gp/product/([A-Z0-9]{10})", url)
    if match:
        return f"amazon-{match.group(1)}"
    # Fallback: use URL hash
    return f"amazon-{url.split('/')[-1]}"


def parse_brl(price_str: str) -> float:
    """Parse BRL price format: '4.699,00' -> 4699.00."""
    return float(price_str.replace(".", "").replace(",", "."))


async def scrape_amazon_product(page: Page, url: str) -> dict:
    """
    Scrape a single Amazon.com.br product page.
    Tries JSON-LD first, then meta tags, then visible price text.
    """
    # Add random delay between requests (30-90 seconds)
    await asyncio.sleep(random.uniform(30, 90))

    await page.goto(url, wait_until="domcontentloaded", timeout=30000)

    # Check for bot challenge page
    content = await page.content()
    if "Clique no botão abaixo" in content or "captcha" in content.lower():
        print(f"Bot challenge detected on {url} — waiting and retrying...")
        await asyncio.sleep(60)
        await page.reload(wait_until="domcontentloaded")
        content = await page.content()

    # Method 1: Try JSON-LD structured data
    json_ld_scripts = await page.query_selector_all('script[type="application/ld+json"]')
    for script in json_ld_scripts:
        text = await script.inner_text()
        try:
            data = json.loads(text)
        except (json.JSONDecodeError, ValueError):
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

    # Method 2: Meta tags (og:title, og:price:amount)
    title_el = await page.query_selector('meta[property="og:title"]')
    title = await title_el.get_attribute("content") if title_el else None

    price_el = await page.query_selector('meta[property="og:price:amount"]')
    price_str = await price_el.get_attribute("content") if price_el else None

    if title and price_str:
        return {
            "title": title.strip(),
            "price": float(price_str),
        }

    # Method 3: Visible price text (regex fallback)
    if not title:
        title_el = await page.query_selector("#productTitle")
        title = await title_el.inner_text() if title_el else url

    price_text = await page.inner_text("body")
    price_match = re.search(r"R\$\s*([\d\.]+,\d{2})", price_text)
    if not price_match:
        raise ValueError(f"Could not find price on page: {url}")

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
            (external_id, title, "amazon_br", url, category),
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


async def run_collector():
    if not AMAZON_URLS:
        print("No AMAZON_URLS configured — nothing to do.")
        return {"statusCode": 200, "saved": 0}

    conn = get_connection()
    total_saved = 0

    try:
        ensure_schema(conn)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                locale="pt-BR",
                timezone_id="America/Sao_Paulo",
                extra_http_headers=HEADERS,
            )
            page = await context.new_page()

            for url in AMAZON_URLS:
                print(f"Fetching: {url}")
                try:
                    data = await scrape_amazon_product(page, url)
                except Exception as exc:
                    print(f"Skipping {url}: {exc}")
                    continue

                external_id = extract_external_id(url)
                upsert_snapshot(conn, external_id, data["title"], data["price"], url, category="console")
                total_saved += 1

            await browser.close()
    finally:
        conn.close()

    print(f"Saved {total_saved} price snapshots")
    return {"statusCode": 200, "saved": total_saved}


def lambda_handler(event, context):
    """AWS Lambda entry point."""
    return asyncio.get_event_loop().run_until_complete(run_collector())


if __name__ == "__main__":
    asyncio.run(run_collector())
