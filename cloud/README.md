# AI-Arne Cloud Agentsystem

Ett agentsystem som körs på Google Cloud Functions och övervakar AI-API:er från stora leverantörer. Använder Firestore som databas och producerar innehåll som webbplatsen läser direkt från Firestore.

**AI-implementation:** Använder OpenAI:s Responses API (beta) som primär provider med fallback till Anthropic API för robusthet.

## Arkitektur

```
Cloud Scheduler (varannan vecka)
    ↓
Cloud Functions (Node.js agenter)
    ↓
Firestore (NoSQL databas, gratis tier)
    ↓
Webbplats (läser direkt från Firestore via REST API)
```

## Funktioner

- **API-nyhetsagent**: Övervakar API-nyheter från Anthropic, OpenAI och Google AI
- **RSS-nyhetsagent**: Hämtar allmänna AI-nyheter från RSS-feeds med fokus på utveckling
  - Använder OpenAI Responses API för AI-baserad sammanfattning och filtrering
  - Fallback till Anthropic API om OpenAI saknas
- **Tutorial-agent**: Skapar AI-genererade tutorials för API-nyheter via Responses API
  - Använder OpenAI Responses API för att generera tutorial-innehåll
  - Fallback till statisk HTML om API-nycklar saknas
- **Chat-handler**: Hanterar användarfrågor om AI-nyheter via interaktiv chat
  - Använder OpenAI Responses API för att generera underhållande svar med ironi
  - Fallback till Anthropic API om OpenAI saknas
  - Sparar frågor i Firestore `user_questions` collection (inte svaren - de körs igen)
  - Filtrerar så endast AI-relaterade frågor accepteras
- **LinkedIn-integration**: Uppdaterar företagsprofil automatiskt

## Responses API och Minneshantering

Systemet använder OpenAI:s Responses API för tillståndsbevarande konversationer:

- **State Management**: Responses API stödjer conversation_id för att hålla state mellan anrop
- **Fallback-mekanism**: Automatisk fallback till Anthropic API om OpenAI API-nyckel saknas eller misslyckas
- **Context Management**: `createResponseWithContext` helper-funktion för att hantera konversationshistorik
- **Minneshantering**: Varje konversation får ett unikt conversation_id som kan sparas i Firestore för framtida referens

Implementationen finns i `src/services/responses.ts` och används av:
- `generalNewsAgent.ts` - För sammanfattning av RSS-nyheter
- `tutorialAgent.ts` - För generering av tutorial-innehåll
- `index.ts` (chatHandler) - För interaktiv chat om AI-nyheter

## Installation

```bash
cd /home/paj/Dev/ai-arne_cloud
npm install
npm run build
```

## Miljövariabler

Kopiera `env.example` till `.env` och fyll i:

```bash
cp env.example .env
```

### Cloud Functions (.env)
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
PUBLIC_BASE_URL=https://ai-arne.se
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_ORG_URN=urn:li:organization:...
RSS_FEEDS=https://feeds.feedburner.com/oreilly/radar,https://techcrunch.com/feed/
ANTHROPIC_API_KEY=sk-ant-...
```

## Autentisering

### Google Cloud-tjänster (Application Default Credentials)

**Hur det fungerar:**
- När du deployar med `gcloud` använder det dina inloggade Google-credentials
- Cloud Functions använder automatiskt **Application Default Credentials (ADC)**
- Ingen explicit API-nyckel behövs för Google-tjänster

**Tjänster som använder ADC:**
- ✅ **Firestore** - Automatisk autentisering via ADC
- ✅ **Cloud Functions** - Automatisk service account
- ✅ **Cloud Logging** - Automatisk logging
- ✅ **Cloud Monitoring** - Automatisk monitoring

**Synergier:**
- En autentisering (din Google-inloggning) för alla Google-tjänster
- Inga manuella API-nycklar behövs för Google-tjänster
- Automatisk hantering via Cloud Functions service account

**Implementation:**
```typescript
// Firestore använder automatiskt ADC - ingen explicit konfiguration behövs
firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT!,
  // Använder default credentials från Cloud Functions
});
```

### Externa API:er (API-nycklar och tokens)

**AI Providers:**
- **OpenAI Responses API** - API-nyckel från miljövariabel `OPENAI_API_KEY`
  - Primär AI-provider för Responses API (beta)
  - Används för AI-baserad filtrering, sammanfattning av RSS-nyheter och tutorial-generering
  - Tillståndsbevarande konversationer med state management
- **Anthropic API** - API-nyckel från miljövariabel `ANTHROPIC_API_KEY`
  - Fallback om OpenAI API-nyckel saknas eller misslyckas
  - Används för AI-baserad filtrering och sammanfattning av RSS-nyheter
- **Google AI/Gemini** - Används inte direkt (endast publika GitHub API-anrop för releases)

**LinkedIn API:**
- **LinkedIn Business Page** - AI-Arne har redan en business-sida som är konfigurerad
- Business-sidan har tillgång till LinkedIn API via OAuth
- Access token lagras i miljövariabel `LINKEDIN_ACCESS_TOKEN`
- Organisation URN lagras i miljövariabel `LINKEDIN_ORG_URN`

**Viktigt:**
- Dessa API:er använder **INTE** Google Cloud-autentisering
- Varje provider har sin egen autentiseringsmetod (API-nyckel/OAuth)
- LinkedIn business-sidan är redan konfigurerad och har tillgång till API

**Implementation:**
```typescript
// OpenAI Responses API - Primär provider med fallback till Anthropic
import { createResponse } from './services/responses.js';

