/**
 * Service för Firestore-databasoperationer
 * 
 * Denna modul tillhandahåller helper-funktioner för att arbeta med Firestore:
 * - Initialisering och connection management
 * - Timestamp-konverteringar
 * - Retry-logik för transienta fel
 * 
 * Använder Application Default Credentials (ADC) i Cloud Functions.
 * För lokal utveckling krävs GOOGLE_APPLICATION_CREDENTIALS.
 * 
 * @module firestore
 */

import { Firestore, FieldValue } from '@google-cloud/firestore';

/** Singleton-instans av Firestore-klienten */
let firestore: Firestore | null = null;

/**
 * Hämtar eller skapar Firestore-klienten
 * 
 * Funktionen använder singleton-pattern för att säkerställa att endast
 * en Firestore-instans skapas. Använder Application Default Credentials
 * i Cloud Functions.
 * 
 * @returns Firestore-klienten
 * 
 * @example
 * const db = getFirestore();
 * const doc = await db.collection('posts').doc('id').get();
 */
export function getFirestore() {
  if (!firestore) {
    firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT!,
      // I Cloud Functions använder vi default credentials
      // Lokalt behöver du sätta GOOGLE_APPLICATION_CREDENTIALS
    });
  }
  return firestore;
}

/**
 * Wrapper för att köra kod med Firestore-klienten
 * 
 * Funktionen säkerställer att Firestore-klienten är initialiserad
 * och tillhandahåller den till callback-funktionen.
 * 
 * @param fn - Callback-funktion som tar Firestore-klienten som parameter
 * @returns Promise som resolverar till resultatet från callback-funktionen
 * 
 * @example
 * const result = await withFirestore(async (db) => {
 *   return await db.collection('posts').doc('id').get();
 * });
 */
export async function withFirestore<T>(fn: (db: Firestore) => Promise<T>) {
  const db = getFirestore();
  return await fn(db);
}

/**
 * Konverterar Firestore timestamp till ISO string
 * 
 * @param timestamp - Firestore timestamp-objekt
 * @returns ISO string-representation av datumet
 * 
 * @example
 * const iso = timestampToISO(firestoreTimestamp);
 * console.log(iso); // "2024-01-01T12:00:00.000Z"
 */
export function timestampToISO(timestamp: any): string {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Konverterar ISO string till Date-objekt för Firestore
 * 
 * @param isoString - ISO string-representation av datumet
 * @returns Date-objekt
 * 
 * @example
 * const date = isoToTimestamp('2024-01-01T12:00:00.000Z');
 */
export function isoToTimestamp(isoString: string) {
  return new Date(isoString);
}

/**
 * Skapar en server timestamp för Firestore
 * 
 * Används för att sätta createdAt/updatedAt-fält som ska sättas
 * av Firestore-servern (inte klienten) för konsistens.
 * 
 * @returns FieldValue för server timestamp
 * 
 * @example
 * await docRef.set({
 *   createdAt: serverTimestamp(),
 *   updatedAt: serverTimestamp()
 * });
 */
export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

/**
 * Retry-helper för transienta Firestore-fel
 * 
 * Funktionen försöker köra en funktion och retryar automatiskt vid fel
 * med exponential backoff. Användbart för att hantera transienta nätverksfel.
 * 
 * @param fn - Funktion att köra med retry
 * @param retries - Antal retries kvar (default: 2)
 * @returns Promise som resolverar till resultatet från funktionen
 * @throws Error om alla retries misslyckas
 * 
 * @example
 * const result = await withRetry(async () => {
 *   return await db.collection('posts').doc('id').get();
 * });
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;
    // Simple backoff
    await new Promise((r) => setTimeout(r, 150 * (3 - retries)));
    return withRetry(fn, retries - 1);
  }
}
