export function formatDate(ts?: string): string {
  if (!ts) return 'Okänt datum';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return 'Okänt datum';
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
}


