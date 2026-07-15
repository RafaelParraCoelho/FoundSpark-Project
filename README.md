# FoundSpark

A price-tracking platform for Brazilian consumers. FoundSpark monitors prices for consoles, flight tickets, and more — pulling data from Brazilian retailers and marketplaces. All prices are stored and displayed in **BRL (R$)**.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11%2B-blue)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing the Lambda Collector Locally](#testing-the-lambda-collector-locally)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

| Layer      | Technology                                                                                                                                                                                | Version        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| Backend    | [Python](https://www.python.org/downloads/), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/)                                                        | 3.11+ / 0.115.x / 2.0.x |
| Database   | [PostgreSQL](https://www.postgresql.org/) (Docker locally, [AWS RDS](https://aws.amazon.com/rds/) in prod)                                                                               | 16              |
| Collectors | [AWS Lambda](https://aws.amazon.com/lambda/) (container image) + [Amazon EventBridge](https://aws.amazon.com/eventbridge/)                                                              | —               |
| Frontend   | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) (planned)                                                                        | 18.x / 5.x / 5.x |
| Cloud      | [AWS](https://aws.amazon.com/) (EC2, RDS, Lambda, EventBridge) — [free tier](https://aws.amazon.com/free/)                                                                               | —               |
| Local dev  | [Docker Desktop](https://www.docker.com/products/docker-desktop/), [docker-compose](https://docs.docker.com/compose/)                                                                    | Compose v2      |

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
└──────────────┘                              │
                                               ▼
                                    ┌──────────────────┐
                                    │    PostgreSQL     │
                                    └──────────────────┘
```

Collectors run on a schedule (EventBridge → Lambda), fetch prices from Kabum product pages, and write snapshots to PostgreSQL. The FastAPI backend exposes this data to the frontend.

## Getting Started

### Prerequisites

| Tool                                                              | Minimum Version | Notes                          |
| ------------------------------------------------------------------ | ---------------- | -------------------------------- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x (Compose v2) | Must be installed and running    |
| [Git](https://git-scm.com/downloads)                              | 2.x               | —                                 |
| [Python](https://www.python.org/downloads/) *(optional, non-Docker dev)* | 3.11+     | Only needed if running the backend outside Docker |
| [Node.js](https://nodejs.org/) *(optional, frontend dev)*         | 20.x LTS          | Only needed once the frontend is scaffolded |
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

3. **Start the stack**
   ```bash
   docker compose up --build
   ```
   This launches:
   - **PostgreSQL** on port `5432`
   - **FastAPI** on port `8000`
   - **Adminer** (DB admin UI) on port `8080`

4. **Verify it's running**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/db-check
   ```

5. **Stop the stack**
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

## Testing the Lambda Collector Locally

```bash
cd lambda
docker build -t price-collector .

docker run -p 9000:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker \
  -e KABUM_URLS="https://www.kabum.com.br/produto/934759/console-sony-playstation-5" \
  price-collector

curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

## Project Structure

```
FoundSpark/
├── backend/             # FastAPI backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py
├── lambda/              # Price collector (container image)
│   ├── Dockerfile
│   ├── handler.py
│   ├── requirements.txt
│   └── README.md
├── frontend/            # React + TypeScript (planned)
├── docker-compose.yml
├── .env.example
├── AGENTS.md
├── README.md
└── .gitignore
```

## Roadmap

- [x] Local MVP scaffold (Docker, FastAPI, Postgres)
- [x] First collector (Kabum product page scraping → Lambda-ready handler)
- [ ] Additional console retailers (Amazon BR)
- [ ] Flight data source
- [ ] Frontend (React + TypeScript)
- [ ] Deploy to AWS free tier
- [ ] CI/CD pipeline

## Contributing

This is a personal project, but suggestions and pull requests are welcome. If you'd like to contribute:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes with clear messages
4. Open a pull request describing what you changed and why

## License

[MIT](LICENSE)
