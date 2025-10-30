import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { mapPost, mapTutorial, queryCollection } from '../lib/firestore';
import { sanitizeHtml } from '../lib/sanitize';

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<any | null>(null);
  const [tutorial, setTutorial] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const rows = await queryCollection({ collectionId: 'posts', whereEq: { field: 'slug', value: slug || '' }, limit: 1 });
        const p = rows.map(mapPost).filter(Boolean)[0] || null;
        if (mounted) setPost(p);
        if (p?.id) {
          const trows = await queryCollection({ collectionId: 'tutorials', whereEq: { field: 'postId', value: p.id }, limit: 1 });
          const t = trows.map(mapTutorial).filter(Boolean)[0] || null;
          if (mounted) setTutorial(t);
        }
      } catch {
        setError('Kunde inte hämta inlägget.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error} />;
  if (!post) return <EmptyState message="Inget inlägg hittades." />;

  return (
    <article className="space-y-8">
      <Seo title={`${post.title} – AI‑Arne`} description={post.excerpt || post.title} />
      <h1>{post.title}</h1>
      {post.sourceUrl && (
        <p><a className="btn" href={post.sourceUrl} target="_blank" rel="noopener noreferrer">Källa</a></p>
      )}
      {post.content && (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      )}
      {tutorial && (
        <p>
          Relaterad tutorial: <Link to={`/tutorial/${tutorial.id}`}>{tutorial.title}</Link>
        </p>
      )}
    </article>
  );
}


