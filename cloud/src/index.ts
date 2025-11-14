/**
 * Cloud Functions entry point för AI-Arne agentsystem
 * 
 * Detta är huvudfilen som exporterar alla HTTP handlers för Google Cloud Functions.
 * Varje handler är en serverless-funktion som kan triggas via HTTP-anrop eller Cloud Scheduler.
 * 
 * @module index
 */

import { runApiNewsManager } from './agents/manager.js';
import { runGeneralNewsManager } from './agents/generalNewsManager.js';

/**
 * HTTP handler för API-nyhetsagenten
 * 
 * Denna handler kör agenten som övervakar API-releases från stora AI-leverantörer
 * (OpenAI, Anthropic, Google) via GitHub API och skapar innehåll i Firestore.
 * 
 * @param req - Express/Cloud Functions request-objekt
 * @param req.query.force - Om satt till '1', tvingar körning även om den redan körts idag
 * @param req.body.force - Alternativt kan force skickas i request body som boolean
 * @param res - Express/Cloud Functions response-objekt
 * @returns JSON-response med status och resultat
 * 
 * @example
 * // Trigger via HTTP GET
 * GET /apiNewsHandler?force=1
 * 
 * // Response format
 * {
 *   "ok": true,
 *   "processed": 3
 * }
 */
export async function apiNewsHandler(req: any, res: any) {
  try {
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runApiNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error('apiNewsHandler error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * HTTP handler för generella nyhetsagenten
 * 
 * Denna handler kör agenten som använder LLM för att hitta och bearbeta
 * allmänna AI-nyheter från webben, skapar innehåll i Firestore och publicerar på LinkedIn.
 * 
 * @param req - Express/Cloud Functions request-objekt
 * @param req.query.force - Om satt till '1', tvingar körning även om den redan körts idag
 * @param req.body.force - Alternativt kan force skickas i request body som boolean
 * @param res - Express/Cloud Functions response-objekt
 * @returns JSON-response med status och resultat
 * 
 * @example
 * // Trigger via HTTP GET
 * GET /generalNewsHandler?force=1
 * 
 * // Response format
 * {
 *   "ok": true,
 *   "processed": 10
 * }
 */
export async function generalNewsHandler(req: any, res: any) {
  try {
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runGeneralNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error('generalNewsHandler error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * HTTP handler för bakåtkompatibilitet - kör både API-nyheter och generella nyheter
 * 
 * Denna handler kör båda agenterna parallellt och returnerar kombinerat resultat.
 * Används för bakåtkompatibilitet med äldre system som förväntar sig en enda endpoint.
 * 
 * @param req - Express/Cloud Functions request-objekt
 * @param req.query.force - Om satt till '1', tvingar körning även om den redan körts idag
 * @param req.body.force - Alternativt kan force skickas i request body som boolean
 * @param res - Express/Cloud Functions response-objekt
 * @returns JSON-response med status och kombinerat resultat från båda agenterna
 * 
 * @example
 * // Trigger via HTTP GET
 * GET /managerHandler?force=1
 * 
 * // Response format
 * {
 *   "ok": true,
 *   "apiNews": { "processed": 3 },
 *   "generalNews": { "processed": 10 },
 *   "totalProcessed": 13
 * }
 */
export async function managerHandler(req: any, res: any) {
  try {
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    
    // Kör båda agenterna parallellt med Promise.allSettled för att hantera fel oberoende
    // Detta säkerställer att om en agent misslyckas, fortsätter den andra ändå
    const [apiResult, generalResult] = await Promise.allSettled([
      runApiNewsManager({ force }),
      runGeneralNewsManager({ force })
    ]);
    
    // Extrahera resultat eller fel från varje agent
    const apiNews = apiResult.status === 'fulfilled' 
      ? apiResult.value 
      : { processed: 0, error: apiResult.reason?.message };
    const generalNews = generalResult.status === 'fulfilled' 
      ? generalResult.value 
      : { processed: 0, error: generalResult.reason?.message };
    
    return res.status(200).json({ 
      ok: true, 
      apiNews: apiNews,
      generalNews: generalNews,
      totalProcessed: (apiNews.processed || 0) + (generalNews.processed || 0)
    });
  } catch (err: any) {
    console.error('managerHandler error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

