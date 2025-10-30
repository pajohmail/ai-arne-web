import { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function App({ children }: PropsWithChildren) {
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="bar-inner">
          <Link to="/" className="brand">
            <img src="/aiarne.png" alt="AI‑Arne logotyp" width={156} height={156} />
          </Link>
          <nav aria-label="Huvudnavigation" className="main-nav">
            <NavLink to="/" end>
              Hem
            </NavLink>
            <NavLink to="/posts">API‑nyheter</NavLink>
            <NavLink to="/news">Nyheter</NavLink>
          </nav>
        </div>
      </header>

      <main className="container" role="main">{children}</main>

      <footer className="bottombar">
        <div className="bar-inner">© {new Date().getFullYear()} AI‑Arne</div>
      </footer>
    </div>
  );
}


