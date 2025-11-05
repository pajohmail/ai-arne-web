import Parser from 'rss-parser';
import { sanitizeHtml } from '../utils/text.js';
import { upsertGeneralNews } from '../services/upsert.js';
import { createResponse } from '../services/responses.js';
import { isWithinLastWeek } from '../utils/time.js';

const parser = new Parser();

export interface RSSFeedItem {
  title: string;
  link: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
}

export interface ProcessedNewsItem {
  title: string;
  content: string;
  excerpt: string;
  sourceUrl: string;
  source: string;
}

// Nyckelord att exkludera (bildgenerering, video, etc.)
const EXCLUDE_KEYWORDS = [
  'dall-e',
  'dalle',
  'midjourney',
  'stable diffusion',
  'sora',
  'image generation',
  'bildgenerering',
  'video generation',
  'videogenerering',
  'text-to-image',
  'text-to-video',
  'image-to-image',
  'img2img',
  'diffusion model',
  'paint',
  'sketch',
  'art generator',
  'konstgenerator',
  'visual ai',
  'computer vision',
  'image recognition',
  'bildigenkänning'
];

/**
 * Hämtar nyheter från RSS-feeds
 */
export async function fetchRSSFeeds(feedUrls: string[]): Promise<RSSFeedItem[]> {
  const allItems: RSSFeedItem[] = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        contentSnippet: item.contentSnippet || '',
        content: item.content || '',
        pubDate: item.pubDate,
        isoDate: item.isoDate
      }));
      allItems.push(...items);
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${url}:`, error);
      // Fortsätt med nästa feed
    }
  }

  return allItems;
}

/**
 * Filtrerar nyheter med nyckelord för att exkludera bild/video-generering
 */
export function filterForDevelopmentFocus(item: RSSFeedItem): boolean {
  const searchText = `${item.title} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
  
  // Exkludera om något av nyckelorden finns
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );

  return !hasExcludeKeyword;
}

/**
 * Filtrerar nyheter baserat på publiceringsdatum - endast nyheter från senaste veckan
 */
export function filterByDate(item: RSSFeedItem): boolean {
  // Försök först med isoDate (ISO 8601 format), sedan pubDate
  const dateStr = item.isoDate || item.pubDate;
  if (!dateStr) {
    // Om inget datum finns, exkludera (säkerhetsprincip)
    return false;
  }
  
  return isWithinLastWeek(dateStr);
}

/**
 * Använder OpenAI Responses API för att sammanfatta och verifiera utvecklingsfokus
 * Fallback till Anthropic om OpenAI API-nyckel saknas eller misslyckas
 * Fallback till enkel sammanfattning om inga API-nycklar finns
 */
