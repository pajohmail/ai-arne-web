/**
 * Manager för generella AI-nyheter
 * 
 * Denna modul koordinerar hela flödet för generella nyheter:
 * - Hittar nyheter via LLM
 * - Bearbetar och sparar dem i Firestore
 * - Genererar och publicerar LinkedIn-inlägg
 * 
 * @module generalNewsManager
 */

import { findTopAINewsWithLLM, rewriteNewsWithAI } from './generalNewsAgent.js';
import { upsertGeneralNews } from '../services/upsert.js';
import { postToLinkedIn, validateLinkedInCredentials } from '../services/linkedin.js';
import { withFirestore } from '../services/firestore.js';
import { COLLECTIONS } from '../services/schema.js';
import { createResponse } from '../services/responses.js';

/**
 * Interface för en nyhet som har sparats i Firestore
 */
interface NewsItem {
  /** Firestore document ID */
  id: string;
  /** URL-vänlig slug för nyheten */
  slug: string;
  /** Nyhetens titel */
  title: string;
  /** URL till originalkällan */
  sourceUrl: string;
  /** Fullständigt HTML-innehåll */
  content: string;
  /** Kort sammanfattning */
  excerpt: string;
}

/**
 * Genererar en säljande och underhållande LinkedIn-sammanfattning av nyheter med AI
 * 
 * Funktionen tar en lista med sparade nyheter och genererar en kort, engagerande
 * sammanfattning som passar för LinkedIn. Använder AI för att skapa en säljande
 * och underhållande text med ironisk touch.
 * 
 * @param newsItems - Array med sparade nyheter att sammanfatta
 * @returns Promise som resolverar till LinkedIn-texten
 * 
 * @example
 * const summary = await generateLinkedInSummary(savedNews);
 * await postToLinkedIn({ text: summary, ... });
 */
async function generateLinkedInSummary(newsItems: NewsItem[]): Promise<string> {
  // Bygg en sammanfattning av alla nyheter
  const newsSummary = newsItems.map((news, index) => {
    // Säker hantering av content - kontrollera att det är en sträng
    const rawContent = typeof news.content === 'string' ? news.content : '';
    
    // Extrahera textinnehåll från HTML (ta bort HTML-taggar)
    const textContent = rawContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500); // Begränsa till första 500 tecknen per nyhet
    
    return `${index + 1}. ${news.title}\n${textContent}`;
  }).join('\n\n');

  const prompt = `Du är en expert på att skriva säljande och underhållande LinkedIn-inlägg. Skriv en kort, engagerande sammanfattning av dessa AI-nyheter som passar perfekt för LinkedIn.

NYHETER:
${newsSummary}

VIKTIGT:
- Skriv på svenska
- Var säljande och underhållande - få läsaren att vilja läsa mer
- Använd en ironisk och rolig ton som matchar AI-Arne.se:s stil
- Håll det kort (max 300-400 ord totalt)
- Fokusera på de mest intressanta och relevanta nyheterna
- Använd emojis sparsamt men effektivt
- Skriv i LinkedIn-format: kort, punchigt, engagerande
- Var inte rädd för att vara lite provokativ eller rolig

Skriv sammanfattningen direkt utan extra formatering.`;

  try {
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 800,
      temperature: 0.8
    });

    return response.content.trim();
  } catch (error) {
    console.error('Failed to generate LinkedIn summary with AI, using fallback:', error);
    
    // Fallback: skapa en enkel sammanfattning
    const titles = newsItems.slice(0, 5).map((news, i) => `${i + 1}. ${news.title}`).join('\n');
    return `🤖 AI-nyheter denna vecka:\n\n${titles}\n\nDet händer mycket spännande inom AI just nu!`;
  }
}

/**
 * Huvudfunktion som kör hela flödet för allmänna AI-nyheter
 * 
 * Funktionen koordinerar hela processen:
 * 1. Hittar veckans 10 viktigaste AI-nyheter via LLM med web search
 * 2. Bearbetar varje nyhet sekvensiellt (omarbetar med AI, sparar i Firestore)
 * 3. Genererar och publicerar LinkedIn-inlägg med sammanfattning
 * 
 * Bearbetar nyheter sekvensiellt för att säkerställa att åtminstone några nyheter
 * sparas även om processen timar ut. Varje nyhet sparas direkt efter bearbetning.
 * 
 * @param options - Konfigurationsalternativ
 * @param options.force - Om true, hoppar över eventuella "har redan kört idag"-kontroller
 * @returns Promise som resolverar till resultat med antal bearbetade nyheter
 * 
 * @example
 * const result = await runGeneralNewsManager({ force: true });
 * console.log(`Processed ${result.processed} news items`);
 */
