import { PropsWithChildren, useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function App({ children }: PropsWithChildren) {
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [tutorialsDropdownOpen, setTutorialsDropdownOpen] = useState(false);
  const newsDropdownRef = useRef<HTMLDivElement>(null);
  const tutorialsDropdownRef = useRef<HTMLDivElement>(null);

  // Stäng dropdown när man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newsDropdownRef.current && !newsDropdownRef.current.contains(event.target as Node)) {
        setNewsDropdownOpen(false);
      }
      if (tutorialsDropdownRef.current && !tutorialsDropdownRef.current.contains(event.target as Node)) {
        setTutorialsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            
            {/* Nyheter Dropdown */}
            <div className="dropdown" ref={newsDropdownRef}>
              <button
                className="dropdown-toggle"
                onClick={() => {
                  setNewsDropdownOpen(!newsDropdownOpen);
                  setTutorialsDropdownOpen(false);
                }}
                aria-expanded={newsDropdownOpen}
                aria-haspopup="true"
              >
                Nyheter
              </button>
              {newsDropdownOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/news" onClick={() => setNewsDropdownOpen(false)}>
                    Nyheter
                  </NavLink>
                  <NavLink to="/posts" onClick={() => setNewsDropdownOpen(false)}>
                    API-nyheter
                  </NavLink>
                  <NavLink to="/chat" onClick={() => setNewsDropdownOpen(false)}>
                    Nyhets Chat
                  </NavLink>
                </div>
              )}
            </div>

            {/* Tutorials Dropdown */}
            <div className="dropdown" ref={tutorialsDropdownRef}>
              <button
                className="dropdown-toggle"
                onClick={() => {
                  setTutorialsDropdownOpen(!tutorialsDropdownOpen);
                  setNewsDropdownOpen(false);
                }}
                aria-expanded={tutorialsDropdownOpen}
                aria-haspopup="true"
              >
                Tutorials
              </button>
              {tutorialsDropdownOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/tutorials" onClick={() => setTutorialsDropdownOpen(false)}>
                    API Tutorial
                  </NavLink>
                  <NavLink to="/tutorial/cursor-2.0" onClick={() => setTutorialsDropdownOpen(false)}>
                    Cursor 2.0 Tutorial
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink to="/projekt">Projekt</NavLink>
            <NavLink to="/om-mig">Om mig</NavLink>
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


