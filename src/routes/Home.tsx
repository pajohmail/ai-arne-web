import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapNews, mapPost, queryCollection } from '../lib/firestore';
import { Link } from 'react-router-dom';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, n] = await Promise.all([
          queryCollection({ collectionId: 'posts', orderByCreatedAtDesc: true, limit: 10 }),
          queryCollection({ collectionId: 'news', orderByCreatedAtDesc: true, limit: 10 }),
        ]);
        if (!mounted) return;
        setPosts(p.map(mapPost).filter(Boolean));
        setNews(n.map(mapNews).filter(Boolean));
      } catch (e: any) {
        setError('Kunde inte hämta data. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      <Seo title="AI‑Arne – Start" description="Senaste nyheter och tutorials" />
      <section>
        <h1>Senaste API‑nyheter</h1>
        {loading && <Skeleton lines={3} />}
        {error && <ErrorState message={error} />}
        {!loading && !error && posts.length === 0 && (
          <EmptyState message="Inga poster hittades." />
        )}
        <div className="card-list">
          {posts.map((p: any) => (
            <article key={p.id} className="card">
              <h3><Link to={`/post/${p.slug}`}>{p.title}</Link></h3>
              {p.excerpt && <p className="muted">{p.excerpt}</p>}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Senaste allmänna nyheter</h2>
        {loading && <Skeleton lines={3} />}
        {!loading && !error && news.length === 0 && (
          <EmptyState message="Inga nyheter hittades." />
        )}
        <div className="card-list">
          {news.map((n: any) => (
            <article key={n.id} className="card">
              <h3><Link to={`/news/${n.slug}`}>{n.title}</Link></h3>
              {n.excerpt && <p className="muted">{n.excerpt}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}


