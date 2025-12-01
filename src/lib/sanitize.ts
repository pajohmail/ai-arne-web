import DOMPurify from 'dompurify';
import he from 'he';

/**
 * Dekoder HTML-entiteter (t.ex. &ouml; till ö, &amp; till &)
 * Använder he-biblioteket för korrekt dekodning av alla HTML-entiteter
 * Hanterar även dubbel-kodad data genom att dekoda flera gånger om nödvändigt
 */
function decodeHtmlEntities(html: string): string {
  try {
    // Dekoda HTML-entiteter - försök flera gånger om data är dubbel-kodad
    let decoded = html;
    let previousDecoded = '';
    let iterations = 0;
    const maxIterations = 5; // Max 5 iterationer för att undvika oändlig loop
    
    // Fortsätt dekoda tills inga fler entiteter finns eller max iterationer nås
    while (decoded !== previousDecoded && iterations < maxIterations) {
      previousDecoded = decoded;
      decoded = he.decode(decoded, { strict: false });
      iterations++;
    }
    
    return decoded;
  } catch {
    // Fallback: använd textarea-metoden om he misslyckas
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }
}

export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  try {
    // Dekoda HTML-entiteter först (t.ex. &ouml; till ö, &amp; till &)
    const decoded = decodeHtmlEntities(html);
    // Sanitize för att ta bort farligt innehåll
    return DOMPurify.sanitize(decoded, { USE_PROFILES: { html: true } });
  } catch {
    // Minimal fallback – ta bort script-taggar
    return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
}


