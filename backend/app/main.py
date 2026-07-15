import os
from datetime import datetime

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/pricetracker")

app = FastAPI(title="FoundSpark API")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/products")
def list_products():
    query = text("""
        SELECT
            p.id,
            p.title,
            p.source,
            p.url,
            p.category,
            latest.price_brl,
            latest.collected_at
        FROM products p
        JOIN LATERAL (
            SELECT price_brl, collected_at
            FROM price_snapshots
            WHERE product_id = p.id
            ORDER BY collected_at DESC
            LIMIT 1
        ) latest ON true
        ORDER BY p.title
    """)

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()

    return {"products": [dict(row) for row in rows]}


@app.get("/products/{product_id}/history")
def product_price_history(product_id: int):
    query = text("""
        SELECT price_brl, collected_at
        FROM price_snapshots
        WHERE product_id = :product_id
        ORDER BY collected_at ASC
    """)

    with engine.connect() as conn:
        rows = conn.execute(
            query,
            {"product_id": product_id}
        ).mappings().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No price history for this product"
        )

    return {
        "product_id": product_id,
        "history": [dict(row) for row in rows]
    }