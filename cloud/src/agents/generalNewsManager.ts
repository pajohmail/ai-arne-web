import { findTopAINewsWithLLM, processAndUpsertNews } from './generalNewsAgent.js';
import { postToLinkedIn } from '../services/linkedin.js';
import { withFirestore } from '../services/firestore.js';
import { COLLECTIONS } from '../services/schema.js';

/**
 * Huvudfunktion som kör hela flödet för allmänna AI-nyheter
 */
export async function runGeneralNewsManager({ force = false }: { force?: boolean } = {}) {
  // Bearbeta max 10 nyheter per körning (top 10)
  let processed = 0;
  const processedNews: Array<{ id: string; slug: string; title: string; sourceUrl: string }> = [];

  try {
    console.log('Starting general news manager - finding top AI news with LLM...');
    
    // Hitta veckans 10 viktigaste AI-nyheter via LLM
    const newsItems = await findTopAINewsWithLLM();
    
    console.log(`Found ${newsItems.length} news items from LLM`);
    
    if (newsItems.length === 0) {
      console.warn('No news items found by LLM');
      return { processed: 0, error: 'No news items found' };
    }

    console.log('Processing and upserting news items...');
    
    // Bearbeta och spara nyheter
    const count = await processAndUpsertNews(newsItems);
    
    console.log(`Processed ${count} news items`);
    
    if (count > 0) {
      // Hämta sparade nyheter från databasen för att få ID och slug
      const savedNews = await withFirestore(async (db) => {
        const newsRef = db.collection(COLLECTIONS.news);
        const query = await newsRef.orderBy('createdAt', 'desc').limit(count).get();
        return query.docs.map(doc => ({
          id: doc.id,
          slug: doc.data().slug,
          title: doc.data().title,
          sourceUrl: doc.data().sourceUrl
        }));
      });

      processedNews.push(...savedNews);
      processed = count;
    }
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
      !linkedinUrn.includes('123456789')) {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://ai-arne.se';
    
    for (const news of processedNews.slice(0, 3)) {
      const newsUrl = `${baseUrl}/news/${news.slug}`;
      
      const text = [
        `AI-nyhet: ${news.title}`,
        '',
        `Läs mer: ${newsUrl}`
      ].join('\n');

      try {
        await postToLinkedIn(
          {
            organizationUrn: linkedinUrn,
            text,
            title: news.title,
            link: newsUrl
          },
          linkedinToken
        );
      } catch (error) {
        console.error(`Failed to post to LinkedIn:`, error);
        // Fortsätt med nästa nyhet även om LinkedIn-posten misslyckas
      }
    }
  } else {
    console.log(`Skipping LinkedIn posts (credentials not configured)`);
  }

  return { processed };
}
