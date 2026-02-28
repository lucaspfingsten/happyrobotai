# HappyRobot AI — Freight Broker Platform Build Description

## Executive Summary

HappyRobot AI is an intelligent voice agent platform designed for freight brokerages. The system automates inbound carrier calls — verifying carrier credentials, searching available loads, negotiating rates, and transferring calls to human agents when needed. This document describes the technical build delivered for integration with your brokerage operations.

---

## What Was Built

### 1. AI Voice Agent Integration

The platform connects to HappyRobot's conversational AI engine, which handles live phone calls with carriers. During each call, the agent can:

- **Verify carrier credentials** — Checks the carrier's MC (Motor Carrier) number against the FMCSA federal database in real time to confirm the carrier is authorized to operate and not flagged as out of service.
- **Search available loads** — Queries your load board by origin, destination, equipment type, and pickup/delivery dates. Returns up to 3 matching loads to discuss with the carrier.
- **Negotiate rates** — The agent can discuss pricing and negotiate discounts off the posted loadboard rate.
- **Transfer calls** — When the conversation reaches a point requiring human involvement, the agent can transfer the call to a live broker.

### 2. Operations Dashboard

A web-based dashboard provides real-time visibility into call activity and load operations.

**Metrics Overview** (`/`)

- Total calls received, calls today vs. yesterday, average call duration
- 30-day call volume trend chart
- Call outcome breakdown (completed, failed, cancelled)
- Sentiment analysis of calls (positive, neutral, negative)
- Stage completion rates — what percentage of calls reached each milestone (MC verification, load search, offer negotiation, call transfer)
- Negotiation statistics — count, average/min/max negotiated rates
- Load inventory breakdown by equipment type
- Load search activity metrics

**Conversation History** (`/conversations`)

- Full list of all call sessions with expandable detail rows
- Each call shows: status, outcome, sentiment, carrier/organization name, start time, duration
- Expanded view includes: AI-generated call summary, negotiated rate, and stage-by-stage progress indicators
- Color-coded badges for quick visual scanning
- Auto-refreshes every 10 seconds

**Webcall Test Interface** (`/webcall`)

- Embedded browser-based calling interface for testing the AI agent
- Useful for demos, QA, and training — call the agent directly from the dashboard

### 3. API Endpoints for HappyRobot Integration

These endpoints are called by the HappyRobot platform during live calls:


| Endpoint                 | Method | Purpose                                                              |
| ------------------------ | ------ | -------------------------------------------------------------------- |
| `/api/v1/loads`          | GET    | Search available loads by origin, destination, equipment type, dates |
| `/api/v1/carrier-verify` | GET    | Verify carrier eligibility via FMCSA (MC number lookup)              |
| `/api/webhooks/calls`    | POST   | Receive call lifecycle events and post-call summaries                |
| `/api/metrics`           | GET    | Dashboard metrics aggregation                                        |
| `/api/calls`             | GET    | Retrieve call history                                                |
| `/api/health`            | GET    | Health check for uptime monitoring                                   |


### 4. Database

PostgreSQL database with three tables:

- **loads** — Your available freight loads (origin, destination, equipment type, rates, weight, dimensions, commodity type, pickup/delivery dates)
- **calls** — Every call session tracked with status, outcome, duration, carrier name, AI-generated summary, sentiment analysis, negotiated rate, and stage completion flags
- **load_searches** — Audit log of every load search performed during calls (query parameters, result count, timestamp)

The database is seeded with sample loads on first deployment for immediate testing.

---

## Architecture


| Component     | Technology                                          |
| ------------- | --------------------------------------------------- |
| Frontend      | Next.js 15 (React), Tailwind CSS, shadcn/ui         |
| Backend       | Next.js API Routes (Node.js)                        |
| Database      | PostgreSQL                                          |
| ORM           | Prisma                                              |
| Deployment    | Docker container (Railway, or any Docker host)      |
| External APIs | FMCSA (carrier verification), HappyRobot (voice AI) |


The application is packaged as a single Docker container with a multi-stage build. Database migrations run automatically on startup.

---

## Security

- **API Authentication** — All API endpoints require an API key via `x-api-key` header or `Authorization: ApiKey <key>` header
- **Dashboard Authentication** — Optional HTTP Basic Auth (username: `admin`, configurable password)
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy
- **Input Validation** — All user inputs are sanitized and length-limited
- **Timing-Safe Comparisons** — API key and password validation use constant-time comparison to prevent timing attacks
- **Webhook Security** — Post-call summary webhooks require API key authentication; session status webhooks are validated by structure

---

## Environment Configuration


| Variable             | Required | Description                                                        |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                                       |
| `API_KEY`            | Yes      | Shared secret for API authentication (used by HappyRobot platform) |
| `DASHBOARD_PASSWORD` | No       | Password for dashboard Basic Auth (omit to disable auth)           |
| `WEBCALL_URL`        | No       | URL for the embedded webcall test interface                        |
| `FMCSA_WEB_KEY`      | Yes      | API key for FMCSA carrier verification service                     |


---

## Deployment

The application is deployed via Docker. A single command brings up the entire stack:

```bash
docker compose up --build
```

For production (e.g., Railway):

1. Connect the GitHub repository
2. Set environment variables in the platform dashboard
3. Set the health check path to `/api/health`
4. Deploy — database migrations and seeding run automatically on startup

---

## How It Works End-to-End

1. A carrier calls your HappyRobot AI phone number
2. The HappyRobot voice agent answers and begins the conversation
3. The agent sends a **session status webhook** to your platform → a new call record is created
4. During the call, the agent calls your **carrier-verify API** to check the carrier's MC number against FMCSA
5. The agent calls your **load search API** to find matching loads based on the carrier's criteria
6. The agent negotiates rates and may transfer the call to a human broker
7. When the call ends, HappyRobot sends a **post-call summary webhook** with the AI-generated summary, sentiment, negotiated rate, and stages completed
8. All data appears in real time on the **operations dashboard** for your team to review

---

## Deliverables

- Full source code (GitHub repository)
- Docker container configuration (Dockerfile + docker-compose.yml)
- Database schema with migrations
- Sample load data for testing
- API documentation (this document)
- README with setup instructions

