/**
 * Provider-hämtning för AI-leverantörers releases
 * 
 * Denna modul hämtar senaste releases från GitHub för stora AI-leverantörer:
 * - OpenAI (openai-node SDK)
 * - Google (generative-ai-js SDK)
 * - Anthropic (anthropic-sdk-typescript)
 * 
 * Filtrerar releases till endast de från senaste veckan.
 * 
 * @module providers
 */

import axios from 'axios';
import { isWithinLastWeek } from '../utils/time.js';

/**
 * Interface för en release från en AI-provider
 */
export type ProviderRelease = {
  /** Provider-namn */
  provider: 'openai' | 'google' | 'anthropic' | 'mistral' | 'perplexity' | 'other';
  /** Release-namn */
  name: string;
  /** Versionsnummer (valfritt) */
  version?: string;
  /** Typ av release */
  kind: 'api' | 'model' | 'sdk';
  /** Publiceringsdatum (ISO string) */
  publishedAt: string;
  /** URL till release på GitHub */
  url: string;
  /** Kort sammanfattning (max 300 tecken) */
  summary: string;
};

/**
 * Hämtar senaste releases från OpenAI:s GitHub repository
 * 
 * @returns Promise som resolverar till array med OpenAI releases
 * @private
 */
async function fetchOpenAI(): Promise<ProviderRelease[]> {
  const url = 'https://api.github.com/repos/openai/openai-node/releases?per_page=5';
  const { data } = await axios.get(url, { timeout: 15000 });
  return data.map((r: any) => ({
    provider: 'openai',
    name: r.name || 'OpenAI API update',
    kind: 'sdk',
    version: r.tag_name,
    publishedAt: r.published_at,
    url: r.html_url,
    summary: r.body?.slice(0, 300) || 'Update'
  }));
}

/**
 * Hämtar senaste releases från Google:s GitHub repository (Gemini SDK)
 * 
 * @returns Promise som resolverar till array med Google releases
 * @private
 */
async function fetchGoogle(): Promise<ProviderRelease[]> {
  const url = 'https://api.github.com/repos/google-gemini/generative-ai-js/releases?per_page=5';
  const { data } = await axios.get(url, { timeout: 15000 });
  return data.map((r: any) => ({
    provider: 'google',
    name: r.name || 'Gemini API update',
    kind: 'sdk',
    version: r.tag_name,
    publishedAt: r.published_at,
    url: r.html_url,
    summary: r.body?.slice(0, 300) || 'Update'
  }));
}


/**
 * Hämtar senaste releases från Anthropic:s GitHub repository
 * 
 * @returns Promise som resolverar till array med Anthropic releases
 * @private
 */
async function fetchAnthropic(): Promise<ProviderRelease[]> {
  const url = 'https://api.github.com/repos/anthropics/anthropic-sdk-typescript/releases?per_page=5';
  const { data } = await axios.get(url, { timeout: 15000 });
  return data.map((r: any) => ({
    provider: 'anthropic',
    name: r.name || 'Anthropic SDK update',
    kind: 'sdk',
    version: r.tag_name,
    publishedAt: r.published_at,
    url: r.html_url,
    summary: r.body?.slice(0, 300) || 'Update'
  }));
}

/**
 * Hämtar senaste releases från alla konfigurerade AI-providers
 * 
 * Funktionen hämtar releases från OpenAI, Google och Anthropic parallellt
 * och filtrerar till endast de från senaste veckan. Sorterar efter
 * publiceringsdatum (nyaste först).
 * 
 * @returns Promise som resolverar till array med releases från senaste veckan,
 *          sorterade efter publiceringsdatum (nyaste först)
 * 
 * @example
 * const releases = await checkProviders();
 * console.log(`Found ${releases.length} recent releases`);
 */
export async function checkProviders(): Promise<ProviderRelease[]> {
  const results = await Promise.allSettled([fetchOpenAI(), fetchGoogle(), fetchAnthropic()]);
  const allReleases = results
    .filter(r => r.status === 'fulfilled')
    .flatMap((r: PromiseFulfilledResult<ProviderRelease[]>) => r.value);
  
  // Filtrera endast releases från senaste veckan
  const recentReleases = allReleases.filter(release => isWithinLastWeek(release.publishedAt));
  
  return recentReleases.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}
