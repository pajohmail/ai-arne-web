import { withFirestore, serverTimestamp, withRetry } from './firestore.js';
import { COLLECTIONS } from './schema.js';
import { slugify, sanitizeHtml } from '../utils/text.js';
import { createResponse } from '../services/responses.js';

export interface UpsertNewsArgs {
  provider: string;
  name: string;
  version?: string;
  summary: string;
  url: string;
}

export interface UpsertGeneralNewsArgs {
  title: string;
  content: string;
  excerpt: string;
  sourceUrl: string;
  source: string;
}

/**
 * Genererar AI-baserat innehåll för API-nyheter
 */
async function generatePostContentWithAI(release: UpsertNewsArgs): Promise<string> {
  const title = `[${release.provider.toUpperCase()}] ${release.name}${release.version ? ' ' + release.version : ''}`;
  
  const prompt = `Du är en AI-nyhetsskribent som skriver om AI-API-utveckling. Skapa en detaljerad artikel på svenska om följande API-release. Skriv på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela artikeln.

Provider: ${release.provider}
Release: ${release.name}${release.version ? ' ' + release.version : ''}
URL: ${release.url}
Sammanfattning: ${release.summary || 'Ingen sammanfattning tillgänglig'}

VIKTIGT: Skriv MINST 500 ord. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

Skapa en underhållande och engagerande artikel på svenska med:
- En introduktion som förklarar vad denna release är och varför den är viktig (med ironisk touch)
- En detaljerad förklaring av vad som är nytt och vad det betyder för utvecklare
- Kontext och bakgrundsinformation om varför denna release är relevant
- Exempel på användningsfall och potentiella fördelar
- Jämförelser med tidigare versioner eller konkurrenter när det är relevant
- En avslutning som sammanfattar vikten av denna release

Formatera innehållet som HTML med p, h2, h3, ul, li tags. Använd svenska språket.
Var underhållande och engagerande - läsaren ska vilja läsa hela artikeln. Använd ironi och svenska humor flitigt genom hela texten.`;

  try {
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 2500,
      temperature: 0.8 // Högre temperatur för mer kreativitet och humor
    });

    console.log(`Post content generated with ${response.provider} API`);
    
    const aiContent = sanitizeHtml(response.content);
    return `<p><strong>${title}</strong></p>${aiContent}\n<p>Källa: <a href="${sanitizeHtml(release.url)}" rel="noopener" target="_blank">${sanitizeHtml(release.url)}</a></p>`;
  } catch (error) {
    console.error(`Failed to generate post content with AI, using fallback:`, error);
    
    // Fallback till manuellt innehåll om AI misslyckas
    return sanitizeHtml(
      [
        `<p><strong>${title}</strong></p>`,
        `<p>${release.summary}</p>`,
        `<p>Källa: <a href="${release.url}" rel="noopener" target="_blank">${release.url}</a></p>`
      ].join('')
    );
  }
}

export async function upsertPostFromRelease(release: UpsertNewsArgs) {
  const slug = slugify(`${release.provider}-${release.name}-${release.version || ''}`);
  const title = `[${release.provider.toUpperCase()}] ${release.name}${release.version ? ' ' + release.version : ''}`;
  
  // Generera innehåll med AI
  const content = await generatePostContentWithAI(release);

  return await withFirestore(async (db) => {
    const postsRef = db.collection(COLLECTIONS.posts);
    const existingQuery = await withRetry<any>(() => postsRef.where('slug', '==', slug).limit(1).get());

    const postData = {
      slug,
      title,
      excerpt: release.summary.slice(0, 280),
      content,
      provider: release.provider,
      sourceUrl: release.url,
      linkedinUrn: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      await withRetry(() => existingDoc.ref.update({
        title,
        content,
        provider: release.provider,
        sourceUrl: release.url,
        updatedAt: serverTimestamp()
      }));
      return {
        id: existingDoc.id,
        slug,
        updated: true
      };
    }

    const docRef = await withRetry<any>(() => postsRef.add(postData));
    return {
      id: docRef.id,
      updated: false
    };
  });
}

export async function upsertGeneralNews(args: UpsertGeneralNewsArgs) {
  const slug = slugify(args.title);
  
  return await withFirestore(async (db) => {
    const newsRef = db.collection(COLLECTIONS.news);
    const existingQuery = await withRetry<any>(() => newsRef.where('slug', '==', slug).limit(1).get());

    const newsData = {
      slug,
      title: args.title,
      excerpt: args.excerpt,
      content: args.content,
      sourceUrl: args.sourceUrl,
      source: args.source,
      linkedinUrn: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      await withRetry(() => existingDoc.ref.update({
        title: args.title,
        excerpt: args.excerpt,
        content: args.content,
        sourceUrl: args.sourceUrl,
        source: args.source,
        updatedAt: serverTimestamp()
      }));
      return {
        id: existingDoc.id,
        slug,
        updated: true
      };
    }

    const docRef = await withRetry<any>(() => newsRef.add(newsData));
    return {
      id: docRef.id,
      slug,
      updated: false
    };
  });
}

export async function upsertTutorialForPost(postId: string, args: { title: string; content: string; url: string; }) {
  return await withFirestore(async (db) => {
    const tutorialsRef = db.collection(COLLECTIONS.tutorials);
    const existingQuery = await withRetry<any>(() => tutorialsRef.where('postId', '==', postId).limit(1).get());

    const tutorialData = {
      postId,
      title: args.title,
      content: args.content,
      sourceUrl: args.url,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      await withRetry(() => existingDoc.ref.update({
        title: args.title,
        content: args.content,
        sourceUrl: args.url,
        updatedAt: serverTimestamp()
      }));
      return {
        id: existingDoc.id,
        updated: true
      };
    }

    const docRef = await withRetry<any>(() => tutorialsRef.add(tutorialData));
    return {
      id: docRef.id,
      updated: false
    };
  });
}

export async function saveUserQuestion(question: string, sessionId?: string) {
  return await withFirestore(async (db) => {
    const questionsRef = db.collection(COLLECTIONS.user_questions);
    
    const questionData: any = {
      question,
      createdAt: serverTimestamp()
    };
    
    if (sessionId) {
      questionData.sessionId = sessionId;
    }

    const docRef = await withRetry<any>(() => questionsRef.add(questionData));
    return {
      id: docRef.id
    };
  });
}

