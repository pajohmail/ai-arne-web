import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  try {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  } catch {
    // Minimal fallback – ta bort script-taggar
    return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
}


