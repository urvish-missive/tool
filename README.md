# AI SEO Content Analyzer

A production-ready AI-powered SEO content analysis tool. Analyze your content for SEO, readability, structure, search intent and overall content quality.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** SQLite (Prisma)
- **AI:** OpenAI-compatible API (server-side only)

## Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env and add your AI_API_KEY
```

### 3. Initialize Database

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Run Development

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

Open http://localhost:5173/content-analyzer

## API Endpoints

- `POST /api/content/analyze` — Analyze content
- `POST /api/leads` — Submit lead
- `GET /api/health` — Health check

## Architecture

```
React → POST /api/content/analyze → Express → Programmatic SEO checks → AI service → DB → Response → React
```

AI API keys stay server-side only. Never exposed to the frontend.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| PORT | Server port | 5000 |
| DATABASE_URL | Prisma DB URL | file:./dev.db |
| AI_API_KEY | AI API key | (required for AI analysis) |
| AI_API_URL | AI API endpoint | https://api.openai.com/v1/chat/completions |
| AI_MODEL | Model name | gpt-4o-mini |
| CLIENT_URL | Frontend URL | http://localhost:5173 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 3600000 (1 hour) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 10 |

## Chrome Extension

A Manifest V3 side-panel extension that runs Content QA on the current page lives in [`extension/`](extension/README.md). It reuses `POST /api/content-qa/analyze` and the existing device limits. Build it with `cd extension && npm install && npm run build:extension`, then load `extension/dist-extension` in `chrome://extensions`.

## Portal API Data Fetcher (`/portal-data-fetcher`)

Pulls records from any portal you are logged into (e.g. BNI Connect) through the portal's own API.

1. Log in to the portal, open DevTools → **Network** → **Fetch/XHR**, and load the data.
2. Right-click the request that returns the records → **Copy → Copy as cURL** and paste it into the tool.
3. Optionally turn on **Fetch all pages** (page-number or offset parameter, in the query string or JSON/form body).
4. Review the table, hide columns, search, and export to Excel, CSV or JSON.

Server: `server/src/services/portalDataFetcher.js` (cURL parser, SSRF-checked requests, pagination, JSON/HTML-table to rows). Session cookies and tokens are used only for the outgoing request and are never stored or logged. Tests: `cd server && npm run test:portal`, `cd client && node --test test/bulkSearch.test.mjs`.

**Bulk search (filters):** run one search on the portal yourself (e.g. keyword *Telecom* in *South Africa*), copy that request as cURL, and enter the keyword and country you used. The tool finds those values in the request (URL, JSON or form body, any encoding), repeats the search for every keyword x country combination (max 200), and merges the results with de-duplication and "Search: Keyword / Country" columns. A bulk run counts as one use of the device quota (signed batch token, `server/src/utils/batchToken.js`).
