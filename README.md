# HappyRobot AI Dashboard

A real-time dashboard for monitoring HappyRobot AI voice agent calls, load searches, and carrier operations.

## Features

- **Dashboard** — Call volume trends, sentiment analysis, call stage progression, and negotiation performance
- **Conversations** — Live table of all call sessions with expandable detail rows (summary, stages reached, negotiated rates)
- **Webcall** — Embedded HappyRobot platform interface for testing the AI agent
- **Webhook Ingestion** — Receives CloudEvents session status updates and post-call analysis summaries
- **REST APIs** — Load search and carrier verification endpoints for HappyRobot agents

## Tech Stack

- Next.js 15 (App Router) + React 19
- PostgreSQL 16 + Prisma 6
- Tailwind CSS + shadcn/ui
- Recharts for data visualization
- Docker for containerization

---

## Quick Start (Local with Docker Compose)

This runs the full stack locally — the Next.js app and a PostgreSQL database.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd happyrobotai

# 2. Create your environment file
cp .env.example .env
# Edit .env and set your API_KEY, WEBCALL_URL, and FMCSA_WEB_KEY

# 3. Start everything
docker compose up --build

# On first start, the app will:
#   - Create database tables
#   - Seed with 56 sample loads
#   - Start the server

# The dashboard is now running at http://localhost:3000
```

To stop:
```bash
docker compose down          # stop containers (data persists)
docker compose down -v       # stop and delete database volume
```

### Webhook Configuration

For HappyRobot webhooks to reach your local instance, you need a public URL. Use a tunnel:

```bash
# Using ngrok (https://ngrok.com)
ngrok http 3000
# This gives you a URL like https://abc123.ngrok.io

# Configure these webhook URLs in HappyRobot:
# Session status:    https://abc123.ngrok.io/api/webhooks/calls
# Post-call summary: https://abc123.ngrok.io/api/webhooks/calls
```

---

## Deploy to Railway

Railway provides managed hosting with automatic deploys from GitHub.

### 1. Push to GitHub

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your repository

### 3. Add a PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically sets the `DATABASE_URL` environment variable

### 4. Set Environment Variables

In the Railway service settings, go to **Variables** and add:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | *(auto-set by Railway Postgres)* | Already configured |
| `API_KEY` | `your-strong-secret-key` | Used to authenticate API requests and post-call webhooks |
| `WEBCALL_URL` | `https://platform.happyrobot.ai/deployments/...` | HappyRobot webcall iframe URL |
| `FMCSA_WEB_KEY` | `your-fmcsa-key` | Optional — for carrier verification |

### 5. Connect the Database to the App

Railway provisions the database as a separate service. You need to link it:

1. Click on the **app service** (your GitHub repo)
2. Go to **Variables** → **Add Reference Variable**
3. Select the PostgreSQL service and choose `DATABASE_URL`
4. This injects the connection string automatically

### 6. Set Health Check Path

In your app service **Settings**, set the **Health Check Path** to `/api/health`. This prevents Railway from restarting the container due to failed health checks.

### 7. Deploy

Railway auto-detects the Dockerfile and builds. On first startup the container will:
1. Run `prisma db push` to create/sync the database tables
2. Run the seed script to populate 56 sample loads
3. Start the Next.js server

Once deployed:

- Your dashboard is live at the Railway-provided URL (e.g., `https://happyrobotai-production.up.railway.app`)
- Configure HappyRobot webhooks to point to `https://<your-railway-url>/api/webhooks/calls`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | Yes | Secret key for API authentication (webhooks, agent endpoints) |
| `WEBCALL_URL` | Yes | HappyRobot webcall iframe URL (differs per environment) |
| `FMCSA_WEB_KEY` | No | FMCSA API key for carrier MC number verification |

---

## Authentication

### API Endpoints

API endpoints require an API key via the `x-api-key` header or `Authorization: ApiKey <key>` header.

