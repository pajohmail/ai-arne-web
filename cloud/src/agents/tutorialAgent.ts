import { sanitizeHtml } from '../utils/text.js';
import type { ProviderRelease } from './providers.js';
import { upsertTutorialForPost } from '../services/upsert.js';
import { createResponse } from '../services/responses.js';

/**
 * Skapar eller uppdaterar en tutorial med AI-genererat innehåll via Responses API
 * Fallback till statisk HTML om API-nycklar saknas
 */
export async function createOrUpdateTutorial(postId: string, release: ProviderRelease) {
  const title = `Kom igång med ${release.name}${release.version ? ' ' + release.version : ''}`;
  
  // Försök generera innehåll med AI via Responses API
  let html: string;
  
  try {
    const prompt = `Du är en expert-teknisk skribent som skapar omfattande, pedagogiska tutorials för utvecklare. Din uppgift är att skapa en MYCKET detaljerad och komplett tutorial-guide på svenska för följande API-release. 

VIKTIGT: Använd din kunskap om detta API, dess dokumentation, best practices, och relaterade teknologier för att skapa en komplett guide. Var inte rädd för att vara utförlig - läsaren behöver en fullständig guide som täcker allt från grunderna till avancerade användningsfall.

Provider: ${release.provider}
Release: ${release.name}${release.version ? ' ' + release.version : ''}
URL: ${release.url}
Sammanfattning: ${release.summary || 'Ingen sammanfattning tillgänglig'}

KRITISKA KRAV:
- Skriv MINST 1500 ord totalt (helst 2000+ ord)
- Var EXTREMT detaljerad och pedagogisk
- Inkludera konkreta exempel, kod-snippets, och förklaringar
- Använd din kunskap om API:et, dess dokumentation, och relaterade teknologier
- Var underhållande med ironisk touch och svenska humor, men håll det pedagogiskt

OBLIGATORISK STRUKTUR (varje sektion måste vara utförlig):

1. INTRODUKTION (MINST 250 ord)
   - Vad är detta API/feature?
   - Varför är det viktigt och relevant?
   - Vilka problem löser det?
   - Kontext och bakgrund
   - Använd ironi och svenska humor för att göra det engagerande

2. FÖRUTSÄTTNINGAR OCH FÖRBEREDELSER (MINST 200 ord)
   - Konto hos leverantören (steg-för-steg guide)
   - API-nyckel (hur man får den, var man hittar den)
   - Node.js version och systemkrav (specifika versioner)
   - Miljövariabler och konfiguration
   - Vanliga problem och troubleshooting
   - Verifiering att allt fungerar

3. INSTALLATION OCH SETUP (MINST 250 ord)
   - npm/bun/yarn installation (alla alternativ)
   - Package.json konfiguration
   - TypeScript setup (om relevant)
   - Miljövariabler och .env-filer
   - Verifiering av installation
   - Vanliga installation-problem och lösningar
   - Troubleshooting-guide

4. GRUNDLÄGGANDE ANVÄNDNING (MINST 300 ord)
   - Första steget: enkel "Hello World"-exempel
   - Förklara varje rad kod i detalj
   - Autentisering och konfiguration
   - Grundläggande API-anrop
   - Hantera svar och fel
   - Steg-för-steg guide med förklaringar

5. AVANCERADE EXEMPEL OCH USE CASES (MINST 400 ord)
   - Flera olika användningsfall (minst 3-4 exempel)
   - Komplett kod för varje exempel med detaljerade förklaringar
   - Förklara varje del av koden
   - Tips och tricks för varje use case
   - Vanliga misstag och hur man undviker dem
   - Best practices för varje scenario

6. FELHANTERING OCH TROUBLESHOOTING (MINST 200 ord)
   - Vanliga fel och deras lösningar
   - Debugging-tekniker
   - Logging och monitoring
   - Error handling patterns
   - När och hur man söker hjälp

7. BEST PRACTICES OCH TIPS (MINST 200 ord)
   - Prestanda-optimering
   - Säkerhet och API-nycklar
   - Kod-organisering
   - Testing-strategier
   - Pro-tips från erfarenhet
   - Använd ironi och humor här också

8. YTTERLIGARE RESURSER (MINST 150 ord)
   - Officiell dokumentation (med länkar och förklaringar)
   - Community-resurser (forums, Discord, etc.)
   - Relaterade tutorials och guides
   - GitHub repositories
   - Förklara varför varje resurs är användbar och när man ska använda den

FORMATERING:
- Använd HTML med h2, h3, p, ul, ol, pre, code tags
- Kodexempel ska vara formaterade med <pre><code>
- Använd svenska språket
- Var tydlig med rubriker och struktur

PEDAGOGISK TON:
- Förklara "varför" inte bara "hur"
- Använd analogier och exempel
- Var steg-för-steg tydlig
- Anta att läsaren är nybörjare men vill lära sig ordentligt
- Använd ironi och svenska humor för att göra det engagerande, men håll det pedagogiskt

Kom ihåg: Detta ska vara en KOMPLETT guide som en utvecklare kan följa från början till slut. Var inte kortfattad - läsaren behöver all information.`;

    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 5000, // Ökad från 3000 för längre tutorials
      temperature: 0.8 // Ökad temperatur för mer kreativitet och humor
    });

    // Logga vilken provider som användes och längd
    const contentLength = response.content.length;
    const wordCount = response.content.split(/\s+/).length;
    console.log(`Tutorial generated with ${response.provider} API - ${contentLength} chars, ~${wordCount} words`);

    // Sanitize AI-genererat innehåll och lägg till länk
    const aiContent = sanitizeHtml(response.content);
    html = `${aiContent}\n<p><a href="${sanitizeHtml(release.url)}" rel="noopener" target="_blank">Läs mer: ${sanitizeHtml(release.url)}</a></p>`;
    
    // Logga om tutorialen är för kort
    if (wordCount < 1000) {
      console.warn(`WARNING: Tutorial is shorter than expected (${wordCount} words, expected 1500+)`);
    }
  } catch (error) {
    console.error(`Failed to generate tutorial with AI, using static template:`, error);
    
    // Fallback till statisk HTML om AI-generering misslyckas
    html = sanitizeHtml(
      [
        `<h2>${title}</h2>`,
        `<p>I den här guiden går vi igenom det nya API:et från ${release.provider}.</p>`,
        `<h3>Förutsättningar</h3>`,
        `<ul><li>Konto hos leverantören</li><li>API-nyckel</li><li>Node.js 22+</li></ul>`,
        `<h3>Installation</h3>`,
        `<pre><code>npm i provider-sdk</code></pre>`,
        `<h3>Exempelkod</h3>`,
        `<pre><code>import Client from 'provider-sdk';\nconst client = new Client(process.env.PROVIDER_API_KEY);\nconst resp = await client.doSomething();\nconsole.log(resp);</code></pre>`,
        `<h3>Läs mer</h3>`,
        '<h3>Statisk HTML-fallback</h3>',
        `<p><a href="${release.url}" rel="noopener" target="_blank">${release.url}</a></p>`
      ].join('\n')
    );
  }

  return await upsertTutorialForPost(postId, {
    title,
    content: html,
    url: release.url
  });
}
