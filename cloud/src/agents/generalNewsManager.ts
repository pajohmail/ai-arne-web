import { findTopAINewsWithLLM, processAndUpsertNews } from './generalNewsAgent.js';
import { postToLinkedIn } from '../services/linkedin.js';
import { withFirestore } from '../services/firestore.js';
import { COLLECTIONS } from '../services/schema.js';
import { createResponse } from '../services/responses.js';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  content: string;
  excerpt: string;
}

/**
 * Genererar en säljande och underhållande LinkedIn-sammanfattning av nyheter med AI
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
 * @param force - För framtida användning (t.ex. för att hoppa över "har redan kört idag"-check)
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

    console.log('Processing and upserting news items...');
    
    // Bearbeta och spara nyheter - får tillbaka de faktiska sparade objekten
    processedNews = await processAndUpsertNews(newsItems);
    processed = processedNews.length;
    
    console.log(`Processed ${processed} news items`);
  } catch (error: any) {
    console.error('Failed to run general news manager:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return { processed: 0, error: error?.message || 'Unknown error' };
  }

  // Publicera på LinkedIn (hoppa över om credentials är placeholders)
  const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const linkedinUrn = process.env.LINKEDIN_ORG_URN;
  
  if (linkedinToken && linkedinUrn && 
      linkedinToken !== 'placeholder' && 
      linkedinUrn !== 'urn:li:organization:0' &&
      !linkedinUrn.includes('123456789') &&
      processedNews.length > 0) {
    try {
      // Generera en säljande och underhållande LinkedIn-sammanfattning av alla nyheter
      const linkedinSummary = await generateLinkedInSummary(processedNews);
      
      const newsPageUrl = 'https://www.ai-arne.se/#/news';
      
      // LinkedIn har gräns på ~3000 tecken - säkerställ att vi inte överskrider
      const linkedinText = `${linkedinSummary}\n\n📰 Läs alla nyheter: ${newsPageUrl}`.slice(0, 2500);

      await postToLinkedIn(
        {
          organizationUrn: linkedinUrn,
          text: linkedinText,
          title: 'AI-nyheter denna vecka',
          link: newsPageUrl
        },
        linkedinToken
      );
      
      console.log('✅ LinkedIn post published successfully');
    } catch (error) {
      console.error(`Failed to post to LinkedIn:`, error);
    }
  } else {
    console.log(`Skipping LinkedIn posts (credentials not configured or no news)`);
  }

  return { processed };
}
