# AI‑Arne – Nyheter & Tutorials (React + TS + Firestore REST)

Svensk, minimal och snabb webbsajt som läser Firestore via REST (utan Firebase SDK). Körs som statiska filer på vanligt webbhotell (PHP-stöd räcker), ingen Node behövs i drift.

## Funktioner
- Layout med svart top/bottom bar och vit content-yta (max 960px)
- Sidor: Start, API‑nyheter, Nyheter, Post-detalj, Nyhet-detalj, Tutorial-detalj, 404
- Läser Firestore via `documents:runQuery` (read-only)
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
     "projectId": "DIN_GCLOUD_PROJECT_ID",
     "publicBaseUrl": "http://localhost:5173"
   }
   ```
3. (Rekommenderat) Kopiera logotypen `aiarne.png` till `public/`.
4. Starta dev:
   ```bash
   npm run dev
   ```

## Bygga och driftsätta på webbhotell (utan Node)
1. Bygg lokalt:
   ```bash
   npm run build
   ```
   Detta skapar mappen `dist/`.
2. Ladda upp innehållet i `dist/` till webbhotellets webbrot via FTP.
3. Används `HashRouter`, så inga server‑rewrites behövs. URL:er ser ut som `/index.html#/posts`.
4. Om du vill ha “rena” URL:er, byt till `BrowserRouter` och lägg en `.htaccess` i webbrot:
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
