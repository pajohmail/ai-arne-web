import { sanitizeHtml } from '../utils/text.js';
import { upsertGeneralNews } from '../services/upsert.js';
import { createResponse } from '../services/responses.js';

export interface ProcessedNewsItem {
  title: string;
  content: string;
  excerpt: string;
  sourceUrl: string;
  source: string;
}

export interface LLMNewsItem {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
}

export interface LLMNewsResponse {
  news: LLMNewsItem[];
}

/**
 * Använder LLM för att hitta veckans 10 viktigaste AI-relaterade nyheter
 */
export async function findTopAINewsWithLLM(): Promise<LLMNewsItem[]> {
  const now = new Date();
  const currentDate = now.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = now.getFullYear();
  
  // Beräkna datumet för en vecka sedan
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  const oneWeekAgoDate = oneWeekAgo.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `Du är en AI-nyhetsexpert som identifierar veckans 10 viktigaste AI-relaterade nyheter. 

VIKTIGT - DATUM:
- DAGENS DATUM: ${currentDate} (${currentYear})
- EN VECKA SEDAN: ${oneWeekAgoDate} (${currentYear})

KRITISKT: Du MÅSTE använda web search-verktyget för att söka efter aktuella nyheter online. Använd INTE din träningsdata - sök aktivt efter nyheter med web search-verktyget.

DATUM-REGLER:
- Inkludera ENDAST nyheter från ${oneWeekAgoDate} till och med ${currentDate}
- Exkludera alla nyheter som är äldre än en vecka
- Exkludera alla nyheter som är nyare än dagens datum

Fokusera på:
- AI-utveckling och programmering
- API-releases från stora AI-leverantörer (OpenAI, Anthropic, Google, etc.)
- Tech-företags AI-utveckling och strategier
- Maskininlärning och AI-forskning
- AI-verktyg för utvecklare

Exkludera:
- Bildgenerering (DALL-E, Midjourney, Stable Diffusion, etc.)
- Videogenerering (Sora, etc.)
- Visuella AI-tjänster som inte är relevanta för utveckling

STEG-FÖR-STEG:
1. Använd web search-verktyget för att söka efter "AI news ${currentYear}" och "AI development news ${oneWeekAgoDate} to ${currentDate}"
2. Hitta de 10 viktigaste AI-nyheterna från ${oneWeekAgoDate} till och med ${currentDate}
3. Verifiera att varje nyhet är från rätt datumintervall (max en vecka gammal, inte nyare än idag)
4. Inkludera länkar till källor från dina web search-resultat
5. Alla titlar och sammanfattningar MÅSTE vara på svenska

VIKTIGT: Returnera ENDAST validerad JSON utan extra text. Exakt format:
{
  "news": [
    {
      "title": "Nyhetstitel på svenska",
      "summary": "100-200 ord sammanfattning på svenska",
      "sourceUrl": "https://källa.se/artikel",
      "sourceName": "Källans namn"
    }
  ]
}

KRITISKA REGLER FÖR JSON:
1. Returnera ENDAST JSON - ingen markdown, ingen extra text före eller efter
2. Varje nyhet måste ha exakt 4 fält: title, summary, sourceUrl, sourceName
3. ALLA titlar och sammanfattningar MÅSTE vara på svenska
4. sourceUrl och sourceName kan vara tomma strängar "" om källan saknas
5. INGEN trailing comma före ] eller }
6. Alla strängar måste vara korrekt escaped med dubbla citattecken
7. Returnera exakt 10 nyheter
8. Varje sammanfattning: 100-200 ord, informativ, på svenska
9. Kontrollera att JSON är validerad innan du returnerar den`;

  try {
    console.log(`🔍 Finding top 10 AI news with web search enabled...`);
    const response = await createResponse(prompt, {
      model: 'gpt-5', // Använd gpt-5 för bäst träffsäkerhet
      maxTokens: 2500, // Minskat från 4000 - räcker för 10 nyheter med 100-200 ord var
      temperature: 0.7,
      enableWebSearch: true // Aktivera web search
    });
    
    console.log(`📰 LLM news search completed using ${response.provider} API`);
    const responseText = response.content.trim();
    
    // Förenklad JSON-parsing: försök parse direkt, annars extrahera JSON-block
    let jsonText = responseText;
    
    // Ta bort markdown code blocks om de finns
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      // Försök hitta JSON-objekt direkt - hitta första { och sista }
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = responseText.substring(firstBrace, lastBrace + 1).trim();
      }
    }

    // Enkel fix för trailing commas (bara en gång)
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

    let parsed: LLMNewsResponse;
    try {
      // Försök parse direkt
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      console.error('JSON text (first 500 chars):', jsonText.substring(0, 500));
      console.error('JSON text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // Om parsing misslyckas, kasta fel - låt modellen få chansen att fixa det
      throw new Error(`Failed to parse JSON from LLM response: ${parseError.message}. LLM may need to retry with correct JSON format.`);
    }
    
    if (!parsed || !parsed.news || !Array.isArray(parsed.news)) {
      console.error('Invalid JSON structure:', parsed);
      throw new Error('Invalid JSON structure: missing news array');
    }

    console.log(`Found ${parsed.news.length} news items from LLM`);
    
    // Validera att alla nyheter har rätt struktur
    const validNews = parsed.news.filter((item: any) => {
      const hasTitle = item.title && typeof item.title === 'string' && item.title.trim().length > 0;
      const hasSummary = item.summary && typeof item.summary === 'string' && item.summary.trim().length > 0;
      return hasTitle && hasSummary;
    });
    
    console.log(`Validated ${validNews.length} news items out of ${parsed.news.length}`);

    // Varning om vi får färre än 10 nyheter (som prompten begär)
    if (validNews.length < 10) {
      console.warn(`⚠️  WARNING: Only received ${validNews.length} valid news items, but prompt requested exactly 10.`);
    }

    // Begränsa till 10 nyheter
    return validNews.slice(0, 10);
  } catch (error: any) {
    console.error('Failed to find news with LLM:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack
    });
    throw error;
  }
}