export async function runGeneralNewsManager({ force = false }: { force?: boolean } = {}) {
  // Bearbeta max 10 nyheter per körning (top 10)
  let processed = 0;
  let processedNews: Array<{ id: string; slug: string; title: string; sourceUrl: string; content: string; excerpt: string }> = [];

  try {
    console.log('Starting general news manager - finding top AI news with LLM...');
    if (force) {
      console.log('Force mode enabled - skipping any "already ran today" checks');
    }
    
    // Hitta veckans 10 viktigaste AI-nyheter via LLM
    const newsItems = await findTopAINewsWithLLM();
    
    console.log(`Found ${newsItems.length} news items from LLM`);
    
    if (newsItems.length === 0) {
      console.warn('No news items found by LLM');
      return { processed: 0, error: 'No news items found' };
    }

    console.log('Processing and upserting news items sequentially (one at a time)...');
    
    // Bearbeta nyheter sekvensiellt - en i taget
    // Detta säkerställer att varje nyhet sparas direkt efter bearbetning,
    // så att åtminstone några nyheter sparas även om processen timar ut
    for (const newsItem of newsItems) {
      try {
        console.log(`Processing news item ${processed + 1}/${newsItems.length}: ${newsItem.title}`);
        
        // Omarbeta nyheten med AI för att göra den underhållande
        const processedItem = await rewriteNewsWithAI(newsItem);
        console.log(`Rewritten news item: ${processedItem.title}, content length: ${processedItem.content.length}`);
        
        // Spara i databas direkt
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
        
        processed++;
        console.log(`✅ Successfully processed ${processed}/${newsItems.length} news items`);
      } catch (error: any) {
        console.error(`Failed to process news item "${newsItem.title}":`, error);
        console.error(`Error details:`, {
          message: error?.message,
          stack: error?.stack
        });
        // Fortsätt med nästa nyhet även om denna misslyckas
        console.log(`Continuing with next news item...`);
      }
    }
    
    console.log(`Processed ${processed} out of ${newsItems.length} news items`);
  } catch (error: any) {
    console.error('Failed to run general news manager:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    // Returnera antal bearbetade nyheter även om det uppstod ett fel
    // Detta säkerställer att delvis resultat returneras vid timeout
    return { processed, error: error?.message || 'Unknown error' };
  }

  // Publicera på LinkedIn om credentials är konfigurerade
  const linkedInValidation = validateLinkedInCredentials();

  if (linkedInValidation.isValid && processedNews.length > 0) {
    console.log('✅ LinkedIn credentials validated, posting news...');

    try {
      // Generera en säljande och underhållande LinkedIn-sammanfattning av alla nyheter
      const linkedinSummary = await generateLinkedInSummary(processedNews);

      const newsPageUrl = 'https://www.ai-arne.se/#/news';

      // LinkedIn har gräns på ~3000 tecken - säkerställ att vi inte överskrider
      const linkedinText = `${linkedinSummary}\n\n📰 Läs alla nyheter: ${newsPageUrl}`.slice(0, 2500);

      await postToLinkedIn(
        {
          organizationUrn: linkedInValidation.urn!,
          text: linkedinText,
          title: 'AI-nyheter denna vecka',
          link: newsPageUrl
        },
        linkedInValidation.token
      );

      console.log('✅ LinkedIn post published successfully');
    } catch (error: any) {
      console.error(`❌ Failed to post to LinkedIn:`, error?.message || error);
    }
  } else {
    if (!linkedInValidation.isValid) {
      console.warn('⚠️  LinkedIn credentials are not configured properly:');
      linkedInValidation.issues.forEach(issue => console.warn(`   - ${issue}`));
      console.warn('   LinkedIn posting will be skipped. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORG_URN to enable.');
    } else {
      console.log('ℹ️  Skipping LinkedIn post (no news to post)');
    }
  }

  return { processed };
}
