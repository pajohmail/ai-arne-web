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
import { logErrorToFirestore } from './services/errorLog.js';

/**
 * HTTP handler för API-nyhetsagenten
 * 
 * OBS: Denna handler ska normalt anropas via managerHandler, inte direkt.
 * Denna handler kör agenten som övervakar API-releases från stora AI-leverantörer
 * (OpenAI, Google) via GitHub API och skapar innehåll i Firestore.
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
    console.warn('⚠️  apiNewsHandler called directly. Consider using managerHandler instead.');
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runApiNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error('apiNewsHandler error:', err);
    // Logga fel till Firestore
    await logErrorToFirestore(err, 'apiNewsHandler', {
      force: req.query?.force === '1' || req.body?.force === true
    });
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * HTTP handler för generella nyhetsagenten
 * 
 * OBS: Denna handler ska normalt anropas via managerHandler, inte direkt.
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
    console.warn('⚠️  generalNewsHandler called directly. Consider using managerHandler instead.');
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runGeneralNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error('generalNewsHandler error:', err);
    // Logga fel till Firestore
    await logErrorToFirestore(err, 'generalNewsHandler', {
      force: req.query?.force === '1' || req.body?.force === true
    });
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * HTTP handler för manager - kör både API-nyheter och generella nyheter
 * 
 * Detta är huvudendpointen som ska anropas från Cloud Scheduler. Manager ansvarar
 * för att köra alla agenter parallellt, samla resultat och logga fel till Firestore.
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
 *   "apiNews": { "success": true, "processed": 3, "error": null },
 *   "generalNews": { "success": true, "processed": 10, "error": null },
 *   "totalProcessed": 13
 * }
 */
export async function managerHandler(req: any, res: any) {
  try {
    // Kontrollera om force-flaggan är satt (via query parameter eller body)
    const force = req.query?.force === '1' || req.body?.force === true;
    
    console.log('🚀 Manager starting - running all agents in parallel...');
    
    // Kör båda agenterna parallellt med Promise.allSettled för att hantera fel oberoende
    // Detta säkerställer att om en agent misslyckas, fortsätter den andra ändå
    const [apiResult, generalResult] = await Promise.allSettled([
      runApiNewsManager({ force }),
      runGeneralNewsManager({ force })
    ]);
    
    // Extrahera resultat eller fel från varje agent
    const apiNews = apiResult.status === 'fulfilled' 
      ? { success: true, processed: apiResult.value.processed || 0, error: null }
      : { success: false, processed: 0, error: apiResult.reason?.message || 'Unknown error' };
      
    const generalNews = generalResult.status === 'fulfilled' 
      ? { success: true, processed: generalResult.value.processed || 0, error: null }
      : { success: false, processed: 0, error: generalResult.reason?.message || 'Unknown error' };
    
    // Logga fel till Firestore om någon agent misslyckades
    if (!apiNews.success) {
      const error = apiResult.status === 'rejected' ? apiResult.reason : new Error(apiNews.error || 'Unknown error');
      console.error('❌ API News Handler failed:', error);
      await logErrorToFirestore(
        error,
        'apiNewsHandler',
        { force, processed: 0 }
      );
    }
    
    if (!generalNews.success) {
      const error = generalResult.status === 'rejected' ? generalResult.reason : new Error(generalNews.error || 'Unknown error');
      console.error('❌ General News Handler failed:', error);
      await logErrorToFirestore(
        error,
        'generalNewsHandler',
        { force, processed: 0 }
      );
    }
    
    const allSuccess = apiNews.success && generalNews.success;
    const totalProcessed = apiNews.processed + generalNews.processed;
    
    console.log(`✅ Manager completed - API News: ${apiNews.success ? '✅' : '❌'}, General News: ${generalNews.success ? '✅' : '❌'}, Total processed: ${totalProcessed}`);
    
    return res.status(200).json({ 
      ok: allSuccess,
      apiNews,
      generalNews,
      totalProcessed
    });
  } catch (err: any) {
    console.error('❌ Manager Handler error:', err);
    // Logga även manager-fel till Firestore
    await logErrorToFirestore(err, 'managerHandler', {
      force: req.query?.force === '1' || req.body?.force === true
    });
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

