# AI-Arne Cloud Agentsystem

Ett agentsystem som körs på Google Cloud Functions och övervakar AI-API:er från stora leverantörer. Använder Firestore som databas och producerar innehåll som webbplatsen läser direkt från Firestore.

**AI-implementation:** Använder OpenAI:s Responses API (beta) som primär provider. Chat-funktionalitet körs på webservern i PHP för snabbare svar.

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

- **API-nyhetsagent**: Övervakar API-nyheter från OpenAI och Google AI
- **General News-agent**: Hämtar veckans 10 viktigaste AI-nyheter med LLM och web search
  - Använder OpenAI Responses API (gpt-5) med web search för att hitta aktuella nyheter
  - Bearbetar nyheter sekvensiellt för att säkerställa att åtminstone några sparas även vid timeout
  - Omarbetar nyheter med AI för att göra dem underhållande med ironisk touch
- **Tutorial-agent**: Skapar AI-genererade tutorials för API-nyheter via Responses API
  - Använder OpenAI Responses API för att generera tutorial-innehåll (8000 tokens)
  - Fallback till statisk HTML om API-nycklar saknas
- **LinkedIn-integration**: Uppdaterar företagsprofil automatiskt med sammanfattning av nyheter

## Responses API och AI-integration

Systemet använder OpenAI:s Responses API (beta) för AI-generering:

- **Responses API**: Används för GPT-5 modeller (gpt-5, gpt-5-mini)
  - Synkront API som returnerar svar direkt (kan vara `completed` eller `incomplete`)
  - Stödjer polling för asynkrona svar med `status: 'incomplete'`
  - Web search kan aktiveras via `tools: [{ type: 'web_search_preview' }]`
  - Använder `reasoning: { effort: 'low' }` och `text: { verbosity: 'low' }` för snabbare, kortare svar
  - Stödjer INTE `temperature` - använd `text.verbosity` istället
- **Chat Completions API**: Används som fallback för äldre modeller (gpt-4.1, gpt-4.1-mini)
  - Stödjer `temperature` parameter
- **Felhantering**: Automatisk hantering av `max_output_tokens` - använder delvis innehåll om tillgängligt
- **Status-hantering**: Korrekt hantering av `status: 'completed'` (inte `'complete'`)

Implementationen finns i `src/services/responses.ts` och används av:
- `generalNewsAgent.ts` - För att hitta och omarbeta AI-nyheter (10 nyheter, 12000 tokens)
- `tutorialAgent.ts` - För generering av tutorial-innehåll (8000 tokens)
- `upsert.ts` - För generering av API-nyhetsinnehåll (5000 tokens)

**Chat-funktionalitet:**
- Chat-logiken körs på webservern i PHP (`api/chat.php`) för snabbare svar
- Använder OpenAI Responses API direkt med optimerade inställningar
- Förenklad prompt (200-300 ord) för snabbare svar (~30-60 sekunder istället för ~5 minuter)
- Automatisk kontroll för att svaret inte klipper mitt i en mening

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
OPENAI_API_KEY=sk-proj-...
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
  - Används för AI-baserad filtrering, sammanfattning av nyheter och tutorial-generering
  - GPT-5 modeller (gpt-5, gpt-5-mini) med web search-stöd
  - Fallback till Chat Completions API med GPT-4.1 modeller om Responses API misslyckas
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
// OpenAI Responses API - Primär provider
import { createResponse } from './services/responses.js';

const response = await createResponse(prompt, {
  model: 'gpt-5-mini', // GPT-5 modeller använder Responses API
  maxTokens: 1000,
  enableWebSearch: true, // Aktivera web search för GPT-5 modeller
  // temperature stöds INTE för Responses API - använd text.verbosity istället
});

// Responses API använder GPT-5 modeller, fallback till Chat Completions API med GPT-4.1 om det misslyckas
// response.provider visar vilken provider som användes ('openai')

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

errorLogs/
  {errorId}/
    timestamp: timestamp
    context: string
    message: string
    stack: string | null
    metadata: object
    severity: 'error' | 'warning'
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

**Huvudhandler (managerHandler):**
Detta är den enda handler som ska anropas från Cloud Scheduler. Den kör alla agenter parallellt och loggar fel till Firestore.

```bash
gcloud functions deploy managerHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/path/to/cloud \
  --entry-point=managerHandler \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=802s \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=OPENAI_API_KEY=sk-proj-...
```

**Individuella handlers (valfritt, för bakåtkompatibilitet):**
Dessa handlers kan deployas om du behöver anropa dem direkt, men rekommenderas att använda managerHandler istället.

```bash
# API-nyhetshandler (valfritt)
gcloud functions deploy apiNewsHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/path/to/cloud \
  --entry-point=apiNewsHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=OPENAI_API_KEY=sk-proj-...
  --timeout=802s

# Allmänna nyhetshandler (valfritt)
gcloud functions deploy generalNewsHandler \
  --gen2 \
  --runtime=nodejs22 \
  --region=europe-north1 \
  --source=/path/to/cloud \
  --entry-point=generalNewsHandler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=your-project-id \
  --set-env-vars=PUBLIC_BASE_URL=https://ai-arne.se \
  --set-env-vars=LINKEDIN_ACCESS_TOKEN=...,LINKEDIN_ORG_URN=urn:li:organization:... \
  --set-env-vars=OPENAI_API_KEY=sk-proj-...
  --timeout=802s
```

### 3. Sätt upp Cloud Scheduler

**Huvudschedule (rekommenderas):**
Anropa managerHandler som kör alla agenter parallellt:

```bash
gcloud scheduler jobs create http ai-arne-manager \
  --schedule="0 9 * * MON" \
  --time-zone="Europe/Stockholm" \
  --uri="https://REGION-PROJECT.cloudfunctions.net/managerHandler" \
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
