# Price collectors (Lambda)

Each collector runs independently as a separate Lambda function. They all write to the same PostgreSQL database.

## Available Collectors

| Collector | Source | Data Type | Method |
|-----------|--------|-----------|--------|
| `handler.py` | Kabum | Console prices | HTTP + BeautifulSoup |
| `amazon_handler.py` | Amazon BR | Console prices | Playwright (headless browser) |
| `flight_handler.py` | Kiwi.com Tequila | Flight prices | REST API |

## Test locally

### Kabum collector (already working)
```bash
docker build -t price-collector .
docker run -p 9000:8080 -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker -e KABUM_URLS="https://www.kabum.com.br/produto/934759/console-sony-playstation-5" price-collector
```

### Amazon BR collector (requires Playwright)
```bash
cd lambda
docker build -f amazon.Dockerfile -t amazon-collector .
docker run -p 9000:8080 -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker -e AMAZON_URLS="https://www.amazon.com.br/dp/B0DFMJQ7VH" amazon-collector
```

### Flight collector (requires Kiwi.com API key)
```bash
cd lambda
docker build -f flight.Dockerfile -t flight-collector .
docker run -p 9000:8080 -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/pricetracker -e KIWI_API_KEY=your_api_key_here -e FLIGHT_ROUTES=GRU-REC,GRU-SSA,GRU-FOR flight-collector
```

### Invoke any collector
```bash
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d "{}"
```

## Deploy to AWS

1. Create an ECR repository per collector:
   ```bash
   aws ecr create-repository --repository-name price-collector
   aws ecr create-repository --repository-name amazon-collector
   aws ecr create-repository --repository-name flight-collector
   ```

2. Push each image:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker tag price-collector:latest <account-id>.dkr.ecr.<region>.amazonaws.com/price-collector:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/price-collector:latest
   ```

3. Create Lambda functions from container images (console: Lambda → Create function → Container image).

4. Set environment variables for each:
   - `DATABASE_URL`
   - `KABUM_URLS` (for Kabum collector)
   - `AMAZON_URLS` (for Amazon collector)
   - `KIWI_API_KEY`, `FLIGHT_ROUTES` (for flight collector)

5. If RDS is in a VPC, attach Lambda to the same VPC + security group.

6. Set timeouts:
   - Kabum/Flight: 30-60 seconds
   - Amazon: 120+ seconds (Playwright is slower)

7. Create EventBridge rules:
   - Kabum: `rate(6 hours)`
   - Amazon: `rate(12 hours)` (slower, more cautious)
   - Flights: `rate(12 hours)`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `KABUM_URLS` | Comma-separated Kabum product URLs | Kabum collector |
| `AMAZON_URLS` | Comma-separated Amazon product URLs | Amazon collector |
| `KIWI_API_KEY` | Kiwi.com Tequila API key (free at https://tequila.kiwi.com) | Flight collector |
| `FLIGHT_ROUTES` | Comma-separated origin-dest pairs (e.g., `GRU-REC,GRU-SSA`) | Flight collector |
