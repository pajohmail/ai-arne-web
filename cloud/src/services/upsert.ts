/**
 * Service för att spara och uppdatera innehåll i Firestore
 * 
 * Denna modul hanterar alla upsert-operationer (create or update) för:
 * - Posts (API-nyheter från providers)
 * - News (allmänna AI-nyheter)
 * - Tutorials (tutorials för API-releases)
 * - User questions (användarfrågor från chatten)
 * 
 * Använder slug-baserad deduplicering för att undvika dubbletter.
 * 
 * @module upsert
 */

import { withFirestore, serverTimestamp, withRetry } from './firestore.js';
import { COLLECTIONS } from './schema.js';
import { slugify, sanitizeHtml } from '../utils/text.js';
import { createResponse } from './responses.js';

/**
 * Interface för att skapa/uppdatera en post från en provider-release
 */
export interface UpsertNewsArgs {
  /** Provider-namn (t.ex. 'openai', 'anthropic') */
  provider: string;
  /** Release-namn */
  name: string;
  /** Versionsnummer (valfritt) */
  version?: string;
  /** Kort sammanfattning */
  summary: string;
  /** URL till release */
  url: string;
}

/**
 * Interface för att skapa/uppdatera allmänna nyheter
 */
export interface UpsertGeneralNewsArgs {
  /** Nyhetens titel */
  title: string;
  /** Fullständigt HTML-innehåll */
  content: string;
  /** Kort sammanfattning (max 280 tecken) */
  excerpt: string;
  /** URL till originalkällan */
  sourceUrl: string;
  /** Namn på källan */
  source: string;
}

/**
 * Genererar AI-baserat innehåll för API-nyheter
 * 
 * Funktionen använder AI för att skapa en detaljerad artikel (minst 500 ord)
 * om en API-release. Använder web search för att hitta aktuell information.
 * Fallback till manuellt innehåll om AI misslyckas.
 * 
 * @param release - Release-information
 * @returns Promise som resolverar till HTML-innehåll
 * @private
 */
async function generatePostContentWithAI(release: UpsertNewsArgs): Promise<string> {
  const prompt = `Du är en AI-nyhetsskribent som skriver om AI-API-utveckling. Skapa en detaljerad artikel på svenska om följande API-release. Skriv på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela artikeln.

Provider: ${release.provider}
Release: ${release.name}${release.version ? ' ' + release.version : ''}
URL: ${release.url}
Sammanfattning: ${release.summary || 'Ingen sammanfattning tillgänglig'}

VIKTIGT: Skriv MINST 500 ord. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

KRITISKT: Inkludera INTE rubrik eller titel i ditt svar. Börja direkt med artikelns innehåll. Rubriken hanteras separat.

KRITISKT: Du MÅSTE söka aktivt online efter aktuell information om denna release. Använd internet för att hitta de senaste nyheterna, artiklar och källor om denna release. Använd INTE bara din träningsdata - sök aktivt efter ny information.

Skapa en underhållande och engagerande artikel på svenska med:
- En introduktion som förklarar vad denna release är och varför den är viktig (med ironisk touch)
- En detaljerad förklaring av vad som är nytt och vad det betyder för utvecklare
- Kontext och bakgrundsinformation om varför denna release är relevant (sök online för aktuell information)
- Exempel på användningsfall och potentiella fördelar
- Jämförelser med tidigare versioner eller konkurrenter när det är relevant
- En avslutning som sammanfattar vikten av denna release
- Inkludera länkar och källor från dina online-sökningar

Formatera innehållet som HTML med p, h2, h3, ul, li tags. Använd svenska språket.
Var underhållande och engagerande - läsaren ska vilja läsa hela artikeln. Använd ironi och svenska humor flitigt genom hela texten.`;

  try {
    console.log(`🤖 Generating AI content for ${release.provider} - ${release.name}${release.version ? ' ' + release.version : ''}`);
    
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 5000, // Ökad för att hantera långa artiklar (500+ ord) med web search
      temperature: 0.8, // Ignoreras för Responses API, men behålls för dokumentation
      enableWebSearch: true // Aktivera web search för att hitta aktuell information
    });

    const contentLength = response.content.length;
    const wordCount = response.content.split(/\s+/).length;
    
    console.log(`✅ Post content generated with ${response.provider.toUpperCase()} API`);
    console.log(`   Content length: ${contentLength} chars, ~${wordCount} words`);
    
    if (wordCount < 400) {
      console.warn(`⚠️  WARNING: Generated content is shorter than expected (${wordCount} words, expected 500+)`);
    }
    
    const aiContent = sanitizeHtml(response.content);
    return `${aiContent}\n<p>Källa: <a href="${sanitizeHtml(release.url)}" rel="noopener" target="_blank">${sanitizeHtml(release.url)}</a></p>`;
  } catch (error: any) {
    console.error(`❌ Failed to generate post content with AI, using fallback:`, error);
    console.error(`   Error details:`, {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      code: error?.code
    });
    console.warn(`⚠️  FALLBACK MODE: Using summary instead of AI-generated content`);
    
    // Fallback till manuellt innehåll om AI misslyckas
    // OBS: Inkludera INTE titel här - den hanteras separat i title-fältet
    return sanitizeHtml(
      [
        `<p>${release.summary}</p>`,
        `<p>Källa: <a href="${release.url}" rel="noopener" target="_blank">${release.url}</a></p>`
      ].join('')
    );
  }
}

