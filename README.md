# AI‑Arne – Nyheter & Tutorials (React + TS + Firestore via PHP-proxy)

Svensk, minimal och snabb webbsajt som läser Firestore via PHP-proxy endpoints (API-nycklar dolda server-side). Körs som statiska filer + PHP på vanligt webbhotell, ingen Node behövs i drift.

## Funktioner
- Layout med svart top/bottom bar och vit content-yta (max 960px)
- Sidor: Start, API‑nyheter, Nyheter, Post-detalj, Nyhet-detalj, Tutorial-detalj, 404
- Läser Firestore via PHP-proxy (read-only, API-nycklar server-side)
- In-memory cache, timeout, fel- och tomt‑tillstånd
- Code-splitting per route, tillgängliga komponenter, enkel SEO

## Kom igång (lokalt)
1. Installera beroenden:
   ```bash
   npm i
   ```
2. Ställ in runtime‑konfiguration i `public/config.json`:
   ```json
   {
     "publicBaseUrl": "http://localhost:5173"
   }
   ```
3. Konfigurera PHP API-nycklar:
   - Kopiera `api/config.php.example` till `api/config.php`
   - Öppna `api/config.php` och fyll i:
     - `FIRESTORE_PROJECT_ID`: `'ai-arne-agents'`
     - `FIRESTORE_API_KEY`: Hämta från Firebase Console → Project Settings → General → Web API Key
4. (Rekommenderat) Kopiera logotypen `aiarne.png` till `public/`.
5. Starta PHP-server för API (i projektroten):
   ```bash
   php -S localhost:8000
   ```
6. I en annan terminal, starta Vite dev-server:
   ```bash
   npm run dev
   ```
7. Öppna `http://localhost:5173` – React-appen anropar PHP-endpoints på `http://localhost:8000`

## Bygga och driftsätta på webbhotell (PHP-stöd krävs)
1. Bygg lokalt:
   ```bash
   npm run build
   ```
   Detta skapar mappen `dist/`.
2. Ladda upp innehållet i `dist/` till webbhotellets webbrot via FTP.
3. Ladda upp hela `api/`-mappen till webbrot (samma nivå som `index.html`).
4. Skapa `api/config.php` på servern:
   - Kopiera från `api/config.php.example`
   - Fyll i `FIRESTORE_PROJECT_ID` och `FIRESTORE_API_KEY`
   - **VIKTIGT**: `api/config.php` ska EJ committas till Git (ligger redan i `.gitignore`)
5. Används `HashRouter`, så inga server‑rewrites behövs. URL:er ser ut som `/index.html#/posts`.
6. Om du vill ha “rena” URL:er, byt till `BrowserRouter` och lägg en `.htaccess` i webbrot:
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## PHP API-endpoints
- `GET /api/posts.php?limit=10` – lista senaste posts
- `GET /api/post.php?slug=xxx` – hämta post via slug
- `GET /api/news.php?limit=10` – lista senaste news
- `GET /api/news-item.php?slug=xxx` – hämta news via slug
- `GET /api/tutorial.php?postId=xxx` – hämta tutorial via postId
- `GET /api/tutorial.php?id=xxx` – hämta tutorial direkt via id

Alla endpoints returnerar JSON med `{ success: true, data: ... }` eller `{ success: false, error: ... }`.

## Firestore konfiguration
- Regler (exempel för publik read-only):
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read: if true;
        allow write: if false;
      }
    }
  }
  ```
- Index: Single‑field index på `createdAt` (Asc/Desc) för `posts` och `news`.
- Firebase Web API Key: Hämta från Firebase Console → Project Settings → General → Web API Key (behövs i `api/config.php`)

## Datastruktur
- `posts`: { slug, title, excerpt, content(html), provider, sourceUrl, linkedinUrn, createdAt, updatedAt }
- `tutorials`: { postId, title, content(html), sourceUrl, createdAt, updatedAt }
- `news`: { slug, title, excerpt, content(html), sourceUrl, source, linkedinUrn, createdAt, updatedAt }

## REST‑frågor (runQuery)
- List senaste: `orderBy createdAt desc`, `limit 10`
- Hämta post/news via `where slug == <param>`
- Hämta tutorial via `where postId == <post.id>` eller `where __name__ == 'tutorials/<id>'`

## Övrigt
- SEO: `Seo`-komponent sätter `<title>`, meta description och canonical (från `publicBaseUrl` + hash‑URL)
- Säkerhet: HTML saneras med DOMPurify

## Licens
MIT
