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
    const prompt = `Du är en teknisk skribent som skapar tutorials för utvecklare. Skapa en detaljerad tutorial-guide på svenska för följande API-release. Skriv på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela tutorialen, men håll det fortfarande tydligt och pedagogiskt.

Sök efter mer information online för att komplettera tutorialen med relevanta exempel, bästa praxis, och länkar till dokumentation och resurser.

Provider: ${release.provider}
Release: ${release.name}${release.version ? ' ' + release.version : ''}
URL: ${release.url}
Sammanfattning: ${release.summary || 'Ingen sammanfattning tillgänglig'}

VIKTIGT: Skriv MINST 800 ord totalt. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

Skapa en längre, mer detaljerad tutorial med följande struktur:
1. En introduktion (MINST 150 ord) som förklarar vad denna release är, varför den är viktig, och vilka problem den löser (engagerande och underhållande med tydlig ironisk touch och svenska humor)
2. Förutsättningar (MINST 100 ord) - konto, API-nyckel, Node.js version, etc. Var mycket detaljerad och inkludera troubleshooting
3. Installation (MINST 150 ord) - npm/bun/yarn kommandon. Inkludera flera alternativ, troubleshooting, och vanliga problem med lösningar
4. Exempelkod (MINST 250 ord) - visa hur man använder API:et. Inkludera flera exempel med olika use cases, förklaringar av varje exempel, och tips
5. Ytterligare resurser eller länkar (MINST 100 ord) - dokumentation, community-resurser, och relaterade tutorials. Förklara varför varje resurs är användbar
6. Bästa praxis och tips (MINST 150 ord) - vanliga misstag, hur man undviker dem, och pro-tips. Använd ironi och humor här också

Formatera innehållet som HTML med h2, h3, p, ul, pre, code tags. Använd svenska språket.
Var tydlig, pedagogisk och underhållande med en tydlig touch av ironi genom hela tutorialen. Var inte rädd för att vara detaljerad - läsaren vill ha en komplett guide. Använd ironi och svenska humor flitigt för att göra läsningen mer engagerande.`;

    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 3000,
      temperature: 0.8 // Ökad temperatur för mer kreativitet och humor
    });

    // Logga vilken provider som användes
    console.log(`Tutorial generated with ${response.provider} API`);

    // Sanitize AI-genererat innehåll och lägg till länk
    const aiContent = sanitizeHtml(response.content);
    html = `${aiContent}\n<p><a href="${sanitizeHtml(release.url)}" rel="noopener" target="_blank">Läs mer: ${sanitizeHtml(release.url)}</a></p>`;
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
