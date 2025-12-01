import { findTopAINewsWithLLM, processAndUpsertNews } from './generalNewsAgent.js';
import { postToLinkedIn, validateLinkedInCredentials } from '../services/linkedin.js';
import { withFirestore } from '../services/firestore.js';
import { COLLECTIONS } from '../services/schema.js';

/**
 * Huvudfunktion som kör hela flödet för allmänna AI-nyheter
 */
export async function runGeneralNewsManager({ force = false }: { force?: boolean } = {}) {
  const startTime = Date.now();
  console.log('📰 runGeneralNewsManager started at', new Date().toISOString());
  console.log(`📋 Parameters: force=${force}`);
  
  // Bearbeta max 10 nyheter per körning (top 10)
  let processed = 0;
  const processedNews: Array<{ id: string; slug: string; title: string; sourceUrl: string }> = [];

  try {
    console.log('🔍 Step 1: Finding top AI news with LLM...');
    const step1Start = Date.now();
    
    // Hitta veckans 10 viktigaste AI-nyheter via LLM
    const newsItems = await findTopAINewsWithLLM();
    
    const step1Duration = Date.now() - step1Start;
    console.log(`✅ Step 1 completed in ${step1Duration}ms`);
    console.log(`📰 Found ${newsItems.length} news items from LLM`);
    
    if (newsItems.length === 0) {
      console.warn('⚠️ No news items found by LLM');
      return { processed: 0, error: 'No news items found' };
    }

    console.log('🔄 Step 2: Processing and upserting news items...');
    const step2Start = Date.now();
    
    // Bearbeta och spara nyheter
    const count = await processAndUpsertNews(newsItems);
    
    const step2Duration = Date.now() - step2Start;
    console.log(`✅ Step 2 completed in ${step2Duration}ms`);
    console.log(`💾 Processed ${count} news items`);
    
    if (count > 0) {
      console.log('🔍 Step 3: Fetching saved news from database...');
      const step3Start = Date.now();
      
      // Hämta sparade nyheter från databasen för att få ID och slug
      const savedNews = await withFirestore(async (db) => {
        const newsRef = db.collection(COLLECTIONS.news);
        const query = await newsRef.orderBy('createdAt', 'desc').limit(count).get();
        const docs = query.docs.map(doc => ({
          id: doc.id,
          slug: doc.data().slug,
          title: doc.data().title,
          sourceUrl: doc.data().sourceUrl
        }));
        console.log(`📊 Retrieved ${docs.length} saved news items from Firestore`);
        return docs;
      });

      const step3Duration = Date.now() - step3Start;
      console.log(`✅ Step 3 completed in ${step3Duration}ms`);
      
      processedNews.push(...savedNews);
      processed = count;
      
      console.log(`📋 Summary: ${processed} news items processed and saved`);
      console.log(`📝 News titles:`, processedNews.map(n => n.title).join(', '));
    } else {
      console.warn('⚠️ No news items were processed');
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`✅ runGeneralNewsManager completed successfully in ${totalDuration}ms`);
    console.log(`📊 Final result: processed=${processed}, newsCount=${processedNews.length}`);
    
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ runGeneralNewsManager failed after ${totalDuration}ms`);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });
    return { processed: 0, error: error?.message || 'Unknown error' };
  }

  // Publicera på LinkedIn om credentials är konfigurerade
  const linkedInValidation = validateLinkedInCredentials();

  if (linkedInValidation.isValid) {
    console.log('✅ LinkedIn credentials validated, posting news...');
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
            organizationUrn: linkedInValidation.urn!,
            text,
            title: news.title,
            link: newsUrl
          },
          linkedInValidation.token
        );
        console.log(`✅ Posted to LinkedIn: ${news.title}`);
      } catch (error: any) {
        console.error(`❌ Failed to post to LinkedIn:`, error?.message || error);
        // Fortsätt med nästa nyhet även om LinkedIn-posten misslyckas
      }
    }
  } else {
    console.warn('⚠️  LinkedIn credentials are not configured properly:');
    linkedInValidation.issues.forEach(issue => console.warn(`   - ${issue}`));
    console.warn('   LinkedIn posting will be skipped. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORG_URN to enable.');
  }

  return { processed };
}
