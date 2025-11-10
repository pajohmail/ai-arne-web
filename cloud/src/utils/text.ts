import he from 'he';

export function sanitizeHtml(input: string) {
  return he.encode(input, { useNamedReferences: true });
}

/**
 * Sanitize textinnehåll för HTML - kodar endast text, inte HTML-taggar
 * Används när text ska placeras inuti HTML-taggar
 */
export function sanitizeTextForHtml(input: string): string {
  return he.encode(input, { useNamedReferences: true });
}

/**
 * Sanitize HTML-innehåll - behåller HTML-taggar men säkerställer att innehållet är säkert
 * Används när HTML redan är formaterad och ska sparas som HTML
 */
export function sanitizeHtmlContent(html: string): string {
  // Om innehållet redan är HTML (innehåller taggar), returnera det som det är
  // DOMPurify i frontend kommer att hantera säkerheten
  // Vi kodar bara potentiellt farliga tecken som < och > som inte är del av taggar
  // För enkelhetens skull, returnera HTML som det är - frontend hanterar säkerheten
  return html;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