const response = await createResponse(prompt, {
  model: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.7
});

// Responses API försöker först med OpenAI, fallback till Anthropic automatiskt
// response.provider visar vilken provider som användes ('openai' eller 'anthropic')

// LinkedIn API - Access token från miljövariabel
// Business-sidan har redan tillgång till LinkedIn API
await postToLinkedIn(args, process.env.LINKEDIN_ACCESS_TOKEN!);
```

### Lokal utveckling (Firestore)

För lokal utveckling behöver du sätta `GOOGLE_APPLICATION_CREDENTIALS`:
```
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
```

Skapa en service account i Google Cloud Console med rollen "Cloud Datastore User" och ladda ner JSON-nyckeln.

## Firestore Datastruktur

```
posts/
  {postId}/
    slug: string
    title: string
    excerpt: string
    content: string
    provider: string
    sourceUrl: string
    linkedinUrn: string
    createdAt: timestamp
    updatedAt: timestamp
    
tutorials/
  {tutorialId}/
    postId: string
    title: string
    content: string
    sourceUrl: string
    createdAt: timestamp
    updatedAt: timestamp

news/
  {newsId}/
    slug: string
    title: string
    excerpt: string
    content: string
    sourceUrl: string
    source: string
    linkedinUrn: string
    createdAt: timestamp
    updatedAt: timestamp
```

### Index
- `posts.slug` (==) – krävs för frågan `where('slug','==',...)`
- `tutorials.postId` (==) – krävs för frågan `where('postId','==',...)`
- `news.slug` (==) – krävs för frågan `where('slug','==',...)`

## Deployment

### 1. Bygg projektet
```bash
npm run build
```

### 2. Deploy till Google Cloud Functions

Deploya båda handlers:

**API-nyhetshandler:**
```bash
gcloud functions deploy apiNewsHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/home/paj/Dev/ai-arne_cloud \
  --entry-point=apiNewsHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=OPENAI_API_KEY=sk-... \
  --set-env-vars=ANTHROPIC_API_KEY=sk-ant-...
```

**Allmänna nyhetshandler:**
```bash
gcloud functions deploy generalNewsHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/home/paj/Dev/ai-arne_cloud \
  --entry-point=generalNewsHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=RSS_FEEDS=https://feeds.feedburner.com/oreilly/radar,https://techcrunch.com/feed/ \
  --set-env-vars=OPENAI_API_KEY=sk-... \
  --set-env-vars=ANTHROPIC_API_KEY=sk-ant-...
```

**Chat-handler (Nyhets Chat):**
```bash
gcloud functions deploy chatHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/home/paj/Dev/ai-arne-web/cloud \
  --entry-point=chatHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=OPENAI_API_KEY=sk-... \
  --set-env-vars=ANTHROPIC_API_KEY=sk-ant-...
```

**Bakåtkompatibilitet (valfritt):**
```bash
gcloud functions deploy managerHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/home/paj/Dev/ai-arne_cloud \
  --entry-point=managerHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=OPENAI_API_KEY=sk-... \
  --set-env-vars=ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Sätt upp Cloud Scheduler

**För API-nyheter:**
```bash
gcloud scheduler jobs create http ai-arne-api-news \
  --schedule="0 9 * * MON" \
  --time-zone="Europe/Stockholm" \
  --uri="https://REGION-PROJECT.cloudfunctions.net/apiNewsHandler" \
  --http-method=GET
```

**För allmänna nyheter:**
```bash
gcloud scheduler jobs create http ai-arne-general-news \
  --schedule="0 9 * * MON" \
  --time-zone="Europe/Stockholm" \
  --uri="https://REGION-PROJECT.cloudfunctions.net/generalNewsHandler" \
  --http-method=GET
```

### 4. Deploy Firestore säkerhetsregler
```bash
firebase deploy --only firestore:rules
```

## Testning

### Lokal testning (utan databas)
```bash
npm run test:local
```

### Firestore testning (kräver Google Cloud setup)
```bash
npm run test:firestore
```

## Firestore API

Webbplatsen kommunicerar direkt med Firestore via REST API:
- `GET https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/posts`
- `GET https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/tutorials`
- `GET https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/news`

Se Firestore REST API dokumentation för detaljer om hur man läser från samlingarna.

## Kostnad

- **Firestore**: GRATIS (under 50K reads/dag)
- **Cloud Functions**: ~$0.40/månad (2 runs/månad)
- **Cloud Scheduler**: GRATIS (3 jobs gratis)
- **Total: ~$0.40/månad**

## Säkerhet

- **Firestore säkerhetsregler**: Endast Cloud Functions kan skriva (via service account)
- **Firestore REST API**: Alla kan läsa (publika samlingar)
- **Google Cloud-autentisering**: Automatisk via Application Default Credentials (ADC)
- **Externa API-nycklar**: Lagras säkert i miljövariabler i Google Cloud Functions
- **HTTPS**: Används för all kommunikation
