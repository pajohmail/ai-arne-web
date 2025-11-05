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
            <NavLink to="/tutorials">Tutorials</NavLink>
            <NavLink to="/chat">Nyhets Chat</NavLink>
            <NavLink to="/om-mig">Om mig</NavLink>
            <NavLink to="/projekt">Projekt</NavLink>
          </nav>
        </div>
      </header>

      <main className="container" role="main">{children}</main>

      <footer className="bottombar">
        <div className="bar-inner">
          <span>© {new Date().getFullYear()} AI‑Arne</span>
          <Link to="/privacy-policy" style={{ color: '#fff', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}