/**
 * Omarbetar en nyhetssammanfattning med AI för att göra den underhållande med ironisk touch
 */
export async function rewriteNewsWithAI(newsItem: LLMNewsItem): Promise<ProcessedNewsItem> {
  const prompt = `Du är en AI-nyhetsskribent som omarbetar nyhetssammanfattningar till korta, underhållande nyhetsnotiser med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela texten.

Originalnyhet:
Titel: ${newsItem.title}
Sammanfattning: ${newsItem.summary}
Källa: ${newsItem.sourceName}

VIKTIGT: Använd webbsökning för att komplettera nyheten med aktuell information från webben. Sök efter relaterad information, bakgrund och kontext som kan förbättra nyhetsnotisen.

Skriv en kort nyhetsnotis på 300-500 ord (gärna runt 400 ord) som:
- Behåller all viktig information från originalnyheten
- Kompletteras med aktuell information från webbsökning
- Är underhållande och engagerande att läsa
- Har en tydlig ironisk touch och svenska humor genom HELA texten
- Är informativ men rolig
- Använder ironi och humor flitigt men respekterar faktan
- Inkluderar relevant kontext och bakgrundsinformation från webbsökningen
- Är skriven på svenska med svenska humor och ironi
- Matchar tonen på resten av sidan - underhållande och ironisk

Skriv nyhetsnotisen direkt utan extra formatering. Använd paragraf-struktur med tydliga avsnitt.`;

  try {
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 1500, // För 300-500 ord texter
      temperature: 0.8, // Högre temperatur för mer kreativitet och humor
      enableWebSearch: true // Aktivera web search för att komplettera nyheten
    });
    
    console.log(`✍️ News rewrite completed using ${response.provider} API`);

    const rewrittenSummary = response.content.trim();
    
    // Konvertera text till HTML-paragrafstruktur
    // Dela upp texten i paragraf baserat på dubbel radbrytning
    const paragraphs = rewrittenSummary
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Skapa HTML-innehåll - kodar endast textinnehåll, inte HTML-strukturen
    // Varje paragraf blir en <p> tag med kodat textinnehåll
    const htmlParagraphs = paragraphs.map(p => {
      // Koda textinnehållet för att undvika XSS, men behåll HTML-strukturen
      return `<p>${sanitizeHtml(p)}</p>`;
    });
    
    // Validera och säkert hantera URL för href-attribut
    let sourceLink = '';
    if (newsItem.sourceUrl) {
      // Validera att URL är http/https
      const url = newsItem.sourceUrl.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // HTML-encoda bara farliga tecken i URL, inte : eller /
        const safeUrl = url
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const safeName = sanitizeHtml(newsItem.sourceName || url);
        sourceLink = `<p>Källa: <a href="${safeUrl}" rel="noopener" target="_blank">${safeName}</a></p>`;
      } else {
        // Ogiltig URL, visa bara text
        sourceLink = `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`;
      }
    } else {
      sourceLink = `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`;
    }

    const htmlContent = [
      `<p><strong>${sanitizeHtml(newsItem.title)}</strong></p>`,
      ...htmlParagraphs,
      sourceLink
    ].join('\n');

    return {
      title: sanitizeHtml(newsItem.title),
      content: htmlContent, // HTML-innehåll med korrekt formatering
      excerpt: sanitizeHtml(rewrittenSummary.slice(0, 280)),
      sourceUrl: newsItem.sourceUrl || '',
      source: newsItem.sourceName || 'LLM-sökning'
    };
  } catch (error) {
    console.error(`Failed to rewrite news with AI, using original:`, error);
    
    // Fallback till original om AI-omarbetning misslyckas
    // Konvertera summary till paragrafstruktur
    const fallbackParagraphs = newsItem.summary
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${sanitizeHtml(p)}</p>`);
    
    // Validera och säkert hantera URL för href-attribut (fallback)
    let fallbackSourceLink = '';
    if (newsItem.sourceUrl) {
      const url = newsItem.sourceUrl.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const safeUrl = url
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const safeName = sanitizeHtml(newsItem.sourceName || url);
        fallbackSourceLink = `<p>Källa: <a href="${safeUrl}" rel="noopener" target="_blank">${safeName}</a></p>`;
      } else {
        fallbackSourceLink = `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`;
      }
    } else {
      fallbackSourceLink = `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`;
    }

    const fallbackHtml = [
      `<p><strong>${sanitizeHtml(newsItem.title)}</strong></p>`,
      ...fallbackParagraphs,
      fallbackSourceLink
    ].join('\n');
    
    return {
      title: sanitizeHtml(newsItem.title),
      content: fallbackHtml,
      excerpt: sanitizeHtml(newsItem.summary.slice(0, 280)),
      sourceUrl: newsItem.sourceUrl || '',
      source: newsItem.sourceName || 'LLM-sökning'
    };
  }
}

/**
 * Bearbetar och sparar allmänna nyheter från LLM-sökning
 * Returnerar en lista med de faktiska sparade nyheterna (inklusive ID, slug, etc.)
 */
export async function processAndUpsertNews(newsItems: LLMNewsItem[]): Promise<Array<{
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  content: string;
  excerpt: string;
}>> {
  // Null-check och validering
  if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
    console.warn('No news items to process - newsItems is null, not an array, or empty');
    return [];
  }

  const processedNews: Array<{
    id: string;
    slug: string;
    title: string;
    sourceUrl: string;
    content: string;
    excerpt: string;
  }> = [];

  console.log(`Processing ${newsItems.length} news items...`);

  for (const newsItem of newsItems) {
    try {
      console.log(`Processing news item: ${newsItem.title}`);
      // Omarbeta nyheten med AI för att göra den underhållande
      const processedItem = await rewriteNewsWithAI(newsItem);
      console.log(`Rewritten news item: ${processedItem.title}, content length: ${processedItem.content.length}`);
      
      // Spara i databas
      const result = await upsertGeneralNews(processedItem);
      console.log(`Upserted news item: ${result.id}, slug: ${result.slug}, updated: ${result.updated}`);
      
      // Lägg till det faktiska objektet med all data
      processedNews.push({
        id: result.id,
        slug: result.slug,
        title: processedItem.title,
        sourceUrl: processedItem.sourceUrl,
        content: processedItem.content,
        excerpt: processedItem.excerpt
      });
    } catch (error: any) {
      console.error(`Failed to process news item "${newsItem.title}":`, error);
      console.error(`Error details:`, {
        message: error?.message,
        stack: error?.stack
      });
      // Fortsätt med nästa nyhet även om denna misslyckas
    }
  }

  console.log(`Successfully processed ${processedNews.length} out of ${newsItems.length} news items`);
  return processedNews;
}
