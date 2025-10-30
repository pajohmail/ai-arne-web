import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapPost, queryCollection } from '../lib/firestore';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function Posts() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [end, setEnd] = useState(false);

  async function load() {
    if (loading || end) return;
    setLoading(true);
    setError(null);
    try {
      const res = await queryCollection({
        collectionId: 'posts',
        orderByCreatedAtDesc: true,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      const mapped = res.map(mapPost).filter(Boolean);
      setItems((prev) => [...prev, ...mapped]);
      if (mapped.length < PAGE_SIZE) setEnd(true);
      setPage((p) => p + 1);
    } catch {
      setError('Kunde inte hämta poster.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Seo title="API‑nyheter – AI‑Arne" description="Lista över API‑nyheter" />
      <h1>API‑nyheter</h1>
      {items.length === 0 && loading && <Skeleton lines={3} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && items.length === 0 && <EmptyState message="Inga poster hittades." />}
      <div className="card-list">
        {items.map((p: any) => (
          <article key={p.id} className="card">
            <h3><Link to={`/post/${p.slug}`}>{p.title}</Link></h3>
            {p.excerpt && <p className="muted">{p.excerpt}</p>}
          </article>
        ))}
      </div>
      {!end && (
        <p style={{ marginTop: 12 }}>
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? 'Laddar…' : 'Visa fler'}
          </button>
        </p>
      )}
    </div>
  );
}


