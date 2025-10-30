import React, { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import './styles/global.css';
import App from './App';

// Lazy routes (code-splitting)
const Home = React.lazy(() => import('./routes/Home'));
const Posts = React.lazy(() => import('./routes/Posts'));
const PostDetail = React.lazy(() => import('./routes/PostDetail'));
const News = React.lazy(() => import('./routes/News'));
const NewsDetail = React.lazy(() => import('./routes/NewsDetail'));
const TutorialDetail = React.lazy(() => import('./routes/TutorialDetail'));
const NotFound = React.lazy(() => import('./routes/NotFound'));

declare global {
  interface Window {
    __APP_CONFIG__?: {
      projectId: string;
      publicBaseUrl?: string;
    };
  }
}

function Bootstrap() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/config.json', { cache: 'no-cache' });
        if (res.ok) {
          const cfg = await res.json();
          window.__APP_CONFIG__ = cfg;
        } else {
          // Config saknas: fortsätt ändå (kräver att projectId injiceras manuellt om behövs)
          window.__APP_CONFIG__ = window.__APP_CONFIG__ ?? { projectId: '' };
        }
      } catch {
        window.__APP_CONFIG__ = window.__APP_CONFIG__ ?? { projectId: '' };
      } finally {
        setReady(true);
      }
    }
    loadConfig();
  }, []);

  if (!ready) return null;

  return (
    <HashRouter>
      <App>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/tutorial/:id" element={<TutorialDetail />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </App>
    </HashRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Bootstrap />);


