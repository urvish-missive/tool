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

### BNI Connect browser automation

The default **BNI browser automation → Describe what you need** mode opens `https://www.bniconnectglobal.com/web/dashboard/search`, discovers the login controls, logs in with the supplied credentials, and uses the server's configured AI provider to choose search/filter actions from the live page. Enter a description such as “Find software members in Canada and collect names, companies, chapters and website links.” The assistant inspects the page after each action and derives extraction selectors from the visible results. Results use the existing table and Excel/CSV/JSON exports. No manual navigation steps or CSS selectors are required in description mode.

Description mode requires an existing configured AI provider (`AI_API_KEY`, `GROQ_API_KEY`, or another provider supported by `server/src/utils/aiProvider.js`). Visible page text and a limited structural sample are sent to that provider. Login is handled locally in the runner before planning; credentials are redacted, and input values, hidden fields and scripts are omitted from snapshots. AI actions are limited to observed controls and supported click/fill/select/check/wait operations. Each run supports one filtered search, at most 15 assistant actions, with a 70-second planning budget inside the overall browser time limit. Multi-combination searches remain available in copied-request bulk mode. The assistant can stop on ambiguous or unsupported workflows rather than silently skip requested filters.

Server setup (requires a Node host that supports Chromium, not static frontend hosting):

```bash
cd server
npm install
npx playwright install chromium
# On Linux, install system dependencies if needed:
# npx playwright install --with-deps chromium
npm start
```

**Advanced manual mode** remains available for deterministic workflows or servers without AI. Its login/search/table controls are generic defaults, not verified against an authenticated BNI account. Set the login URL if needed, adjust login controls, add navigation and filter steps in their execution order, and configure a result-row/member-card CSS selector. Controls accept CSS or exact accessible names (`label:Country`, `button:Search`, `link:Next`, `text:Advanced Search`). Native dropdowns use the visible option text; custom dropdowns use ordered Click steps. Each extraction field needs a column name and a CSS selector relative to its result row; `:scope` collects the entire row, and the optional attribute extracts values such as `href`. Set an optional Next control and maximum pages for pagination.

Browser sessions are isolated, credentials are not saved or logged, and browsers close on success or error. Browser mode is limited to BNI HTTPS pages, two concurrent runs, 50 pages, 20,000 rows, and 95 seconds after browser setup. Resource requests receive public-address DNS checks; navigation and non-GET requests must stay on BNI. OTP/CAPTCHA and external identity-provider login are not supported by unattended browser mode; log in yourself and use copied-request modes for those sessions. A real logged-in BNI run is needed to verify the account-specific page controls.

Validation: `npm run test:portal` covers request replay, browser runner and description-agent unit tests; `npm run test:portal-browser` launches Chromium against a sample page to verify login-control discovery, manual/description-driven filters, search, snapshot redaction, field extraction and asynchronous pagination. The description planner is mocked in that integration test. These tests do not verify live AI decisions, BNI login or its authenticated page structure.

Pulls records from any portal you are logged into (e.g. BNI Connect) through the portal's own API.

1. Log in to the portal, open DevTools → **Network** → **Fetch/XHR**, and load the data.
2. Right-click the request that returns the records → **Copy → Copy as cURL** and paste it into the tool.
3. Optionally turn on **Fetch all pages** (page-number or offset parameter, in the query string or JSON/form body).
4. Review the table, hide columns, search, and export to Excel, CSV or JSON.

Server: `server/src/services/portalDataFetcher.js` (cURL parser, SSRF-checked requests, pagination, JSON/HTML-table to rows). Session cookies and tokens are used only for the outgoing request and are never stored or logged. Tests: `cd server && npm run test:portal`, `cd client && node --test test/bulkSearch.test.mjs`.

**Bulk search (filters):** run one search on the portal yourself (e.g. keyword *Telecom* in *South Africa*), copy that request as cURL, and enter the keyword and country you used. The tool finds those values in the request (URL, JSON or form body, any encoding), repeats the search for every keyword x country combination (max 200), and merges the results with de-duplication and "Search: Keyword / Country" columns. A bulk run counts as one use of the device quota (signed batch token, `server/src/utils/batchToken.js`).
