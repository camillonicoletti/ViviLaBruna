import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './LanguageSwitcher.css';

// Lingue disponibili. `cc` = codice bandiera (flagcdn), `code` = codice lingua i18n.
// NB: per l'inglese si usa per convenzione la bandiera UK (gb).
const LANGUAGES = [
  { code: 'it', label: 'Italiano', cc: 'it' },
  { code: 'en', label: 'English', cc: 'gb' },
  { code: 'es', label: 'Español', cc: 'es' },
  { code: 'fr', label: 'Français', cc: 'fr' },
  { code: 'de', label: 'Deutsch', cc: 'de' },
  { code: 'ja', label: '日本語', cc: 'jp' },
  { code: 'zh', label: '中文', cc: 'cn' },
];

// Bandiere SVG/PNG da flagcdn.com: niente dipendenze e resa identica su tutti i sistemi
// (le emoji bandiera non si vedono su Windows).
const flag = (cc) => `https://flagcdn.com/w40/${cc}.png`;
const flag2x = (cc) => `https://flagcdn.com/w80/${cc}.png`;

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('it'); // TODO: collegare a i18next quando i testi saranno pronti
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const active = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  // Il menu è position:fixed per "uscire" dall'omnibar-container che ha overflow:hidden.
  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 10, right: window.innerWidth - r.right });
    setOpen(true);
  };

  const toggle = () => (open ? setOpen(false) : openMenu());

  // Chiudi cliccando fuori, oppure su scroll/resize (per evitare che il menu "scivoli").
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleMove = () => setOpen(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleMove, true);
    window.addEventListener('resize', handleMove);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleMove, true);
      window.removeEventListener('resize', handleMove);
    };
  }, [open]);

  const select = (code) => {
    setCurrent(code);
    setOpen(false);
    // TODO: i18n.changeLanguage(code) quando react-i18next sarà collegato
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`lang-trigger ${open ? 'open' : ''}`}
        onClick={toggle}
        aria-label="Cambia lingua / Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img
          className="lang-flag"
          src={flag(active.cc)}
          srcSet={`${flag2x(active.cc)} 2x`}
          alt={active.label}
        />
      </button>

      {open && createPortal(
        <ul
          ref={menuRef}
          className="lang-menu"
          style={{ top: pos.top, right: pos.right }}
          role="listbox"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === current}
                className={`lang-option ${l.code === current ? 'active' : ''}`}
                onClick={() => select(l.code)}
              >
                <img
                  className="lang-flag"
                  src={flag(l.cc)}
                  srcSet={`${flag2x(l.cc)} 2x`}
                  alt=""
                />
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
}