export async function summarizeWithAI(item: RSSFeedItem, source: string): Promise<ProcessedNewsItem | null> {
  const content = item.contentSnippet || item.content || '';
  const prompt = `Du är en AI-nyhetsredigerare som fokuserar på AI-utveckling och programmering. Skriv på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela artikeln.

Kontrollera följande nyhet och skapa en detaljerad artikel på svenska som fokuserar på utvecklingsaspekter. Sök efter mer information online för att komplettera artikeln med relevanta källor, bakgrundsinformation och sammanhang.

Om nyheten handlar om bildgenerering, videogenerering, eller visuella AI-tjänster som inte är relevanta för utveckling, returnera enbart "SKIP".

Nyhetstitel: ${item.title}
Innehåll: ${content.substring(0, 2000)}

VIKTIGT: Skriv MINST 600 ord totalt. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

Skapa en längre, mer detaljerad artikel på svenska med:
- Titel (behåll originaltiteln om den är relevant)
- En sammanfattning (MINST 100 ord, 6-10 meningar) - underhållande men informativ, med tydlig ironisk touch och svenska humor
- Huvudinnehåll (MINST 500 ord, 15-25 meningar) - engagerande med en tydlig touch av ironi genom hela texten, inkludera relevanta källor, bakgrundsinformation och sammanhang. Var inte rädd för att vara detaljerad och inkludera exempel, jämförelser och anekdoter. Använd ironi och svenska humor flitigt.

Format:
TITEL: [titel]
SAMMANFATTNING: [sammanfattning - MINST 100 ord]
INNEHÅLL: [huvudinnehåll - MINST 500 ord]

Var underhållande och engagerande - läsaren ska vilja läsa hela artikeln.`;

  try {
    // Använd Responses API med fallback till Anthropic
    const response = await createResponse(prompt, {
      model: 'gpt-5-mini',
      maxTokens: 2500,
      temperature: 0.8 // Ökad temperatur för mer kreativitet och humor
    });

    const responseText = response.content;
    
    // Logga vilken provider som användes
    console.log(`Summarized with ${response.provider} API`);

    // Om LLM säger SKIP, hoppa över denna nyhet
    if (responseText.includes('SKIP') || responseText.trim().length === 0) {
      return null;
    }

    // Parsa LLM-svaret
    const titleMatch = responseText.match(/TITEL:\s*(.+?)(?:\n|$)/i);
    const excerptMatch = responseText.match(/SAMMANFATTNING:\s*(.+?)(?:\n|$)/is);
    const contentMatch = responseText.match(/INNEHÅLL:\s*(.+?)(?:\n|$)/is);

    const title = titleMatch ? titleMatch[1].trim() : item.title;
    const excerpt = excerptMatch ? excerptMatch[1].trim().slice(0, 280) : (item.contentSnippet || '').slice(0, 280);
    const content = contentMatch ? contentMatch[1].trim() : (item.contentSnippet || '').slice(0, 500);

    // Skapa HTML-innehåll (sanitize textdelar men behåll HTML-struktur)
    const htmlContent = [
      `<p><strong>${sanitizeHtml(title)}</strong></p>`,
      `<p>${sanitizeHtml(excerpt)}</p>`,
      `<p>${sanitizeHtml(content)}</p>`,
      `<p>Källa: <a href="${sanitizeHtml(item.link)}" rel="noopener" target="_blank">${sanitizeHtml(item.link)}</a></p>`
    ].join('');

    return {
      title: sanitizeHtml(title),
      content: htmlContent,
      excerpt: sanitizeHtml(excerpt),
      sourceUrl: item.link,
      source
    };
  } catch (error) {
    console.error(`Failed to summarize with AI (both OpenAI and Anthropic failed):`, error);
    
    // Fallback till enkel sammanfattning utan LLM om både OpenAI och Anthropic misslyckas
    const fallbackContent = item.contentSnippet || item.content || '';
    const fallbackHtml = [
      `<p><strong>${sanitizeHtml(item.title)}</strong></p>`,
      `<p>${sanitizeHtml(fallbackContent)}</p>`,
      `<p>Källa: <a href="${sanitizeHtml(item.link)}" rel="noopener" target="_blank">${sanitizeHtml(item.link)}</a></p>`
    ].join('');
    
    return {
      title: sanitizeHtml(item.title),
      content: fallbackHtml,
      excerpt: sanitizeHtml(fallbackContent.slice(0, 280)),
      sourceUrl: item.link,
      source
    };
  }
}

/**
 * Bearbetar och sparar allmänna nyheter
 */
export async function processAndUpsertNews(items: RSSFeedItem[], source: string): Promise<number> {
  let processed = 0;

  for (const item of items) {
    // Filtrera först baserat på datum - endast nyheter från senaste veckan
    if (!filterByDate(item)) {
      continue;
    }

    // Sedan filtrera med nyckelord
    if (!filterForDevelopmentFocus(item)) {
      continue;
    }

    // LLM-baserad sammanfattning och filtrering
    const processedItem = await summarizeWithAI(item, source);
    if (!processedItem) {
      continue; // LLM sa SKIP
    }

    // Spara i databas
    await upsertGeneralNews(processedItem);
    processed++;
  }

  return processed;
}

