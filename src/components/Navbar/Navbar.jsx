import { useState, useEffect } from 'react';
import './Navbar.css';

const links = ['Esplora', 'La Bruna', 'Matera', 'Dove Dormire'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className="navbar-wrap">
      <nav className={`navbar-pill ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo">
          <img src="/Screenshot_2026-03-27_alle_02.06.14-removebg-preview.png" alt="Festa della Bruna" className="nav-logo-png" />
        </a>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            <li key={l}><a href="#" onClick={() => setMenuOpen(false)}>{l}</a></li>
          ))}
        </ul>

        <a href="#cavaliere" className="nav-cta">Pianifica il Viaggio</a>

        <button
          className={`nav-burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="menu"
        >
          <span /><span /><span />
        </button>
      </nav>
    </header>
  );
}
