import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapNews, queryCollection } from '../lib/firestore';
import { sanitizeHtml, decodeHtmlEntities } from '../lib/sanitize';

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const rows = await queryCollection({ collectionId: 'news', whereEq: { field: 'slug', value: slug || '' }, limit: 1 });
        const i = rows.map(mapNews).filter(Boolean)[0] || null;
        if (mounted) setItem(i);
      } catch {
        setError('Kunde inte hämta nyheten.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error} />;
  if (!item) return <EmptyState message="Ingen nyhet hittades." />;

  return (
    <article className="space-y-8">
      <Seo title={`${decodeHtmlEntities(item.title)} – AI‑Arne`} description={decodeHtmlEntities(item.excerpt || item.title)} />
      <h1>{decodeHtmlEntities(item.title)}</h1>
      <p className="muted">Källa: {decodeHtmlEntities(item.source || 'okänd')}</p>
      {item.sourceUrl && (
        <p><a className="btn" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Källa</a></p>
      )}
      {item.content && (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }} />
      )}
    </article>
  );
}


