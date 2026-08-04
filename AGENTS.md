# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, etc.) working on this repository. Read this before making changes.

## Project

**FoundSpark** is a price-tracking site for Brazilian consumers. It tracks prices for consoles, flight tickets, and (later) other categories, pulling data from Brazilian retailers and marketplaces. All prices are stored and displayed in BRL (R$) — never convert or display in another currency.

## Current phase

Building the local MVP: Kabum collector is working, Amazon BR and flight collectors are implemented. Frontend is next. See "Roadmap" below for what comes next — don't jump ahead to later phases unless asked.

## Stack

- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL (local: Docker container; production: AWS RDS free tier)
- **Collectors**: AWS Lambda (container image), triggered on a schedule by EventBridge — not cron jobs on the API server
- **Frontend**: React + TypeScript, Vite (not yet built)
- **Cloud**: AWS (EC2 for the API, RDS for the database, Lambda + EventBridge for collectors), all within free-tier limits
- **Local dev**: Docker Desktop, docker-compose

## Repo layout

```
FoundSpark-Project/
├── docker-compose.yml       # local dev: db + api + adminer
├── .env.example             # copy to .env, never commit .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py          # FastAPI app
└── lambda/
    ├── Dockerfile            # Kabum collector (container image)
    ├── amazon.Dockerfile     # Amazon BR collector (Playwright)
    ├── flight.Dockerfile     # Flight collector (Kiwi.com API)
    ├── handler.py            # Kabum price collector
    ├── amazon_handler.py     # Amazon BR price collector
    ├── flight_handler.py     # Flight price collector
    ├── requirements.txt
    ├── requirements-amazon.txt
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

Both `backend/app` and all `lambda/*.py` handlers read/write this schema. If you change one, update the others and this file.

## Conventions

- Prices are always `NUMERIC` in BRL, column name `price_brl` — never float, never another currency.
- Every collected item records its `source` so we know which site/API it came from.
- Secrets and connection strings live in environment variables only (`.env` locally, Lambda/EC2 env vars in prod). Never hard-code credentials, never commit `.env`.
New scrapers go in `lambda/` as separate handler files (e.g., `handler.py`, `amazon_handler.py`, `flight_handler.py`) — don't cram unrelated sources into one function once it grows.
- Respect each source's `robots.txt` and rate limits. Don't add aggressive polling (this is a personal project checked a few times a day, not a real-time feed).
- Keep Python functions small and typed (type hints expected on new functions).

## Commands

```bash
# local dev — API + Postgres + Adminer
docker compose up --build

# check it's alive
curl http://localhost:8000/health
curl http://localhost:8000/db-check

# test Kabum collector locally
cd lambda
docker build -t price-collector .
docker run -p 9000:8080 -e DATABASE_URL=... -e KABUM_URLS="https://www.kabum.com.br/produto/934759" price-collector
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'

# test Amazon BR collector
docker build -f amazon.Dockerfile -t amazon-collector .
docker run -p 9001:8080 -e DATABASE_URL=... -e AMAZON_URLS="https://www.amazon.com.br/dp/B0DFMJQ7VH" amazon-collector

# test flight collector
docker build -f flight.Dockerfile -t flight-collector .
docker run -p 9002:8080 -e DATABASE_URL=... -e KIWI_API_KEY=... -e FLIGHT_ROUTES="GRU-REC" flight-collector
```

## Roadmap

- [x] Local MVP scaffold (Docker, FastAPI, Postgres)
- [x] First collector (Kabum product page scraping → Lambda-ready handler)
- [x] Amazon BR collector (Playwright headless browser → Lambda-ready handler)
- [x] Flight data source (Kiwi.com Tequila API → Lambda-ready handler)
- [ ] Frontend (React + TS): search, filters, price-history chart
- [ ] Deploy to AWS free tier (EC2 + RDS + Lambda + EventBridge), with a billing alarm
- [ ] Public GitHub repo with README + CI

## Known platform restrictions

- **Mercado Livre is currently not used as a data source.** All of these were tried and ruled out: `/sites/MLB/search` returns 403 to third-party apps (confirmed broadly since early 2026); `lista.mercadolivre.com.br` search pages disallow automated access via `robots.txt`; and as of mid-2026, even the previously-public `/items/{id}` endpoint now returns `PA_UNAUTHORIZED_RESULT_FROM_POLICIES` without an OAuth access token. Getting a token requires registering a developer app, which is more overhead than this MVP needs right now. Revisit if/when that changes.
- **Current source: Kabum product pages.** Kabum's `robots.txt` disallows search (`/busca/*?`), cart, login, and account pages, but does **not** disallow individual product pages (`/produto/{id}/...`). The collector (`lambda/handler.py`) scrapes a curated list of product URLs (`KABUM_URLS` env var) — never search results. It first tries the page's JSON-LD structured data (`<script type="application/ld+json">`, `@type: Product`) since that's more stable than scraping visual markup, and falls back to a regex over visible `R$` prices if JSON-LD isn't present.
- Product IDs/URLs are found by browsing the site normally (not scraping) and copying the URL — this is how every source in this project should be curated.

## Open decisions

- Whether scraped sites need headless-browser rendering (Playwright) vs. plain HTML parsing (BeautifulSoup) is being evaluated per-site — and each site's `robots.txt` needs to be checked before scraping it, the same way Mercado Livre's search pages turned out to be off-limits.
- Amazon BR collector requires Playwright (~50MB+ image). Test locally before deploying to Lambda.
- Kiwi.com Tequila API free tier: 1,000 requests/month. Monitor usage.

When in doubt about a decision above, ask rather than assume.

# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `ponytail:` comment naming the ceiling and upgrade path.

Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

(Yes, this file also applies to agents working on the ponytail repo itself. Especially to them.)

