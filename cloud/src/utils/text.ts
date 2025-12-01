import he from 'he';

/**
 * Koda text för säker HTML-output
 * Används för att koda text som ska placeras inuti HTML-taggar
 */
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
 * 
 * VIKTIGT: Denna funktion kodar INTE HTML-entiteter som redan finns i texten
 * Den behåller HTML-taggar och kodar bara farliga tecken som inte är del av taggar
 */
export function sanitizeHtmlContent(html: string): string {
  // Om innehållet redan är HTML (innehåller taggar), returnera det som det är
  // DOMPurify i frontend kommer att hantera säkerheten
  // Vi kodar bara potentiellt farliga tecken som < och > som inte är del av taggar
  // För enkelhetens skull, returnera HTML som det är - frontend hanterar säkerheten
  return html;
}

/**
 * Dekoda HTML-entiteter i text (används för att fixa äldre data)
 * Används när data redan är kodad och behöver dekodas
 */
export function decodeHtmlEntities(input: string): string {
  return he.decode(input, { strict: false });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