```bash
# Example: fetch metrics
curl http://localhost:3000/api/metrics -H "x-api-key: your-api-key"

# Example: search loads
curl "http://localhost:3000/api/v1/loads?origin=Chicago" -H "x-api-key: your-api-key"
```

### Dashboard (Browser)

The dashboard pages (`/`, `/conversations`, `/webcall`) and their data endpoints (`/api/metrics`, `/api/calls`) are publicly accessible — no authentication required.

---

## API Endpoints

### Dashboard APIs (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/metrics` | Aggregated dashboard metrics |
| `GET` | `/api/calls` | All call records |
| `GET` | `/api/webcall-url` | Webcall iframe URL |
| `GET` | `/api/health` | Health check |

### HappyRobot Agent APIs (require `x-api-key` header)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/loads` | Search available loads |
| `GET` | `/api/v1/carrier-verify` | Verify carrier by MC number (FMCSA) |

### Webhooks

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/webhooks/calls` | None (CloudEvents) | Session status updates from HappyRobot |
| `POST` | `/api/webhooks/calls` | `Authorization: ApiKey <key>` | Post-call analysis (summary, sentiment, stages, negotiated rate) |

---

## Build and Run the Docker Image Manually

If you want to build and run the Docker image yourself without Docker Compose:

```bash
# 1. Build the image
docker build -t happyrobotai .

# 2. Start a PostgreSQL container
docker run -d --name happyrobot-db \
  -e POSTGRES_DB=happyrobotai \
  -e POSTGRES_USER=happyrobot \
  -e POSTGRES_PASSWORD=happyrobot \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Run the app container (linked to the Postgres container)
docker run -d --name happyrobotai-app \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://happyrobot:happyrobot@host.docker.internal:5432/happyrobotai \
  -e API_KEY=your-secret-api-key \
  happyrobotai

# The container will automatically:
#   1. Create database tables (prisma db push)
#   2. Seed with sample data (56 loads) if empty
#   3. Start the server

# Dashboard at http://localhost:3000
```

To stop and clean up:
```bash
docker stop happyrobotai-app happyrobot-db
docker rm happyrobotai-app happyrobot-db
```

---

## Local Development (without Docker)

If you prefer running outside of Docker:

```bash
# 1. Start a PostgreSQL instance (e.g., via Docker or local install)
docker run -d --name happyrobot-db \
  -e POSTGRES_DB=happyrobotai \
  -e POSTGRES_USER=happyrobot \
  -e POSTGRES_PASSWORD=happyrobot \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env — make sure DATABASE_URL points to localhost:5432

# 4. Push database schema and seed with sample data
npx prisma db push
npx prisma db seed

# 5. Start dev server
npm run dev
# Dashboard at http://localhost:3000
```

---

## Project Structure

```
├── app/
│   ├── page.tsx                     # Dashboard page
│   ├── conversations/page.tsx       # Conversations list page
│   ├── webcall/page.tsx             # Embedded HappyRobot webcall
│   └── api/
│       ├── metrics/route.ts         # Aggregated metrics endpoint
│       ├── calls/route.ts           # Call records endpoint
│       ├── health/route.ts          # Health check endpoint
│       ├── webcall-url/route.ts     # Webcall URL endpoint
│       ├── webhooks/calls/route.ts  # Webhook ingestion
│       └── v1/
│           ├── loads/route.ts       # Load search for HR agents
│           └── carrier-verify/route.ts  # FMCSA carrier lookup
├── components/
│   ├── sidebar.tsx                  # Navigation sidebar
│   ├── calls-metrics.tsx            # Call metric cards
│   ├── calls-chart.tsx              # Daily calls trend chart
│   ├── call-insights.tsx            # Sentiment, stages, negotiation
│   ├── loads-metrics.tsx            # Load search metrics
│   └── ui/                          # shadcn/ui primitives
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   └── auth.ts                      # API key validation (agent endpoints)
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── seed.ts                      # Database seed script
│   └── seed-data.json               # Sample loads data
├── Dockerfile                       # Multi-stage production build
├── docker-compose.yml               # Local full-stack setup
└── .env.example                     # Environment variable template
```
