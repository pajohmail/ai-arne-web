/**
 * Enkel wrapper för att spara API-nyheter i Firestore
 * 
 * Denna modul är en tunn wrapper runt upsertPostFromRelease för att
 * konvertera ProviderRelease till format som krävs för Firestore.
 * 
 * @module newsAgent
 */

import { ProviderRelease } from './providers.js';
import { upsertPostFromRelease } from '../services/upsert.js';

/**
 * Sparar eller uppdaterar en API-nyhet i Firestore
 * 
 * Funktionen konverterar en ProviderRelease till format som krävs för
 * upsertPostFromRelease och sparar/uppdaterar i Firestore.
 * 
 * @param release - Release-information från provider (GitHub)
 * @returns Promise som resolverar till resultat med ID, slug och updated-flagga
 * 
 * @example
 * const result = await upsertNews({
 *   provider: 'openai',
 *   name: 'GPT-5',
 *   version: '1.0.0',
 *   summary: 'Ny modell...',
 *   url: 'https://github.com/...'
 * });
 */
export async function upsertNews(release: ProviderRelease) {
  return await upsertPostFromRelease({
    provider: release.provider,
    name: release.name,
    version: release.version,
    summary: release.summary,
    url: release.url
  });
}
