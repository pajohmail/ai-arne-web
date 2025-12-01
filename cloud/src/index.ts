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
  const startTime = Date.now();
  console.log('🚀 managerHandler started at', new Date().toISOString());

  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    console.log(`📋 Parameters: force=${force}`);

    // STEG 1: Kör både API-nyheter och generella nyheter UTAN tutorials
    console.log('📰 Step 1: Running news managers (skipping tutorials)...');
    const step1Start = Date.now();

    const [apiResult, generalResult] = await Promise.allSettled([
      runApiNewsManager({ force, skipTutorials: true }), // Hoppa över tutorials i detta steg
      runGeneralNewsManager({ force })
    ]);

    const step1Duration = Date.now() - step1Start;
    console.log(`✅ Step 1 completed in ${step1Duration}ms`);

    const apiNews = apiResult.status === 'fulfilled' ? apiResult.value : { processed: 0, newsItems: [], error: apiResult.reason?.message };
    const generalNews = generalResult.status === 'fulfilled' ? generalResult.value : { processed: 0, error: generalResult.reason?.message };

    console.log(`📊 News processed - API: ${apiNews.processed}, General: ${generalNews.processed}`);

    // Logga fel till Firestore om någon agent misslyckades
    if (apiResult.status === 'rejected') {
      console.error('❌ API News Handler failed:', apiResult.reason);
      await logErrorToFirestore(
        apiResult.reason,
        'apiNewsHandler',
        { force, processed: 0 }
      );
    }

    if (generalResult.status === 'rejected') {
      console.error('❌ General News Handler failed:', generalResult.reason);
      await logErrorToFirestore(
        generalResult.reason,
        'generalNewsHandler',
        { force, processed: 0 }
      );
    }

    // STEG 2: Skapa tutorials för API-nyheter
    let tutorialsCreated = 0;
    if (apiNews.newsItems && apiNews.newsItems.length > 0) {
      console.log(`📚 Step 2: Creating tutorials for ${apiNews.newsItems.length} API news items...`);
      const step2Start = Date.now();

      const { createOrUpdateTutorial } = await import('./agents/tutorialAgent.js');

      for (const newsItem of apiNews.newsItems) {
        try {
          await createOrUpdateTutorial(newsItem.id, newsItem.release);
          tutorialsCreated++;
          console.log(`  ✅ Tutorial created for: ${newsItem.release.name}`);
        } catch (tutorialError: any) {
          console.error(`  ❌ Failed to create tutorial for ${newsItem.release.name}:`, tutorialError?.message);
          // Fortsätt med nästa tutorial även om en misslyckas
        }
      }

      const step2Duration = Date.now() - step2Start;
      console.log(`✅ Step 2 completed in ${step2Duration}ms - ${tutorialsCreated} tutorials created`);
    } else {
      console.log('ℹ️  Step 2: No API news items to create tutorials for');
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ managerHandler completed successfully in ${totalDuration}ms`);

    return res.status(200).json({
      ok: true,
      apiNews: {
        processed: apiNews.processed,
        error: 'error' in apiNews ? apiNews.error : undefined
      },
      generalNews: {
        processed: generalNews.processed,
        error: 'error' in generalNews ? generalNews.error : undefined
      },
      tutorials: {
        created: tutorialsCreated
      },
      totalProcessed: (apiNews.processed || 0) + (generalNews.processed || 0),
      duration: `${totalDuration}ms`
    });
  } catch (err: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ managerHandler failed after ${totalDuration}ms:`, err);
    await logErrorToFirestore(err, 'managerHandler', {
      force: req.query?.force === '1' || req.body?.force === true
    });
    return res.status(500).json({
      ok: false,
      error: err?.message || 'unknown error',
      duration: `${totalDuration}ms`
    });
  }
}

