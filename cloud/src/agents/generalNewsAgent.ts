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
 * Beräknar måndag 09:00 som veckans startpunkt
 */
function getWeekStartMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = söndag, 1 = måndag, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Antal dagar tillbaka till måndag
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(9, 0, 0, 0); // Sätt till 09:00
  
  return monday;
}

/**
 * Använder LLM för att hitta veckans 10 viktigaste AI-relaterade nyheter
 * Veckan räknas från måndag 09:00
 */
export async function findTopAINewsWithLLM(): Promise<LLMNewsItem[]> {
  const now = new Date();
  const weekStart = getWeekStartMonday();
  const currentDate = now.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  const weekStartDate = weekStart.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = now.getFullYear();
  
  const prompt = `Du är en AI-nyhetsexpert som identifierar veckans 10 viktigaste AI-relaterade nyheter.

VIKTIGT - TIDSPUNKTER:
- DAGENS DATUM: ${currentDate} (${currentYear})
- VECKANS START (MÅNDAG 09:00): ${weekStartDate} kl 09:00
- Du ska söka efter nyheter som har skett FRÅN ${weekStartDate} kl 09:00 TILL ${currentDate}

KRITISKT: Du MÅSTE använda web search-verktyget för att söka efter aktuella nyheter online. Använd INTE din träningsdata - sök aktivt efter nyheter från denna vecka (från måndag 09:00) med web search-verktyget.

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
1. Använd web search-verktyget för att söka efter "AI news ${currentYear} this week" och "AI development news since ${weekStartDate}"
2. Hitta de 10 viktigaste AI-nyheterna från denna vecka (från måndag 09:00)
3. Inkludera länkar till källor från dina web search-resultat
4. ALLA titlar och sammanfattningar MÅSTE vara på svenska - INGEN engelska
5. Översätt alla engelska nyheter till svenska innan du returnerar dem

SPRÅK-KRAV:
- ALLA titlar MÅSTE vara på svenska
- ALLA sammanfattningar MÅSTE vara på svenska
- Översätt ALLA engelska nyheter till svenska
- Använd svenska termer och uttryck
- INGEN engelska text i titlar eller sammanfattningar

VIKTIGT: Returnera ENDAST validerad JSON utan extra text. Exakt format:
{
  "news": [
    {
      "title": "Nyhetstitel på svenska (INGEN engelska)",
      "summary": "200-300 ord detaljerad sammanfattning på svenska (INGEN engelska)",
      "sourceUrl": "https://källa.se/artikel",
      "sourceName": "Källans namn"
    }
  ]
}

KRITISKA REGLER FÖR JSON:
1. Returnera ENDAST JSON - ingen markdown, ingen extra text före eller efter
2. Varje nyhet måste ha exakt 4 fält: title, summary, sourceUrl, sourceName
3. ALLA titlar och sammanfattningar MÅSTE vara på svenska - INGEN engelska
4. sourceUrl och sourceName kan vara tomma strängar "" om källan saknas
5. INGEN trailing comma före ] eller }
6. Alla strängar måste vara korrekt escaped med dubbla citattecken
7. Returnera exakt 10 nyheter
8. Varje sammanfattning: 200-300 ord, detaljerad och informativ, på svenska
9. Kontrollera att JSON är validerad innan du returnerar den`;

  try {
    const searchStartTime = Date.now();
    console.log(`🔍 Finding top 10 AI news with web search enabled (week starting ${weekStartDate} 09:00)...`);
    console.log(`📅 Week start: ${weekStartDate} 09:00, Current date: ${currentDate}`);
    
    const response = await createResponse(prompt, {
      model: 'gpt-5', // Använd gpt-5 för bäst träffsäkerhet och web search
      maxTokens: 6000, // Öka för att hantera 10 nyheter med längre sammanfattningar (200-300 ord)
      temperature: 0.7,
      enableWebSearch: true // Aktivera web search - KRITISKT för att hitta aktuella nyheter
    });
    
    const searchDuration = Date.now() - searchStartTime;
    console.log(`✅ LLM news search completed in ${searchDuration}ms using ${response.provider} API`);
    console.log(`📏 Response length: ${response.content.length} characters`);

        const responseText = response.content.trim();
        
        console.log('LLM response (first 1000 chars):', responseText.substring(0, 1000));
        
        // Försök extrahera JSON från svaret (kan innehålla markdown code blocks)
        let jsonText = responseText;
        
        // Ta bort markdown code blocks om de finns
        const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        } else {
          // Försök hitta JSON-objekt direkt - hitta första { och sista }
          const firstBrace = responseText.indexOf('{');
          const lastBrace = responseText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = responseText.substring(firstBrace, lastBrace + 1);
          }
        }

        // Försök fixa vanliga JSON-fel
        // 1. Ta bort trailing kommatecken i arrays och objects (flera gånger för att fånga alla)
        let previousLength = 0;
        let iterations = 0;
        while (jsonText.length !== previousLength && iterations < 10) {
          previousLength = jsonText.length;
          jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
          iterations++;
        }
        
        // 2. Fixa oavslutade strängar (ta bort oavslutade quotes i slutet)
        jsonText = jsonText.replace(/("|')([^"']*)$/g, '$1');
        
        // 3. Ta bort whitespace i början och slutet
        jsonText = jsonText.trim();
        
        // 4. Försök hitta och fixa oavslutade arrays/objects
        const openBraces = (jsonText.match(/\{/g) || []).length;
        const closeBraces = (jsonText.match(/\}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;
        
        // Lägg till saknade stängande brackets/braces om det behövs
        if (openBraces > closeBraces) {
          jsonText += '}'.repeat(openBraces - closeBraces);
        }
        if (openBrackets > closeBrackets) {
          jsonText += ']'.repeat(openBrackets - closeBrackets);
        }
        
        console.log('Extracted JSON (first 1000 chars):', jsonText.substring(0, 1000));
        console.log('Extracted JSON (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));

        let parsed: LLMNewsResponse;
        try {
          parsed = JSON.parse(jsonText);
        } catch (parseError: any) {
          console.error('JSON parse error:', parseError);
          const positionMatch = parseError.message.match(/position (\d+)/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const start = Math.max(0, position - 300);
            const end = Math.min(jsonText.length, position + 300);
            console.error('JSON text around error position:', jsonText.substring(start, end));
            console.error('Character at error position:', jsonText[position]);
            console.error('Full JSON length:', jsonText.length);
          }
          
          // Försök en sista gång med mer aggressiv fixning
          try {
            // Ta bort allt efter sista }
            const lastBrace = jsonText.lastIndexOf('}');
            if (lastBrace !== -1) {
              let cleanedJson = jsonText.substring(0, lastBrace + 1);
              
              // Fixa trailing commas flera gånger
              let fixed = false;
              for (let i = 0; i < 20; i++) {
                const before = cleanedJson;
                cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
                if (before === cleanedJson) {
                  fixed = true;
                  break;
                }
              }
              
              // Försök parse igen
              parsed = JSON.parse(cleanedJson);
              console.log('Successfully parsed after aggressive cleaning');
            } else {
              throw parseError;
            }
          } catch (retryError: any) {
            // Sista försöket: försök extrahera bara news-arrayen
            try {
              const newsArrayMatch = jsonText.match(/"news"\s*:\s*\[([\s\S]*)\]/);
              if (newsArrayMatch) {
                let newsArrayText = '[' + newsArrayMatch[1] + ']';
                
                // Fixa trailing commas i arrayen flera gånger
                for (let i = 0; i < 20; i++) {
                  const before = newsArrayText;
                  newsArrayText = newsArrayText.replace(/,(\s*[}\]])/g, '$1');
                  if (before === newsArrayText) break;
                }
                
                // Försök hitta och fixa oavslutade objects i arrayen
                const openBracesInArray = (newsArrayText.match(/\{/g) || []).length;
                const closeBracesInArray = (newsArrayText.match(/\}/g) || []).length;
                if (openBracesInArray > closeBracesInArray) {
                  newsArrayText += '}'.repeat(openBracesInArray - closeBracesInArray);
                }
                
                const newsArray = JSON.parse(newsArrayText);
                parsed = { news: newsArray };
                console.log('Successfully parsed by extracting news array directly');
              } else {
                throw new Error(`Failed to parse JSON: ${parseError.message}. Retry also failed: ${retryError.message}`);
              }
            } catch (finalError: any) {
              // Sista försöket: försök extrahera individuella nyheter från arrayen
              try {
                console.log('Attempting to extract individual news items from malformed JSON...');
                // Försök hitta alla news-objekt individuellt
                const newsItemMatches = jsonText.match(/\{[^}]*"title"[^}]*"summary"[^}]*\}/g);
                if (newsItemMatches && newsItemMatches.length > 0) {
                  const extractedNews: any[] = [];
                  for (const match of newsItemMatches) {
                    try {
                      const cleaned = match.replace(/,(\s*[}\]])/g, '$1');
                      const item = JSON.parse(cleaned);
                      if (item.title && item.summary) {
                        extractedNews.push({
                          title: item.title,
                          summary: item.summary,
                          sourceUrl: item.sourceUrl || '',
                          sourceName: item.sourceName || ''
                        });
                      }
                    } catch (e) {
                      // Ignorera individuella parsing-fel
                    }
                  }
                  if (extractedNews.length > 0) {
                    parsed = { news: extractedNews };
                    console.log(`Successfully extracted ${extractedNews.length} news items individually`);
                  } else {
                    throw finalError;
                  }
                } else {
                  throw finalError;
                }
              } catch (extractError: any) {
                throw new Error(`Failed to parse JSON: ${parseError.message}. Retry also failed: ${retryError.message}. Final error: ${finalError.message}. Extract error: ${extractError.message}`);
              }
            }
          }
        }
    
    if (!parsed || !parsed.news || !Array.isArray(parsed.news)) {
      console.error('Invalid JSON structure:', parsed);
      throw new Error('Invalid JSON structure: missing news array');
    }

    console.log(`Found ${parsed.news.length} news items from LLM`);
    
    // Validera att alla nyheter har rätt struktur
    const validNews = parsed.news.filter((item: any) => {
      const hasTitle = item.title && typeof item.title === 'string';
      const hasSummary = item.summary && typeof item.summary === 'string';
      console.log(`Validating news item: ${item.title || 'NO TITLE'} - hasTitle: ${hasTitle}, hasSummary: ${hasSummary}`);
      return hasTitle && hasSummary;
    });
    
    console.log(`Validated ${validNews.length} news items out of ${parsed.news.length}`);

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
  const prompt = `Du är en AI-nyhetsskribent som omarbetar nyhetssammanfattningar till underhållande text med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela texten.

Originalnyhet:
Titel: ${newsItem.title}
Sammanfattning: ${newsItem.summary}
Källa: ${newsItem.sourceName}

VIKTIGT: Skriv en omarbetad artikel på 800-1200 ord (MINST 800 ord, gärna 1000-1200 ord) som:
- Behåller all viktig information från originalnyheten
- Är underhållande och engagerande att läsa
- Har en tydlig ironisk touch och svenska humor genom HELA texten
- Är informativ men rolig
- Använder ironi och humor flitigt men respekterar faktan
- Inkluderar kontext, bakgrundsinformation och relevanta detaljer
- Är skriven på svenska med svenska humor och ironi
- Var inte rädd för att vara långrandig - läsaren vill ha djupgående information
- ALLA texter MÅSTE vara på svenska - INGEN engelska

SPRÅK-KRAV:
- ALLA texter MÅSTE vara på svenska
- Översätt ALLA engelska termer till svenska
- Använd svenska termer och uttryck
- INGEN engelska text i artikeln

Skriv artikeln direkt utan extra formatering. Använd paragraf-struktur med tydliga avsnitt.`;

  try {
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 3000, // Öka till 3000 för längre texter (800-1200 ord)
      temperature: 0.8 // Högre temperatur för mer kreativitet och humor
    });
    
    console.log(`✍️ News rewrite completed using ${response.provider} API`);

    const rewrittenSummary = response.content.trim();
    
    // Konvertera text till HTML-paragrafstruktur
    // Dela upp texten i paragraf baserat på dubbel radbrytning
    const paragraphs = rewrittenSummary
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Skapa HTML-innehåll - kodar endast textinnehåll för att undvika XSS
    // Varje paragraf blir en <p> tag med kodat textinnehåll
    // VIKTIGT: Använd sanitizeTextForHtml för att koda text, inte sanitizeHtml som kodar allt
    const htmlParagraphs = paragraphs.map(p => {
      // Koda textinnehållet för att undvika XSS, men behåll HTML-strukturen
      // Använd he.encode direkt för att koda text, inte sanitizeHtml som kan dubbelkoda
      return `<p>${sanitizeHtml(p)}</p>`;
    });
    
    // För länkar, koda URL:en men inte texten (URL:er ska vara kodade)
    const sourceLink = newsItem.sourceUrl 
      ? `<p>Källa: <a href="${sanitizeHtml(newsItem.sourceUrl)}" rel="noopener" target="_blank">${sanitizeHtml(newsItem.sourceName || newsItem.sourceUrl)}</a></p>`
      : `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`;
    
    const htmlContent = [
      `<p><strong>${sanitizeHtml(newsItem.title)}</strong></p>`,
      ...htmlParagraphs,
      sourceLink
    ].join('\n');

    return {
      title: sanitizeHtml(newsItem.title),
      content: htmlContent, // HTML-innehåll - frontend kommer att dekoda HTML-entiteter
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
    
    const fallbackHtml = [
      `<p><strong>${sanitizeHtml(newsItem.title)}</strong></p>`,
      ...fallbackParagraphs,
      newsItem.sourceUrl ? `<p>Källa: <a href="${sanitizeHtml(newsItem.sourceUrl)}" rel="noopener" target="_blank">${sanitizeHtml(newsItem.sourceName || newsItem.sourceUrl)}</a></p>` : `<p>Källa: ${sanitizeHtml(newsItem.sourceName || 'Okänd')}</p>`
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
 */
export async function processAndUpsertNews(newsItems: LLMNewsItem[]): Promise<number> {
  const startTime = Date.now();
  let processed = 0;
  let failed = 0;

  console.log(`🔄 Processing ${newsItems.length} news items...`);

  for (let i = 0; i < newsItems.length; i++) {
    const itemStartTime = Date.now();
    const newsItem = newsItems[i];
    
    try {
      console.log(`📝 [${i + 1}/${newsItems.length}] Processing: "${newsItem.title}"`);
      
      // Omarbeta nyheten med AI för att göra den underhållande
      console.log(`  ⏳ Rewriting with AI...`);
      const rewriteStart = Date.now();
      const processedItem = await rewriteNewsWithAI(newsItem);
      const rewriteDuration = Date.now() - rewriteStart;
      console.log(`  ✅ Rewritten in ${rewriteDuration}ms: ${processedItem.title} (${processedItem.content.length} chars)`);
      
      // Spara i databas
      console.log(`  ⏳ Saving to Firestore...`);
      const saveStart = Date.now();
      const result = await upsertGeneralNews(processedItem);
      const saveDuration = Date.now() - saveStart;
      console.log(`  ✅ Saved in ${saveDuration}ms: id=${result.id}, slug=${result.slug}, updated=${result.updated}`);
      
      const itemDuration = Date.now() - itemStartTime;
      console.log(`  ✅ Item ${i + 1} completed in ${itemDuration}ms`);
      
      processed++;
    } catch (error: any) {
      failed++;
      const itemDuration = Date.now() - itemStartTime;
      console.error(`  ❌ Item ${i + 1} failed after ${itemDuration}ms: "${newsItem.title}"`);
      console.error(`  Error:`, {
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Bara första 3 raderna av stack
      });
      // Fortsätt med nästa nyhet även om denna misslyckas
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`✅ Processing completed in ${totalDuration}ms: ${processed} succeeded, ${failed} failed out of ${newsItems.length} total`);
  return processed;
}
