import { runApiNewsManager } from './agents/manager.js';
import { runGeneralNewsManager } from './agents/generalNewsManager.js';
import { createResponse } from './services/responses.js';
import { saveUserQuestion } from './services/upsert.js';

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
  try {
    const { question, sessionId } = req.body || {};
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan saknas eller är ogiltig' 
      });
    }

    const trimmedQuestion = question.trim();
    
    // Validera att frågan är AI-relaterad genom att fråga AI själv
    const validateWithAI = async (q: string): Promise<boolean> => {
      const validationPrompt = `Är följande fråga relaterad till AI (artificiell intelligens), maskininlärning, teknologi, tech-företag eller AI-utveckling?

Fråga: "${q}"

Svara ENDAST med "JA" eller "NEJ" utan någon förklaring.`;

      try {
        const validationResponse = await createResponse(validationPrompt, {
          model: 'gpt-5-mini',
          maxTokens: 10,
          temperature: 0.1
        });

        const answer = validationResponse.content.trim().toLowerCase();
        // Acceptera "ja", "yes", "j", "y" eller varianter
        return answer.startsWith('ja') || answer.startsWith('yes') || answer === 'j' || answer === 'y';
      } catch (err) {
        console.error('Validation error:', err);
        // Vid fel, tillåt frågan (fail-open för bättre användarupplevelse)
        return true;
      }
    };

    // Validera frågan med AI
    const isAiRelated = await validateWithAI(trimmedQuestion);
    
    if (!isAiRelated) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan måste vara relaterad till AI, teknologi eller tech-företag. Försök igen med en relevant fråga.' 
      });
    }

    // Skapa prompt med underhållande ton och ironi
    const prompt = `Du är en AI-nyhetsexpert som svarar på frågor om AI-nyheter och utveckling på ett underhållande sätt med en touch av ironi och svenska humor. 

Frågan: ${trimmedQuestion}

Svara på svenska med:
- Ett engagerande och underhållande svar med en tydlig ironisk touch
- En detaljerad och informativ förklaring baserat på aktuell information
- Sök efter mer information online och inkludera relevanta källor och bakgrundsinformation
- Relevant information om AI-utveckling och nyheter, inklusive kontext och historik när det är lämpligt
- Om du inte vet något säkert, säg det öppet men fortsätt med en grundlig förklaring baserad på generell kunskap

Skriv en längre, mer detaljerad artikel (500-800 ord) som är både informativ och underhållande. Var inte rädd för att vara långrandig - läsaren vill ha djupgående information. Inkludera exempel, jämförelser och relevanta sammanhang.`;

    // Använd Responses API för att generera svar
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 2000,
      temperature: 0.8 // Högre temperatur för mer kreativitet och humor
    });

    // Spara frågan i Firestore (inte svaret)
    try {
      await saveUserQuestion(trimmedQuestion, sessionId);
    } catch (saveError) {
      console.error('Failed to save question to Firestore:', saveError);
      // Fortsätt ändå, sparandet är inte kritiskt
    }

    return res.status(200).json({ 
      ok: true, 
      answer: response.content,
      provider: response.provider
    });
  } catch (err: any) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || 'Ett fel uppstod vid generering av svar' 
    });
  }
}
