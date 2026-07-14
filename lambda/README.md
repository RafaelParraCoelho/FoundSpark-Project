# Price collector (Lambda)

Runs on a schedule, pulls prices from Mercado Livre, writes them to Postgres. No server involved — your computer is not part of this once deployed.

## Test locally first

```bash
docker build -t price-collector .
docker run -p 9000:8080 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/pricetracker" \
  -e SEARCH_TERMS="playstation 5,xbox series x,nintendo switch 2" \
  price-collector

# in another terminal
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

## Deploy to AWS

1. Create an ECR repository and push the image:
   ```bash
   aws ecr create-repository --repository-name price-collector
   aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker tag price-collector:latest <account-id>.dkr.ecr.<region>.amazonaws.com/price-collector:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/price-collector:latest
   ```
2. Create the Lambda function from that container image (console: Lambda → Create function → Container image).
3. Set environment variables: `DATABASE_URL`, `SEARCH_TERMS`.
4. If your RDS instance is in a VPC (default), attach the Lambda to the same VPC + security group, and allow that security group to reach RDS on port 5432.
5. Set a reasonable timeout (30-60s is usually enough for a handful of search terms) and memory (128-256MB is plenty).
6. Create an EventBridge rule with a schedule expression, e.g. `rate(6 hours)`, targeting this Lambda.

That's it — from then on, AWS runs it, your machine and your EC2 instance are both uninvolved.
