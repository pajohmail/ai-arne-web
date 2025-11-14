import { runApiNewsManager } from './agents/manager.js';
import { runGeneralNewsManager } from './agents/generalNewsManager.js';
import { createResponse } from './services/responses.js';
import { saveUserQuestion } from './services/upsert.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function apiNewsHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runApiNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

export async function generalNewsHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runGeneralNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

// Behåll för bakåtkompatibilitet - kör både API-nyheter och generella nyheter
export async function managerHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    
    // Kör både API-nyheter och generella nyheter
    const [apiResult, generalResult] = await Promise.allSettled([
      runApiNewsManager({ force }),
      runGeneralNewsManager({ force })
    ]);
    
    const apiNews = apiResult.status === 'fulfilled' ? apiResult.value : { processed: 0, error: apiResult.reason?.message };
    const generalNews = generalResult.status === 'fulfilled' ? generalResult.value : { processed: 0, error: generalResult.reason?.message };
    
    return res.status(200).json({ 
      ok: true, 
      apiNews: apiNews,
      generalNews: generalNews,
      totalProcessed: (apiNews.processed || 0) + (generalNews.processed || 0)
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * Chat handler för att hantera användarfrågor om AI-nyheter
 * Använder Responses API för att generera underhållande svar med ironi
 */
export async function chatHandler(req: any, res: any) {
  const startTime = Date.now();
  console.log(`🚀 Chat handler started at ${new Date().toISOString()}`);
  
  try {
    const { question, sessionId } = req.body || {};
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan saknas eller är ogiltig' 
      });
    }

    const trimmedQuestion = question.trim();
    console.log(`📝 Received question: "${trimmedQuestion.substring(0, 100)}..."`);
    
    // Enkel snabb validering - bara blockera uppenbart irrelevanta frågor
    // Vi hoppar över AI-validering för att spara tid
    const obviousIrrelevantKeywords = [
      'recept', 'mat', 'matlagning', 'kök', 'baka', 'tårta', 'kaka',
      'middag', 'lunch', 'frukost', 'ingrediens', 'kräm', 'sås',
      'sport', 'fotboll', 'hockey', 'tennis', 'golf', 'träning',
      'hälsa', 'sjukdom', 'medicin', 'läkare', 'sjukvård'
    ];
    const qLower = trimmedQuestion.toLowerCase();
    const isObviouslyIrrelevant = obviousIrrelevantKeywords.some(keyword => qLower.includes(keyword));
    
    if (isObviouslyIrrelevant) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan verkar inte vara relaterad till AI eller teknologi. Försök igen med en relevant fråga.' 
      });
    }

    // Skapa prompt med underhållande ton och ironi
    console.log(`🤖 Generating chat response for question: "${trimmedQuestion.substring(0, 50)}..."`);
    const currentDate = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const prompt = `Du är en AI-nyhetsexpert som svarar på frågor om AI-nyheter och utveckling på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela svaret.

VIKTIGT - DAGENS DATUM: ${currentDate} (${currentYear}-${String(currentMonth).padStart(2, '0')})

Frågan: ${trimmedQuestion}

KRITISKA INSTRUKTIONER - LÄS NOGA:
1. Du HAR tillgång till websökningar - DU MÅSTE använda dem för att hitta de SENASTE nyheterna från ${currentYear}
2. Gör websökningar för att hitta aktuell information om ämnet - använd ALDRIG bara din träningsdata
3. Prioritera information från de senaste 3 månaderna (${currentYear})
4. Inkludera länkar och källor från dina websökningar
5. Om informationen är äldre än 6 månader, markera det tydligt
6. Din träningsdata slutar typ april 2024 - använd ALLTID websökningar för aktuell information

VIKTIGT: Skriv MINST 500 ord. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

STEG-FÖR-STEG PROCESS:
1. Gör först en websökning om ämnet för att hitta de senaste nyheterna från ${currentYear}
2. Hitta minst 3-5 aktuella källor från de senaste 3 månaderna
3. Basera ditt svar PRIMÄRT på dessa websökningar - INTE på din träningsdata
4. Inkludera länkar till källorna du hittar
5. Om informationen är äldre än 6 månader, markera det tydligt

Svara på svenska med:
- Ett engagerande och underhållande svar med en tydlig ironisk touch genom hela texten
- En detaljerad och informativ förklaring baserat på AKTUELL information från websökningar (MINST 500 ord)
- Specifika länkar och källor från dina websökningar
- Datum för när informationen är från (prioritera senaste 3 månaderna från ${currentYear})
- Om informationen är äldre, markera det tydligt
- Relevant information om AI-utveckling och nyheter, inklusive kontext och historik när det är lämpligt

Kom ihåg: Använd websökningar för att hitta aktuell information från ${currentYear}. Prioritera information från de senaste 3 månaderna och inkludera länkar till källorna. Använd ALDRIG bara din träningsdata.

Skriv en längre, mer detaljerad artikel (MINST 500 ord, gärna 600-800 ord) som är både informativ och underhållande. Var inte rädd för att vara långrandig - läsaren vill ha djupgående information. Inkludera exempel, jämförelser och relevanta sammanhang. Använd ironi och svenska humor flitigt för att göra läsningen mer engagerande.`;

    // Använd createResponse helper med web search aktiverat för bättre hantering
    console.log(`🌐 Using createResponse helper with web search enabled`);
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini', // Använd gpt-5-mini för snabbare svar
      maxTokens: 1500, // Minska från 2000 till 1500 för snabbare svar
      enableWebSearch: true // KRITISKT: Aktivera web search
    });
    
    const contentLength = response.content.length;
    const wordCount = response.content.split(/\s+/).length;
    
    console.log(`✅ Chat response generated using ${response.provider.toUpperCase()} API`);
    console.log(`   Content length: ${contentLength} chars, ~${wordCount} words`);
    
    if (wordCount < 400) {
      console.warn(`⚠️  WARNING: Generated response is shorter than expected (${wordCount} words, expected 500+)`);
    }

    // Spara frågan i Firestore (inte svaret) - förbättrad felhantering
    try {
      console.log(`💾 Saving question to Firestore...`);
      const saveResult = await saveUserQuestion(trimmedQuestion, sessionId);
      console.log(`✅ Question saved successfully with ID: ${saveResult.id}`);
    } catch (saveError: any) {
      console.error('❌ Failed to save question to Firestore:', saveError);
      console.error(`   Error details: ${saveError?.message || 'Unknown error'}`);
      console.error(`   Stack: ${saveError?.stack || 'No stack trace'}`);
      // Fortsätt ändå, sparandet är inte kritiskt för att returnera svaret
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Chat handler completed successfully in ${totalTime}ms`);
    
    return res.status(200).json({ 
      ok: true, 
      answer: response.content,
      provider: response.provider
    });
  } catch (err: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Chat handler error after ${totalTime}ms:`, err);
    
    // Hantera abort-signaler specifikt
    if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal')) {
      console.error('⚠️  Request was aborted - likely timeout or client disconnect');
      return res.status(504).json({ 
        ok: false, 
        error: 'Request timeout - API-anropet tog för lång tid. Försök igen med en kortare fråga.',
        timeout: true
      });
    }
    
    const errorMessage = err?.message || 'Ett fel uppstod vid generering av svar';
    const errorDetails = {
      message: errorMessage,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
    };
    console.error('Chat handler error details:', errorDetails);
    
    return res.status(500).json({ 
      ok: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
}
