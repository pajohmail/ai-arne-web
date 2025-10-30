import { useEffect } from 'react';

interface Props {
  title?: string;
  description?: string;
}

export default function Seo({ title, description }: Props) {
  useEffect(() => {
    if (title) document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute('content', description);
    const base = window.__APP_CONFIG__?.publicBaseUrl || '';
    const canonical = base ? base.replace(/\/$/, '') + '/#' + location.pathname : undefined;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    if (canonical) link.href = canonical;
  }, [title, description]);
  return null;
}


