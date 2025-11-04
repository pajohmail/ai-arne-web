import DOMPurify from 'dompurify';

/**
 * Dekoder HTML-entiteter (t.ex. &lt; till <, &amp; till &)
 */
function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  try {
    // Dekoda HTML-entiteter först (t.ex. &lt; till <)
    const decoded = decodeHtmlEntities(html);
    // Sanitize för att ta bort farligt innehåll
    return DOMPurify.sanitize(decoded, { USE_PROFILES: { html: true } });
  } catch {
    // Minimal fallback – ta bort script-taggar
    return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
}


