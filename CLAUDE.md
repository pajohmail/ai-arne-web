# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This monorepo contains two independent sub-projects:

```
ai-arne-web/
├── src/           # React + TypeScript frontend (Vite)
├── api/           # PHP proxy endpoints (server-side, hides Firestore API keys)
├── public/        # Static assets (config.json, aiarne.png)
├── cloud/         # Google Cloud Functions agents (TypeScript/Node.js)
└── index.html
```

## Frontend (React + Vite)

### Commands

```bash
npm i               # Install dependencies
npm run dev         # Start Vite dev server at http://localhost:5173
npm run build       # Type-check + build to dist/
npm run preview     # Preview production build
```

### Local Development Setup

1. Copy `api/config.php.example` to `api/config.php` and fill in `FIRESTORE_PROJECT_ID` and `FIRESTORE_API_KEY`.
2. Create `public/config.json`:
   ```json
   { "publicBaseUrl": "http://localhost:5173" }
   ```
3. Start PHP server for API: `php -S localhost:8000`
4. Start Vite dev server: `npm run dev`
5. React app calls PHP endpoints on `http://localhost:8000/api/`.

### Architecture

- **Router**: `HashRouter` (no server rewrites needed; URLs like `/#/posts`)
- **Code splitting**: All routes are `React.lazy()` in `src/main.tsx`
- **Config**: Runtime config loaded from `/config.json` into `window.__APP_CONFIG__` before render
- **Data layer**: `src/lib/firestore.ts` — all Firestore reads go through PHP proxy endpoints via `queryCollection()`. Returns normalized objects directly (no Firestore SDK on the client).
- **In-memory cache**: `src/lib/fetch.ts` — `getJsonCached()` caches API responses for 1 minute per session
- **HTML sanitization**: DOMPurify used for all `dangerouslySetInnerHTML` content

### PHP API Endpoints

All return `{ success: true, data: ... }` or `{ success: false, error: ... }`.

| Endpoint | Params |
|---|---|
| `GET /api/posts.php` | `limit`, `offset` |
| `GET /api/post.php` | `slug` |
| `GET /api/news.php` | `limit`, `offset` |
| `GET /api/news-item.php` | `slug` |
| `GET /api/tutorials.php` | `limit`, `offset` |
| `GET /api/tutorial.php` | `postId` or `id` |
| `GET /api/user-questions.php` | `limit` |
| `POST /api/chat.php` | JSON body: `{ question, sessionId }` |

## Cloud Agents (cloud/)

### Commands

```bash
cd cloud
npm install
npm run build          # Compile TypeScript
npm run test:local     # Test without Firestore
npm run test:firestore # Test with real Firestore (requires credentials)
```

### Architecture

Cloud Functions deployed on Google Cloud (Node.js 22, `europe-north1`). The single entry point `managerHandler` runs all agents in parallel.

**Agents:**
- `newsAgent.ts` — Monitors Anthropic/OpenAI/Google AI GitHub releases for API news
- `generalNewsAgent.ts` — Fetches weekly AI news via OpenAI Responses API with web search (GPT-5 + `web_search_preview`)
- `tutorialAgent.ts` — Generates tutorials for API news posts

**Key services:**
- `src/services/responses.ts` — OpenAI Responses API client (primary). **Important**: Responses API does NOT support `temperature`; use `text.verbosity` instead. Status is `'completed'` not `'complete'`. Falls back to Chat Completions API (GPT-4.1) if needed.
- `src/services/firestore.ts` — Firestore writes via Application Default Credentials (ADC); no explicit key needed in Cloud Functions
- `src/services/linkedin.ts` — LinkedIn Business Page API via `LINKEDIN_ACCESS_TOKEN`
- `src/services/upsert.ts` — Deduplication + write logic for posts/news/tutorials

### Environment Variables (cloud/.env)

```
GOOGLE_CLOUD_PROJECT=ai-arne-agents
PUBLIC_BASE_URL=https://ai-arne.se
OPENAI_API_KEY=sk-proj-...
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_ORG_URN=urn:li:organization:...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json  # local dev only
```

### Firestore Data Model

- `posts`: `{ slug, title, excerpt, content(html), provider, sourceUrl, linkedinUrn, createdAt, updatedAt }`
- `news`: `{ slug, title, excerpt, content(html), sourceUrl, source, linkedinUrn, createdAt, updatedAt }`
- `tutorials`: `{ postId, title, content(html), sourceUrl, createdAt, updatedAt }`
- `errorLogs`: `{ timestamp, context, message, stack, metadata, severity }`

## Deployment

**Frontend:** `npm run build` → upload `dist/` + `api/` to shared PHP hosting via FTP.

**Cloud Functions:** Deploy via `gcloud functions deploy managerHandler` with `--timeout=802s`. See `cloud/README.md` for full deploy commands.
