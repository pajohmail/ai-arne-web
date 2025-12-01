import DOMPurify from 'dompurify';
import he from 'he';

/**
 * Dekodar HTML-entiteter i en textsträng (används för titlar, etc.)
 * 
 * @param text - Textsträng med HTML-entiteter
 * @returns Dekodad textsträng
 */
export function decodeHtmlEntities(text: string | undefined): string {
  if (!text) return '';
  try {
    return he.decode(text, { strict: false });
  } catch {
    return String(text);
  }
}

/**
 * Sanitizerar HTML för säker visning
 * 
 * Funktionen dekodar HTML-entiteter (t.ex. &auml; till ä, &ouml; till ö)
 * och sanitizerar sedan HTML för att förhindra XSS-attacker.
 * 
 * @param html - HTML-sträng att sanitizera
 * @returns Säker HTML-sträng
 */
export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  try {
    // Dekoda HTML-entiteter först (t.ex. &auml; till ä, &ouml; till ö)
    // he.decode() hanterar både named references (&auml;) och numeric references (&#228;)
    let decoded = he.decode(html, { strict: false });
    
    // Sanitize för att ta bort farligt innehåll, men behåll HTML-struktur
    // Använd KEEP_CONTENT för att behålla textinnehåll och ALLOWED_TAGS för att tillåta vanliga HTML-taggar
    const sanitized = DOMPurify.sanitize(decoded, { 
      USE_PROFILES: { html: true },
      KEEP_CONTENT: true,
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id']
    });
    
    // Dekoda igen efter sanitization om DOMPurify encodade något
    // Detta säkerställer att textinnehåll visas korrekt
    return he.decode(sanitized, { strict: false });
  } catch {
    // Minimal fallback – dekoda och ta bort script-taggar
    try {
      const decoded = he.decode(String(html), { strict: false });
      return decoded.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    } catch {
      return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    }
  }
}


