"""
Flight price collector using Kiwi.com Tequila API.

Tracks flight prices between Brazilian airports on a curated list of routes.
All prices are in BRL (R$).

Usage:
  Set KIWI_API_KEY env var with your Tequila API key (free at https://tequila.kiwi.com).
  Set DATABASE_URL env var with PostgreSQL connection string.
  Optional: Set FLIGHT_ROUTES env var with comma-separated origin-destination pairs.
           Default: GRU-REC, GRU-SSA, GRU-FOR, GRU-NAT, GIG-REC, CGH-REC
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional

import psycopg2
import requests

DATABASE_URL = os.environ["DATABASE_URL"]
KIWI_API_KEY = os.environ.get("KIWI_API_KEY", "")

TEQUILA_SEARCH_URL = "https://tequila-api.kiwi.com/v2/search"

# Default Brazilian routes to monitor (origin-destination pairs)
DEFAULT_ROUTES = [
    ("GRU", "REC"),  # São Paulo -> Recife
    ("GRU", "SSA"),  # São Paulo -> Salvador
    ("GRU", "FOR"),  # São Paulo -> Fortaleza
    ("GRU", "NAT"),  # São Paulo -> Natal
    ("GIG", "REC"),  # Rio -> Recife
    ("CGH", "REC"),  # São Paulo Congonhas -> Recife
]

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


def parse_routes() -> list[tuple[str, str]]:
    """Parse FLIGHT_ROTS env var or use defaults."""
    routes_str = os.environ.get("FLIGHT_ROUTES", "")
    if routes_str:
        routes = []
        for r in routes_str.split(","):
            parts = r.strip().upper().split("-")
            if len(parts) == 2:
                routes.append((parts[0], parts[1]))
        return routes if routes else DEFAULT_ROUTES
    return DEFAULT_ROUTES


def search_flights(origin: str, destination: str) -> list[dict]:
    """Search Kiwi.com Tequila API for flights."""
    if not KIWI_API_KEY:
        print("WARNING: KIWI_API_KEY not set — API calls will fail.")
        return []

    # Search for flights in the next 30 days
    date_from = datetime.now().strftime("%d/%m/%Y")
    date_to = (datetime.now() + timedelta(days=30)).strftime("%d/%m/%Y")

    params = {
        "fly_from": origin,
        "fly_to": destination,
        "date_from": date_from,
        "date_to": date_to,
        "nights_in_dst_from": 0,
        "nights_in_dst_to": 14,
        "flight_type": "round",
        "adults": 1,
        "curr": "BRL",
        "locale": "pt",
        "limit": 5,
        "sort": "price",
        "max_stopovers": 1,
    }

    headers = {"apikey": KIWI_API_KEY}

    try:
        resp = requests.get(TEQUILA_SEARCH_URL, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except requests.exceptions.RequestException as exc:
        print(f"API error for {origin}-{destination}: {exc}")
        return []


def format_flight_title(flight: dict, origin: str, destination: str) -> str:
    """Create a human-readable title for a flight."""
    airline = flight.get("airlines", ["Unknown"])[0]
    departure = flight.get("local_departure", "")[:10]
    stops = flight.get("route", [])
    stops_count = len(stops) - 1 if stops else 0
    stop_text = "direto" if stops_count == 0 else f"{stops_count} escala"

    return f"Voo {origin}-{destination} | {airline} | {departure} | {stop_text}"


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
            (external_id, title, "kiwi_tequila", url, category),
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
    """AWS Lambda entry point."""
    if not KIWI_API_KEY:
        print("No KIWI_API_KEY configured — nothing to do.")
        return {"statusCode": 200, "saved": 0}

    routes = parse_routes()
    conn = get_connection()
    total_saved = 0

    try:
        ensure_schema(conn)

        for origin, destination in routes:
            print(f"Searching flights: {origin} -> {destination}")
            flights = search_flights(origin, destination)

            for flight in flights:
                try:
                    price = flight.get("price", 0)
                    if price <= 0:
                        continue

                    external_id = f"kiwi-{origin}-{destination}-{flight.get('booking_token', '')[:16]}"
                    title = format_flight_title(flight, origin, destination)
                    deep_link = flight.get("deep_link", "")

                    upsert_snapshot(
                        conn,
                        external_id,
                        title,
                        float(price),
                        deep_link,
                        category="flight",
                    )
                    total_saved += 1
                except Exception as exc:
                    print(f"Error processing flight: {exc}")
                    continue
    finally:
        conn.close()

    print(f"Saved {total_saved} flight price snapshots")
    return {"statusCode": 200, "saved": total_saved}


if __name__ == "__main__":
    # For local testing
    lambda_handler(None, None)
