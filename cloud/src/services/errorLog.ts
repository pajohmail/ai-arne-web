/**
 * Service för felrapportering till Firestore
 * 
 * Denna modul tillhandahåller funktioner för att logga fel från agenter
 * till Firestore, så att de kan läsas och visas på webbplatsen.
 * 
 * @module errorLog
 */

import { withFirestore } from './firestore.js';
import { COLLECTIONS } from './schema.js';
import { serverTimestamp } from './firestore.js';

/**
 * Loggar ett fel till Firestore errorLogs collection
 * 
 * Funktionen sparar felinformation i Firestore så att den kan läsas
 * och visas på webbplatsen. Används för att spåra problem med agenter.
 * 
 * @param error - Error-objekt eller annat fel som ska loggas
 * @param context - Kontext där felet uppstod (t.ex. "apiNewsHandler", "generalNewsHandler")
 * @param metadata - Ytterligare metadata att spara med felet (t.ex. force flag, processed count)
 * @returns Promise som resolverar när felet är sparat
 * 
 * @example
 * try {
 *   await runApiNewsManager({ force: true });
 * } catch (error) {
 *   await logErrorToFirestore(error, 'apiNewsHandler', { force: true });
 * }
 */
export async function logErrorToFirestore(
  error: Error | any,
  context: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await withFirestore(async (db) => {
      const errorLogRef = db.collection(COLLECTIONS.errorLogs);
      await errorLogRef.add({
        timestamp: serverTimestamp(),
        context,
        message: error?.message || String(error) || 'Unknown error',
        stack: error?.stack || null,
        metadata: metadata || {},
        severity: 'error'
      });
      console.log(`✅ Error logged to Firestore: ${context} - ${error?.message || 'Unknown error'}`);
    });
  } catch (logError) {
    // Om vi inte kan logga till Firestore, logga till console istället
    console.error(`❌ Failed to log error to Firestore:`, logError);
    console.error(`Original error (${context}):`, error);
  }
}

