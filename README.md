# FoundSpark

A price-tracking platform for Brazilian consumers. FoundSpark monitors prices for consoles, flight tickets, and more — pulling data from Brazilian retailers and marketplaces. All prices are stored and displayed in **BRL (R$)**.

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Backend      | Python, FastAPI, SQLAlchemy                     |
| Database     | PostgreSQL (Docker locally, AWS RDS in prod)    |
| Collectors   | AWS Lambda (container image) + EventBridge      |
| Frontend     | React + TypeScript, Vite (planned)              |
| Cloud        | AWS (EC2, RDS, Lambda, EventBridge) — free tier |
| Local dev    | Docker Desktop, docker-compose                  |

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

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

   Edit `.env` with your local database credentials if needed.

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

## API Endpoints

| Method | Path        | Description                      |
| ------ | ----------- | -------------------------------- |
| GET    | `/health`   | Health check                     |
| GET    | `/db-check` | Database connectivity check      |
| GET    | `/products` | List tracked products (WIP)      |

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
 \
e SEARCH_TERMS="playstation 5" \
price-collector

curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

## Roadmap

- [x] Local MVP scaffold (Docker, FastAPI, Postgres)
- [x] First collector (Mercado Livre API → Lambda-ready handler)
- [ ] Additional console retailers (Kabum, Amazon BR)
- [ ] Flight data source
- [ ] Frontend (React + TypeScript)
- [ ] Deploy to AWS free tier
- [ ] CI/CD pipeline

## Contributing

This is a personal project. Feel free to fork and experiment.

## License

MIT