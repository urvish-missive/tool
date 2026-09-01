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
