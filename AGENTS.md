# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, etc.) working on this repository. Read this before making changes.

## Project

**FoundSpark** is a price-tracking site for Brazilian consumers. It tracks prices for consoles, flight tickets, and (later) other categories, pulling data from Brazilian retailers and marketplaces. All prices are stored and displayed in BRL (R$) — never convert or display in another currency.

## Current phase

Building the local MVP: one working pipeline (Mercado Livre API → Postgres → FastAPI), before adding more scrapers or the frontend. See "Roadmap" below for what comes next — don't jump ahead to later phases unless asked.

## Stack

- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL (local: Docker container; production: AWS RDS free tier)
- **Collectors**: AWS Lambda (container image), triggered on a schedule by EventBridge — not cron jobs on the API server
- **Frontend**: React + TypeScript, Vite (not yet built)
- **Cloud**: AWS (EC2 for the API, RDS for the database, Lambda + EventBridge for collectors), all within free-tier limits
- **Local dev**: Docker Desktop, docker-compose

## Repo layout

```
price-tracker/
├── docker-compose.yml       # local dev: db + api + adminer
├── .env.example             # copy to .env, never commit .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py          # FastAPI app
└── lambda/
    ├── Dockerfile            # Lambda container image
    ├── handler.py            # scheduled price collector
    ├── requirements.txt
    └── README.md             # deploy steps
```

## Database schema (source of truth — keep backend and lambda in sync with this)

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,       -- e.g. 'mercado_livre', 'kabum'
    url TEXT,
    category TEXT               -- e.g. 'playstation 5', 'flight'
);

CREATE TABLE price_snapshots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    price_brl NUMERIC(12, 2) NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT now()
);
```

Both `backend/app` and `lambda/handler.py` read/write this schema. If you change one, update the other and this file.

## Conventions

- Prices are always `NUMERIC` in BRL, column name `price_brl` — never float, never another currency.
- Every collected item records its `source` so we know which site/API it came from.
- Secrets and connection strings live in environment variables only (`.env` locally, Lambda/EC2 env vars in prod). Never hard-code credentials, never commit `.env`.
- New scrapers go in `lambda/` as separate handler files if they get complex enough to warrant it — don't cram unrelated sources into one function once it grows.
- Respect each source's `robots.txt` and rate limits. Don't add aggressive polling (this is a personal project checked a few times a day, not a real-time feed).
- Keep Python functions small and typed (type hints expected on new functions).

## Commands

```bash
# local dev — API + Postgres + Adminer
docker compose up --build

# check it's alive
curl http://localhost:8000/health
curl http://localhost:8000/db-check

# test the Lambda collector locally before deploying
cd lambda
docker build -t price-collector .
docker run -p 9000:8080 -e DATABASE_URL=... -e SEARCH_TERMS="playstation 5" price-collector
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

## Roadmap

- [x] Local MVP scaffold (Docker, FastAPI, Postgres)
- [x] First collector (Mercado Livre API → Lambda-ready handler)
- [ ] Additional console retailers (scraping — Kabum, Amazon BR)
- [ ] Flight data source (Amadeus self-service is being decommissioned July 2026 — need an alternative: scraping or another API)
- [ ] Frontend (React + TS): search, filters, price-history chart
- [ ] Deploy to AWS free tier (EC2 + RDS + Lambda + EventBridge), with a billing alarm
- [ ] Public GitHub repo with README + CI

## Known platform restrictions

- **Mercado Livre is currently not used as a data source.** All of these were tried and ruled out: `/sites/MLB/search` returns 403 to third-party apps (confirmed broadly since early 2026); `lista.mercadolivre.com.br` search pages disallow automated access via `robots.txt`; and as of mid-2026, even the previously-public `/items/{id}` endpoint now returns `PA_UNAUTHORIZED_RESULT_FROM_POLICIES` without an OAuth access token. Getting a token requires registering a developer app, which is more overhead than this MVP needs right now. Revisit if/when that changes.
- **Current source: Kabum product pages.** Kabum's `robots.txt` disallows search (`/busca/*?`), cart, login, and account pages, but does **not** disallow individual product pages (`/produto/{id}/...`). The collector (`lambda/handler.py`) scrapes a curated list of product URLs (`KABUM_URLS` env var) — never search results. It first tries the page's JSON-LD structured data (`<script type="application/ld+json">`, `@type: Product`) since that's more stable than scraping visual markup, and falls back to a regex over visible `R$` prices if JSON-LD isn't present.
- Product IDs/URLs are found by browsing the site normally (not scraping) and copying the URL — this is how every source in this project should be curated.

## Open decisions

- Flight data source not finalized.
- Whether scraped sites need headless-browser rendering (Playwright) vs. plain HTML parsing (BeautifulSoup) is being evaluated per-site — and each site's `robots.txt` needs to be checked before scraping it, the same way Mercado Livre's search pages turned out to be off-limits.

When in doubt about a decision above, ask rather than assume.
