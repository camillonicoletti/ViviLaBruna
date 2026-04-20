import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const SUGGESTIONS = [
  "Cosa significa 'a mmoğğj a mmoğğj all'onn c vèn'?",
  "Cosa posso fare stasera di particolare?",
  "C'è un servizio di noleggio bici elettriche?",
  "Consigliami uno spot per scattare foto pazzesche...",
  "Come mi muovo per il centro storico oggi?",
  "Qual è un buono spot per vedere lo Strazzo?",
  "Dimmi una bottega per i peperoni cruschi"
];

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false); // Dropdown Chat IA
  const [menuOpen, setMenuOpen] = useState(false); // Dropdown Hamburger Menu
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // States per l'effetto Typing del Placeholder
  const [placeholderText, setPlaceholderText] = useState('');
  const [suggIndex, setSuggIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Chiudi i menu se clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExpanded(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effetto Macchina da Scrivere per il Placeholder
  useEffect(() => {
    let timer;
    const currentSugg = SUGGESTIONS[suggIndex];

    if (isDeleting) {
      // Sto cancellando
      timer = setTimeout(() => {
        setPlaceholderText(prev => prev.substring(0, prev.length - 1));
        if (placeholderText.length <= 1) { // Appena vuoto, passo al prossimo
          setIsDeleting(false);
          setSuggIndex((prev) => (prev + 1) % SUGGESTIONS.length);
        }
      }, 25); // Velocità veloce in cancellazione
    } else {
      // Sto scrivendo
      timer = setTimeout(() => {
        setPlaceholderText(currentSugg.substring(0, placeholderText.length + 1));
        if (placeholderText.length === currentSugg.length) {
          // Ha finito di scrivere la riga, faccio una pausa e poi cancello
          timer = setTimeout(() => setIsDeleting(true), 2500);
        }
      }, 50); // Velocità battitura umana
    }
    
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, suggIndex]);

  // Auto-scroll custom placeholder
  useEffect(() => {
    if (placeholderRef.current) {
      // Quando il testo si aggiorna, scorre tutto a destra per mostrare l'ultimo caret
      placeholderRef.current.scrollLeft = placeholderRef.current.scrollWidth;
    }
  }, [placeholderText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    setMenuOpen(false);
    const userMsg = { id: Date.now(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);
    setExpanded(true);

    // Finto caricamento AI
    setTimeout(() => {
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: "La saggezza ha il suo tempo. Presto le mie sinapsi saranno connesse alle API reali e saprò stupirti con le rotte dei Sassi." 
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1800);
  };

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    setMenuOpen(false);
    setExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (path) {
      navigate(path);
    }
  };

  return (
    <header className="navbar-wrap">
      <div 
        className={`omnibar-container ${(expanded || menuOpen) ? 'expanded' : ''} ${scrolled ? 'scrolled' : ''}`} 
        ref={dropdownRef}
      >
        
        {/* TOP BAR */}
        <div className="omnibar-top">
          <a href="#" className="nav-logo" onClick={() => { setExpanded(false); setMenuOpen(false); }}>
            <img src="/Screenshot_2026-03-27_alle_02.06.14-removebg-preview.png" alt="Festa della Bruna" className="nav-logo-png" />
          </a>
          
          <form className="omnibar-input-wrapper" onSubmit={handleSubmit} onClick={() => { setExpanded(true); setMenuOpen(false); }}>
            <span className="omnibar-icon">✦</span>
            <div className="input-container">
              {!query && (
                <div className="custom-placeholder" ref={placeholderRef}>
                  Es: {placeholderText}|
                </div>
              )}
              <input 
                ref={inputRef}
                type="text" 
                className="omnibar-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setExpanded(true); setMenuOpen(false); }}
              />
            </div>
            {query && (
              <button type="submit" className="omnibar-submit-btn">➔</button>
            )}
          </form>

          {/* Hamburger */}
          <button 
            className={`nav-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => { setMenuOpen(!menuOpen); setExpanded(false); }}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* DROPDOWN MENU HAMBURGER (Sostituisce temporaneamente la chat se aperto) */}
        {menuOpen && (
          <div className="traditional-menu-dropdown fade-in-up">
            <ul className="traditional-nav-links">
              <li><a href="/" onClick={(e) => handleLinkClick(e, '/')}>Mappa Iniziale</a></li>
              <li><a href="/attivita" onClick={(e) => handleLinkClick(e, '/attivita')}>Esplora Attività</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, null)}>La Storia ed Evoluzione</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, null)}>Linee Guida Traffico</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, null)}>Aziende Coinvolte</a></li>
            </ul>
          </div>
        )}

        {/* DROPDOWN CHAT */}
        {expanded && !menuOpen && (
          <div className="omnibar-dropdown">
            {messages.length === 0 && !isTyping && (
              <div className="empty-chat-state">
                <p>Usa la barra testuale fluttuante per chiedere consigli, ricevere dritte locali o scoprire segreti su Matera e la Festa in tempo reale.</p>
              </div>
            )}
            
            <div className="omnibar-chat-area">
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="chat-bubble ai typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