/**
 * Sparar eller uppdaterar en post i Firestore från en provider-release
 * 
 * Funktionen genererar AI-innehåll, skapar en slug, och sparar/uppdaterar
 * posten i Firestore. Om en post med samma slug redan finns, uppdateras den.
 * 
 * @param release - Release-information från provider
 * @returns Promise som resolverar till resultat med ID, slug och updated-flagga
 * 
 * @example
 * const result = await upsertPostFromRelease({
 *   provider: 'openai',
 *   name: 'GPT-5',
 *   version: '1.0.0',
 *   summary: 'Ny modell...',
 *   url: 'https://github.com/...'
 * });
 */
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
      slug,
      updated: false
    };
  });
}

/**
 * Sparar eller uppdaterar allmänna nyheter i Firestore
 * 
 * Funktionen skapar en slug från titeln och sparar/uppdaterar nyheten
 * i Firestore. Om en nyhet med samma slug redan finns, uppdateras den.
 * 
 * @param args - Nyhetsinformation
 * @returns Promise som resolverar till resultat med ID, slug och updated-flagga
 * 
 * @example
 * const result = await upsertGeneralNews({
 *   title: 'OpenAI släpper GPT-5',
 *   content: '<p>Fullständigt innehåll...</p>',
 *   excerpt: 'Kort sammanfattning...',
 *   sourceUrl: 'https://example.com',
 *   source: 'TechCrunch'
 * });
 */
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

/**
 * Sparar eller uppdaterar en tutorial i Firestore för en post
 * 
 * Funktionen sparar/uppdaterar en tutorial som är kopplad till en specifik post.
 * Om en tutorial för samma postId redan finns, uppdateras den.
 * 
 * @param postId - Firestore document ID för den relaterade posten
 * @param args - Tutorial-information
 * @param args.title - Tutorial-titel
 * @param args.content - Fullständigt HTML-innehåll
 * @param args.url - URL till källan
 * @returns Promise som resolverar till resultat med ID och updated-flagga
 * 
 * @example
 * const result = await upsertTutorialForPost(postId, {
 *   title: 'Kom igång med GPT-5',
 *   content: '<h2>Introduktion</h2><p>...</p>',
 *   url: 'https://github.com/...'
 * });
 */
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

/**
 * Sparar en användarfråga i Firestore
 * 
 * Funktionen sparar användarfrågor från chatten i Firestore för analys.
 * SessionId är valfritt och används för att gruppera frågor från samma session.
 * 
 * @param question - Användarens fråga
 * @param sessionId - Valfritt session-ID för att gruppera frågor
 * @returns Promise som resolverar till resultat med document ID
 * 
 * @example
 * const result = await saveUserQuestion('Vad är GPT-5?', 'session-123');
 * console.log(`Saved question with ID: ${result.id}`);
 */
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
