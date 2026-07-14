import os
import requests
import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]  # e.g. postgresql://user:pass@your-rds-endpoint:5432/pricetracker
SEARCH_TERMS = os.environ.get("SEARCH_TERMS", "playstation 5,xbox series x").split(",")
SITE_ID = os.environ.get("ML_SITE_ID", "MLB")  # MLB = Mercado Livre Brasil

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


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()


def search_mercado_livre(query: str, limit: int = 20):
    url = f"https://api.mercadolibre.com/sites/{SITE_ID}/search"
    resp = requests.get(url, params={"q": query, "limit": limit}, timeout=10)
    resp.raise_for_status()
    return resp.json().get("results", [])


def upsert_snapshot(conn, item: dict, category: str):
    external_id = item["id"]
    title = item["title"]
    price = item["price"]
    permalink = item.get("permalink")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO products (external_id, title, source, url, category)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (external_id) DO UPDATE
                SET title = EXCLUDED.title, url = EXCLUDED.url
            RETURNING id
            """,
            (external_id, title, "mercado_livre", permalink, category),
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
    conn = get_connection()
    total_saved = 0
    try:
        ensure_schema(conn)
        for term in SEARCH_TERMS:
            term = term.strip()
            if not term:
                continue
            print(f"Searching Mercado Livre for: {term}")
            items = search_mercado_livre(term)
            for item in items:
                upsert_snapshot(conn, item, category=term)
                total_saved += 1
    finally:
        conn.close()

    print(f"Saved {total_saved} price snapshots")
    return {"statusCode": 200, "saved": total_saved}
