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
    const prompt = `Du är en teknisk skribent som skapar tutorials för utvecklare. Skapa en tutorial-guide på svenska för följande API-release. Skriv på ett underhållande sätt med en touch av ironi och svenska humor när det passar, men håll det fortfarande tydligt och pedagogiskt.

Provider: ${release.provider}
Release: ${release.name}${release.version ? ' ' + release.version : ''}
URL: ${release.url}
Sammanfattning: ${release.summary || 'Ingen sammanfattning tillgänglig'}

Skapa en tutorial med följande struktur:
1. En kort introduktion som förklarar vad denna release är (engagerande och underhållande)
2. Förutsättningar (konto, API-nyckel, Node.js version, etc.)
3. Installation (npm/bun/yarn kommandon)
4. Exempelkod som visar hur man använder API:et
5. Ytterligare resurser eller länkar

Formatera innehållet som HTML med h2, h3, p, ul, pre, code tags. Använd svenska språket.
Var tydlig, pedagogisk och underhållande med en touch av ironi när det är lämpligt.`;

    const response = await createResponse(prompt, {
      model: 'gpt-4o',
      maxTokens: 1500,
      temperature: 0.7
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
