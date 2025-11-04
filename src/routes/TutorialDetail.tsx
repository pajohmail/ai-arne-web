import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapTutorial, queryCollection } from '../lib/firestore';
import { sanitizeHtml } from '../lib/sanitize';

export default function TutorialDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Validera att ID:t finns
        if (!id) {
          if (mounted) {
            setError('Tutorial ID saknas i URL.');
            setLoading(false);
          }
          return;
        }
        
        // Debug: Logga ID:t för att se vad som faktiskt extraheras
        if (import.meta.env.DEV) {
          console.log('Tutorial ID från URL:', id);
        }
        
        // Firestore REST saknar direkt by-id i runQuery, så vi filtrar lokalt eller
        // använder where __name__ == 'tutorials/{id}'.
        const rows = await queryCollection({ collectionId: 'tutorials', whereEq: { field: '__name__', value: `tutorials/${id}` }, limit: 1 });
        const t = rows.map(mapTutorial).filter(Boolean)[0] || null;
        if (mounted) {
          if (!t) {
            setError(`Tutorial med ID "${id}" hittades inte.`);
          } else {
            setItem(t);
          }
        }
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Kunde inte hämta tutorial.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error} />;
  if (!item) return <EmptyState message="Ingen tutorial hittades." />;

  return (
    <article className="space-y-8">
      <Seo title={`${item.title} – AI‑Arne`} description={item.title} />
      <h1>{item.title}</h1>
      {item.sourceUrl && (
        <p><a className="btn" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Källa</a></p>
      )}
      {item.content && (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }} />
      )}
    </article>
  );
}


