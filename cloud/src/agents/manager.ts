import { checkProviders, ProviderRelease } from './providers.js';
import { upsertNews } from './newsAgent.js';
import { createOrUpdateTutorial } from './tutorialAgent.js';
import { postToLinkedIn, validateLinkedInCredentials } from '../services/linkedin.js';

type NewsItem = {
  id: string;
  slug: string;
  release: ProviderRelease;
};

export async function runApiNewsManager({ force = false, skipTutorials = false }: { force?: boolean; skipTutorials?: boolean } = {}) {
  const releases = await checkProviders();
  if (!releases.length) return { processed: 0, newsItems: [] };

  let processed = 0;
  const newsItems: NewsItem[] = [];

  // Validera LinkedIn credentials en gång i början
  const linkedInValidation = validateLinkedInCredentials();
  if (!linkedInValidation.isValid) {
    console.warn('⚠️  LinkedIn credentials are not configured properly:');
    linkedInValidation.issues.forEach(issue => console.warn(`   - ${issue}`));
    console.warn('   LinkedIn posting will be skipped. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORG_URN to enable.');
  } else {
    console.log('✅ LinkedIn credentials validated successfully');
  }

  for (const rel of releases.slice(0, 3)) {
    const news = await upsertNews(rel);
    newsItems.push({ id: news.id, slug: news.slug, release: rel });

    // Skapa tutorials direkt om skipTutorials är false (default beteende för apiNewsHandler)
    if (!skipTutorials) {
      await createOrUpdateTutorial(news.id, rel);
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://ai-arne.se';
    const postUrl = `${baseUrl}/post/${news.slug}`;

    // Posta till LinkedIn om credentials är konfigurerade
    if (linkedInValidation.isValid) {
      try {
        const text = [
          `${rel.provider.toUpperCase()} nyhet: ${rel.name}${rel.version ? ' ' + rel.version : ''}`,
          '',
          rel.summary,
          '',
          `Läs mer: ${postUrl}`
        ].join('\n');

        await postToLinkedIn(
          {
            organizationUrn: linkedInValidation.urn!,
            text,
            title: `Nyhet: ${rel.name}`,
            link: postUrl
          },
          linkedInValidation.token
        );
        console.log(`✅ Posted to LinkedIn: ${rel.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to post to LinkedIn for ${rel.provider}:`, error?.message || error);
        // Fortsätt ändå, inte kritiskt
      }
    }

    processed++;
  }

  return { processed, newsItems };
}
