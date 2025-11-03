import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapTutorial, queryCollection } from '../lib/firestore';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function Tutorials() {
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
        collectionId: 'tutorials',
        orderByCreatedAtDesc: true,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      const mapped = res.map(mapTutorial).filter(Boolean);
      setItems((prev) => [...prev, ...mapped]);
      if (mapped.length < PAGE_SIZE) setEnd(true);
      setPage((p) => p + 1);
    } catch {
      setError('Kunde inte hämta tutorials.');
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
      <Seo title="Tutorials – AI‑Arne" description="Lista över tutorials" />
      <h1>Tutorials</h1>
      {items.length === 0 && loading && <Skeleton lines={3} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && items.length === 0 && <EmptyState message="Inga tutorials hittades." />}
      <div className="card-list">
        {items.map((t: any) => (
          <article key={t.id} className="card">
            <h3><Link to={`/tutorial/${t.id}`}>{t.title}</Link></h3>
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

