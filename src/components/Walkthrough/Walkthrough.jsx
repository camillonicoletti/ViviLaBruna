import { useEffect, useState } from 'react';
import './Walkthrough.css';

const STORAGE_KEY = 'vlb-walkthrough-done';

const SLIDES = [
  {
    image: '/knight_transparent.png',
    badge: 'Itinerario AI',
    title: 'Crea il tuo percorso con l’AI',
    text: 'Il Cavaliere della Bruna ti fa quattro semplici domande — chi sei, quando vieni, come vuoi vivere Matera — e disegna per te un itinerario su misura tra i Sassi e la Festa.',
  },
  {
    image: '/hot_air_balloon_flight.png',
    badge: 'Esplora Attività',
    title: 'Scopri esperienze e aggiungile',
    text: 'Tour al tramonto, voli in mongolfiera, laboratori del pane: sfoglia le attività, aprile sulla mappa e aggiungile al tuo programma con un tocco.',
  },
  {
    image: '/carro_dorato.png',
    badge: 'Social & Viabilità',
    title: 'Vivi la Festa senza pensieri',
    text: 'Nel Social trovi foto, recensioni e la community della Bruna. In Viabilità controlli parcheggi, navette e strade chiuse per muoverti senza stress.',
  },
];

export default function Walkthrough() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).has('tour');
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen && !forced) return;

    // Piccola attesa: prima si vede la home, poi entra il walkthrough
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setEntered(true));
    }, 700);
    return () => clearTimeout(t);
  }, []);

  // Blocca lo scroll della pagina mentre il walkthrough è aperto
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setLeaving(true);
    setTimeout(() => setVisible(false), 450);
  };

  const next = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div className={`wt-overlay ${entered && !leaving ? 'wt-open' : ''} ${leaving ? 'wt-leaving' : ''}`}>
      <div className="wt-card" role="dialog" aria-modal="true" aria-label="Benvenuto su Matera da Vivere">

        <button className="wt-close" onClick={close} aria-label="Chiudi">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>

        <div className="wt-visual" key={`visual-${step}`}>
          <div className="wt-visual-glow"></div>
          <img src={slide.image} alt="" className="wt-visual-img" draggable="false" />
        </div>

        <div className="wt-body" key={`body-${step}`}>
          <span className="wt-badge">
            <span className="wt-badge-dot"></span>
            {slide.badge}
          </span>
          <h2 className="wt-title">{slide.title}</h2>
          <p className="wt-text">{slide.text}</p>
        </div>

        <div className="wt-dots" role="tablist">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`wt-dot ${i === step ? 'active' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Vai alla schermata ${i + 1}`}
            />
          ))}
        </div>

        <div className="wt-footer">
          {step > 0 ? (
            <button className="wt-btn-ghost" onClick={prev}>Indietro</button>
          ) : (
            <button className="wt-btn-ghost" onClick={close}>Salta</button>
          )}
          <button className="wt-btn-primary" onClick={next}>
            {isLast ? 'Inizia l’esperienza ✦' : 'Avanti'}
          </button>
        </div>

      </div>
    </div>
  );
}
