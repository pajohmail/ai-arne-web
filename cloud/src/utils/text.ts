/**
 * Text utility-funktioner
 * 
 * Denna modul tillhandahåller helper-funktioner för text-manipulation:
 * - HTML-sanitization (XSS-skydd)
 * - Slug-generering (URL-vänliga strängar)
 * 
 * @module text
 */

import he from 'he';

/**
 * Sanitizerar HTML för att förhindra XSS-attacker
 * 
 * Funktionen HTML-encodar alla specialtecken i en sträng för säker
 * visning i HTML. Används för att säkerställa att användarinput
 * inte kan innehålla skadlig kod.
 * 
 * @param input - Text att sanitizera
 * @returns HTML-encoded sträng
 * 
 * @example
 * const safe = sanitizeHtml('<script>alert("xss")</script>');
 * // Resultat: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
export function sanitizeHtml(input: string) {
  return he.encode(input, { useNamedReferences: true });
}


/**
 * Konverterar en sträng till en URL-vänlig slug
 * 
 * Funktionen konverterar en sträng till lowercase, ersätter specialtecken
 * med bindestreck, och tar bort inledande/avslutande bindestreck.
 * 
 * @param s - Sträng att konvertera
 * @returns URL-vänlig slug
 * 
 * @example
 * const slug = slugify('OpenAI GPT-5 Release!');
 * // Resultat: "openai-gpt-5-release"
 */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
