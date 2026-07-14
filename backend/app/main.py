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
    # Placeholder until the products table + scraper are wired in.
    return {"products": []}
