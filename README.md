# FoundSpark

A price-tracking platform for Brazilian consumers. FoundSpark monitors prices for consoles, flight tickets, and more — pulling data from Brazilian retailers and marketplaces. All prices are stored and displayed in **BRL (R$)**.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11%2B-blue)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing Collectors Locally](#testing-collectors-locally)
- [Project Structure](#project-structure)
- [Data Sources](#data-sources)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-source price tracking**: Kabum, Amazon BR, and flight prices
- **Interactive price charts**: Visualize price history over time using Recharts
- **Product comparison**: See prices from different sources side by side
- **Price statistics**: Min, max, average prices with variation tracking
- **Responsive design**: Works on desktop and mobile
- **Real-time updates**: Data refreshes when collectors run

## Tech Stack

<<<<<<< HEAD
| Layer      | Technology                                                                                     | Version              |
| ---------- | ---------------------------------------------------------------------------------------------- | -------------------- |
| Frontend   | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Recharts](https://recharts.org/) | 18.x / 5.x / 5.x / 2.x |
| Backend    | [Python](https://www.python.org/downloads/), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/) | 3.11+ / 0.115.x / 2.0.x |
| Database   | [PostgreSQL](https://www.postgresql.org/) (Docker locally, [AWS RDS](https://aws.amazon.com/rds/) in prod) | 16                   |
| Collectors | [AWS Lambda](https://aws.amazon.com/lambda/) (container image) + [Amazon EventBridge](https://aws.amazon.com/eventbridge/) | —                    |
| Cloud      | [AWS](https://aws.amazon.com/) (EC2, RDS, Lambda, EventBridge) — [free tier](https://aws.amazon.com/free/) | —                    |
| Local dev  | [Docker Desktop](https://www.docker.com/products/docker-desktop/), [docker-compose](https://docs.docker.com/compose/) | Compose v2           |
=======
| Layer      | Technology                                                                                                                                                                                | Version        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| Backend    | [Python](https://www.python.org/downloads/), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/)                                                        | 3.11+ / 0.115.x / 2.0.x |
| Database   | [PostgreSQL](https://www.postgresql.org/) (Docker locally, [AWS RDS](https://aws.amazon.com/rds/) in prod)                                                                               | 16              |
| Collectors | [AWS Lambda](https://aws.amazon.com/lambda/) (container image) + [Amazon EventBridge](https://aws.amazon.com/eventbridge/)                                                              | —               |
| Frontend   | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Recharts](https://recharts.org/)                                             | 18.x / 5.x / 5.x / 2.x |
| Cloud      | [AWS](https://aws.amazon.com/) (EC2, RDS, Lambda, EventBridge) — [free tier](https://aws.amazon.com/free/)                                                                               | —               |
| Local dev  | [Docker Desktop](https://www.docker.com/products/docker-desktop/), [docker-compose](https://docs.docker.com/compose/)                                                                    | Compose v2      |
>>>>>>> 44f1db4705f30de3a6658f5a18809b46a4b4b9ed

> Versions are current targets, not hard requirements — check `requirements.txt` / `package.json` for the exact pinned versions in use.

## Architecture

```
┌──────────────┐     schedule      ┌──────────────────┐
│ EventBridge  │ ────────────────▶ │  Lambda Collector │
└──────────────┘                   │  (container image)│
                                   └─────────┬─────────┘
                                             │ writes
                                             ▼
┌──────────────┐     reads/writes  ┌──────────────────┐
│   Frontend   │ ◀───────────────▶ │  FastAPI Backend  │
│ (React + TS) │       REST        └─────────┬─────────┘
<<<<<<< HEAD
│  :5173       │                             │
└──────────────┘                              ▼
                                   ┌──────────────────┐
                                   │    PostgreSQL     │
                                   │       :5432       │
=======
└──────────────┘                              │
                                              ▼
                                   ┌──────────────────┐
                                   │    PostgreSQL     │
>>>>>>> 44f1db4705f30de3a6658f5a18809b46a4b4b9ed
                                   └──────────────────┘
```

Collectors run on a schedule (EventBridge → Lambda), fetch prices from various Brazilian retailers and flight APIs, and write snapshots to PostgreSQL. The FastAPI backend exposes this data to the frontend via a REST API with CORS configured for the Vite dev server.

**Data Sources:**
- **Kabum**: Scrapes individual product pages using HTTP requests + BeautifulSoup
- **Amazon BR**: Scrapes product pages using Playwright (headless browser) to bypass bot detection
- **Flights**: Calls Kiwi.com Tequila API for flight prices between Brazilian airports

## Getting Started

### Prerequisites

| Tool                                                              | Minimum Version | Notes                          |
| ------------------------------------------------------------------ | ---------------- | -------------------------------- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x (Compose v2) | Must be installed and running    |
| [Git](https://git-scm.com/downloads)                              | 2.x               | —                                 |
<<<<<<< HEAD
| [Node.js](https://nodejs.org/)                                     | 20.x LTS          | Required for frontend             |
| [Python](https://www.python.org/downloads/) *(optional)*           | 3.11+     | Only needed if running the backend outside Docker |
=======
| [Python](https://www.python.org/downloads/) *(optional, non-Docker dev)* | 3.11+     | Only needed if running the backend outside Docker |
| [Node.js](https://nodejs.org/)                                    | 20.x LTS          | Required for frontend dev        |
>>>>>>> 44f1db4705f30de3a6658f5a18809b46a4b4b9ed
| [AWS CLI](https://aws.amazon.com/cli/) *(optional, deployment)*   | 2.x               | Needed for Lambda / RDS deploys  |

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/FoundSpark.git
   cd FoundSpark
   ```

2. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local database credentials if needed. See [Environment Variables](#environment-variables) for a full reference.

3. **Start the backend stack**
   ```bash
   docker compose up --build
   ```
   This launches:
   - **PostgreSQL** on port `5432`
   - **FastAPI** on port `8000`
   - **Adminer** (DB admin UI) on port `8080`

4. **Start the frontend** (in a separate terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   This launches the Vite dev server on port `5173`

5. **Verify it's running**
   - Backend health: `http://localhost:8000/health`
   - Frontend: `http://localhost:5173`
   - Swagger docs: `http://localhost:8000/docs`
   - Adminer (DB UI): `http://localhost:8080`

6. **Stop the stack**
   ```bash
   docker compose down
   ```

## Environment Variables

| Variable       | Description                          | Example                                                    |
| -------------- | ------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string          | `postgresql://postgres:postgres@db:5432/pricetracker`       |
| `POSTGRES_USER`| Local DB username                    | `postgres`                                                   |
| `POSTGRES_PASSWORD` | Local DB password               | `postgres`                                                   |
| `POSTGRES_DB`  | Local DB name                        | `pricetracker`                                               |
| `KABUM_URLS`   | Comma-separated Kabum product page URLs | `https://www.kabum.com.br/produto/934759/console-sony-playstation-5` |
| `AMAZON_URLS`  | Comma-separated Amazon BR product URLs | `https://www.amazon.com.br/dp/B0FY6X2XXY` |
| `KIWI_API_KEY` | Kiwi.com Tequila API key (free at https://tequila.kiwi.com) | — |
| `FLIGHT_ROUTES` | Comma-separated origin-dest pairs | `GRU-REC,GRU-SSA,GRU-FOR` |

> See `.env.example` for the full, up-to-date list.

## API Endpoints

| Method | Path        | Description                  |
| ------ | ----------- | ----------------------------- |
| GET    | `/health`   | Health check                  |
| GET    | `/db-check` | Database connectivity check   |
| GET    | `/products`         | List products with latest price |
| GET    | `/products/{id}/history` | Price history for a product     |

Interactive docs available at `http://localhost:8000/docs` when running.

## Database Schema

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT,
    category TEXT
);

CREATE TABLE price_snapshots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    price_brl NUMERIC(12, 2) NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT now()
);
```

## Testing Collectors Locally

### Kabum collector
```bash
cd lambda
docker build -t price-collector .

docker run -p 9000:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker \
  -e KABUM_URLS="https://www.kabum.com.br/produto/934759/console-sony-playstation-5" \
  price-collector

curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

### Amazon BR collector (requires Playwright)
```bash
cd lambda
docker build -f amazon.Dockerfile -t amazon-collector .

docker run -p 9001:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker \
  -e AMAZON_URLS="https://www.amazon.com.br/dp/B0FY6X2XXY" \
  amazon-collector

curl -XPOST "http://localhost:9001/2015-03-31/functions/function/invocations" -d '{}'
```

### Flight collector (requires Kiwi.com API key)
```bash
cd lambda
docker build -f flight.Dockerfile -t flight-collector .

docker run -p 9002:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker \
  -e KIWI_API_KEY=your_api_key_here \
  -e FLIGHT_ROUTES=GRU-REC,GRU-SSA,GRU-FOR \
  flight-collector

curl -XPOST "http://localhost:9002/2015-03-31/functions/function/invocations" -d '{}'
```

### Verify data in API
```bash
curl http://localhost:8000/products
```

## Project Structure

```
FoundSpark/
├── backend/                 # FastAPI backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py          # API + CORS middleware
├── lambda/                  # Price collectors (container images)
│   ├── Dockerfile           # Kabum collector
│   ├── amazon.Dockerfile    # Amazon BR collector (Playwright)
│   ├── flight.Dockerfile    # Flight collector (Kiwi API)
│   ├── handler.py           # Kabum price collector
│   ├── amazon_handler.py    # Amazon BR price collector
│   ├── flight_handler.py    # Flight price collector
│   ├── requirements.txt
│   ├── requirements-amazon.txt
│   └── README.md
├── frontend/                # React + TypeScript frontend
│   ├── src/
<<<<<<< HEAD
│   │   ├── api.ts           # API client functions (axios)
│   │   ├── App.tsx          # Main app component
│   │   ├── index.css        # Global styles
│   │   └── components/
│   │       ├── ProductList.tsx   # Product grid view
│   │       ├── ProductDetail.tsx # Product detail + history
│   │       └── PriceChart.tsx    # Interactive price chart
│   ├── package.json
│   ├── vite.config.ts       # Vite config + API proxy
│   ├── tsconfig.json
=======
│   │   ├── api.ts           # API client functions
│   │   ├── App.tsx          # Main app component
│   │   ├── App.css          # Global styles + layout
│   │   ├── index.css        # Base styles + reset
│   │   ├── main.tsx         # React entry point
│   │   └── components/
│   │       ├── ProductList.tsx    # Product grid view
│   │       ├── ProductList.css
│   │       ├── ProductDetail.tsx  # Product detail + price history
│   │       ├── ProductDetail.css
│   │       ├── PriceChart.tsx     # Price history chart (Recharts)
│   │       └── PriceChart.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
>>>>>>> 44f1db4705f30de3a6658f5a18809b46a4b4b9ed
│   └── .env.example
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

## Data Sources

| Source    | Method                        | What it tracks       | Requirements                          |
| --------- | ----------------------------- | -------------------- | ------------------------------------- |
| Kabum     | HTTP + BeautifulSoup          | Console prices       | —                                     |
| Amazon BR | Playwright (headless browser) | Console/game prices  | Playwright (~50MB+ Docker image)      |
| Kiwi.com  | REST API                      | Flight prices (BRL)  | Free API key (1,000 req/month limit)  |

## Frontend

The frontend is a single-page React app with:

- **Dark navbar** with sticky positioning
- **Hero section** with call-to-action
- **Stats bar** showing monitored product count, sources, and categories
- **Product grid** with cards displaying source, price, category, and store link
- **Product detail view** with price history chart (Recharts), min/max/avg stats, and recent price table
- **About section** explaining how the platform works
- **Alerts preview** (coming soon)
- **Structured footer** with product links, data sources, and project info

Color palette: warm off-white background (`#fafbfc`), dark sections (`#1a1a1a`), soft orange accent (`#d4752f`).

```bash
# Start frontend dev server
cd frontend
npm install
npm run dev
```

## Roadmap

- [x] Local MVP scaffold (Docker, FastAPI, Postgres)
- [x] First collector (Kabum product page scraping → Lambda-ready handler)
- [x] Amazon BR collector (Playwright headless browser → Lambda-ready handler)
- [x] Flight data source (Kiwi.com Tequila API → Lambda-ready handler)
<<<<<<< HEAD
- [x] Frontend (React + TypeScript) — Product list, price history, charts
- [x] CORS configured for frontend-backend communication
- [ ] Deploy to AWS free tier (EC2 + RDS + Lambda + EventBridge)
- [ ] CI/CD pipeline
- [ ] Public GitHub repo with README
=======
- [x] Frontend (React + TypeScript) — homepage, product grid, detail view, price charts
- [ ] Deploy to AWS free tier (EC2 + RDS + Lambda + EventBridge)
- [ ] CI/CD pipeline
- [ ] Price alerts (email/push notifications)
- [ ] User authentication and saved watches
>>>>>>> 44f1db4705f30de3a6658f5a18809b46a4b4b9ed

## Contributing

This is a personal project, but suggestions and pull requests are welcome. If you'd like to contribute:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes with clear messages
4. Open a pull request describing what you changed and why

## License

[MIT](LICENSE)
