/**
 * Manager för API-nyheter från stora AI-leverantörer
 *
 * Denna modul koordinerar flödet för API-nyheter:
 * - Hämtar releases från GitHub för OpenAI, Anthropic och Google
 * - Skapar innehåll i Firestore med AI-genererat innehåll
 * - Genererar tutorials för varje release
 * - Publicerar på LinkedIn
 *
 * @module manager
 */

import { checkProviders, ProviderRelease } from './providers.js';
import { upsertNews } from './newsAgent.js';
import { createOrUpdateTutorial } from './tutorialAgent.js';
import { postToLinkedIn, validateLinkedInCredentials } from '../services/linkedin.js';

type NewsItem = {
  id: string;
  slug: string;
  release: ProviderRelease;
};

/**
 * Huvudfunktion som kör hela flödet för API-nyheter
 *
 * Funktionen:
 * 1. Hämtar senaste releases från GitHub (OpenAI, Anthropic, Google)
 * 2. Bearbetar max 3 senaste releases
 * 3. Skapar AI-genererat innehåll och sparar i Firestore
 * 4. Genererar tutorials för varje release (om skipTutorials är false)
 * 5. Publicerar på LinkedIn (om credentials är konfigurerade)
 *
 * @param options - Konfigurationsalternativ
 * @param options.force - Om true, hoppar över eventuella "har redan kört idag"-kontroller
 * @param options.skipTutorials - Om true, hoppar över tutorial-generering (används av managerHandler)
 * @returns Promise som resolverar till resultat med antal bearbetade releases och news items
 *
 * @example
 * const result = await runApiNewsManager({ force: true });
 * console.log(`Processed ${result.processed} releases`);
 */
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
