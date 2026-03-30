import { useEffect, useRef, useState } from 'react';
import './CarroOverlay.css';

/*
  Tecnica: clip-path progressivo sull'immagine reale del carro.
  L'immagine è 1:1 (quadrata). Il carro occupa la parte centrale.
  Dividiamo l'altezza in 5 fasce, che si svelano dal basso verso l'alto.

  Fase 1 → Ruote + base
  Fase 2 → Corpo / pianale
  Fase 3 → Colonne e torri laterali
  Fase 4 → Decori e fregi
  Fase 5 → Statua Madonna + tutto
*/

const PHASES = [
  { clip: 'inset(100% 5% 0% 5%)', label: 'Preparo il percorso...' },
  { clip: 'inset(78% 5% 0% 5%)',  label: 'Forgio le ruote...' },
  { clip: 'inset(55% 5% 0% 5%)',  label: 'Dispongo le scene sul palco...' },
  { clip: 'inset(32% 5% 0% 5%)',  label: 'Sistemo gli angioletti al loro posto...' },
  { clip: 'inset(12% 3% 0% 3%)',  label: 'Porto i personaggi sul carro...' },
  { clip: 'inset(0% 0% 0% 0%)',   label: 'La Madonna ascende al suo trono.' },
];

// Ritardi assoluti (ms) per ogni fase 0..5
const PHASE_DELAYS = [0, 700, 1500, 2300, 3100, 3800];

export default function CarroOverlay({ onComplete, onExiting }) {
  // Partiamo già a fase 1 così il carro inizia subito a comparire
  const [phase, setPhase]     = useState(1);
  const [exiting, setExiting] = useState(false);

  // Usiamo useRef per non far dipendere l'effect da onComplete
  // (che cambia ad ogni render del parent e resetterebbe i timer)
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Avanza le fasi 2..5 ai rispettivi delay
    const timers = PHASE_DELAYS.slice(2).map((delay, i) =>
      setTimeout(() => setPhase(i + 2), delay)
    );

    // Exit dopo che il carro è completo
    const exitTimer = setTimeout(() => {
      setExiting(true);
      if (onExiting) onExiting(); // Segnala in anticipo la fine
      setTimeout(() => onCompleteRef.current(), 900);
    }, 5600);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPhase = PHASES[phase] || PHASES[PHASES.length - 1];
  const progress = (phase / (PHASES.length - 1)) * 100;

  return (
    <div className={`carro-overlay${exiting ? ' exiting' : ''}`}>

      {/* ── Immagine reale del Carro con clip-path animato ── */}
      <div className="carro-image-wrapper">
        <div
          className="carro-image-clip"
          style={{ clipPath: currentPhase.clip }}
        >
          <img
            src="/carro_dorato.png"
            alt="Carro Trionfale della Bruna"
            className="carro-real-img"
          />
        </div>

        {/* Glow dorato che cresce con le fasi */}
        <div
          className="carro-glow-radial"
          style={{ opacity: phase * 0.07 }}
        />

        {/* Particelle/scintille ai bordi durante la costruzione */}
        {phase >= 1 && phase < 5 && (
          <div className="carro-sparks-container" key={phase}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`carro-spark-particle spark-${i}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── Testo di stato ── */}
      <p className="carro-status-text" key={phase}>
        {currentPhase.label}
      </p>

      {/* ── Barra di progresso ── */}
      <div className="carro-progress-bar">
        <div
          className="carro-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="carro-label">Il Cavaliere sta creando il tuo percorso</span>

    </div>
  );
}
