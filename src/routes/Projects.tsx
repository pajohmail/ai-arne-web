import { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

type Project = { title: string; description?: string; url: string };

export default function Projects() {
  const [projects] = useState<Project[]>([
    // Lägg till dina projektlänkar här
    // { title: 'Mitt projekt', description: 'Kort beskrivning', url: 'https://exempel.se' },
  ]);

  return (
    <div>
      <Seo title="Projekt – AI‑Arne" description="Länkar till mina projekt" />
      <h1>Projekt</h1>
      <div className="card-list">
        <article className="card">
          <h3><Link to="/projekt/matte-professorn">Matte Professorn</Link></h3>
          <p className="muted">AI‑driven mattehandledning för högstadiet</p>
        </article>

        {projects.length > 0 && projects.map((p) => (
          <article key={p.url} className="card">
            <h3><a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a></h3>
            {p.description && <p className="muted">{p.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}


