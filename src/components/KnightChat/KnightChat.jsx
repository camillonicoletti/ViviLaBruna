import { useState, useEffect, useRef } from 'react';
import './KnightChat.css';
import BrunaCalendar from '../BrunaCalendar/BrunaCalendar';
import ItineraryResult from '../ItineraryResult/ItineraryResult';
import CarroOverlay from '../CarroOverlay/CarroOverlay';
import BrunaMap from '../BrunaMap/BrunaMap';

/* ── Conversation script ── */
const FLOW = [
  {
    id: 'people',
    type: 'people_selection',
    msg: 'Benvenuto, viandante. Io sono il Cavaliere della Bruna.\nSarò la tua guida attraverso Matera e i misteri della nostra festa.\n\nIn quanti siete in questo viaggio?',
    chips: ['Solo', 'In coppia', 'Gruppo di amici', 'Famiglia'],
  },
  {
    id: 'period',
    type: 'calendar',
    msg: 'In quali giorni il vostro cammino toccherà la Murgia?',
    chips: [],
  },
  {
    id: 'budget',
    msg: 'Matera ha strade per ogni viandante, dai vicoli nascosti ai terrazzi più lussuosi.\n\nCome vorreste vivere questo soggiorno?',
    chips: ['Risparmio\n(0-80€)', 'Comodo\n(80–150€)', 'Lusso\n(150–250€)', 'Magnifico\n(250€+)'],
  },
  {
    id: 'vibe',
    msg: 'Ultima domanda.\n\nCosa cerca la vostra anima tra le pietre antiche?',
    chips: ['Storia e spiritualità', 'Sapori e tradizioni', 'Arte e fotografia', 'Avventura'],
  },
];

const FINALE_MSG = () =>
  `Ho tutto ciò che mi serve. Sto tracciando il vostro percorso segreto tra i Sassi e la Cavalcata.\n\nPreparatevi, Matera vi aspetta.`;

/* ── Countdown Hook ── */
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calculateTimeLeft(targetDate) {
  const difference = +new Date(targetDate) - +new Date();
  let timeLeft = {};
  if (difference > 0) {
    timeLeft = {
      giorni: Math.floor(difference / (1000 * 60 * 60 * 24)),
      ore: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minuti: Math.floor((difference / 1000 / 60) % 60),
      seconti: Math.floor((difference / 1000) % 60)
    };
  }
  return timeLeft;
}

/* ── Component ── */
export default function KnightChat() {
  const [step,     setStep]     = useState(0);
  const [answers,  setAnswers]  = useState({});
  const [typing,   setTyping]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showCarroOverlay, setShowCarroOverlay] = useState(false);
  const [isCarroExiting, setIsCarroExiting] = useState(false); // Novità per gestire la dissolvenza in background

  // Scrolla alla pergamena SOLO quando l'overlay del carro sparisce
  useEffect(() => {
    if (!showCarroOverlay && showResult && itineraryRef.current) {
      setTimeout(() => {
        const top = itineraryRef.current.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 200);
    }
  }, [showCarroOverlay]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Dynamic Inputs State
  const [groupSelection, setGroupSelection] = useState(null);
  const [groupCount, setGroupCount] = useState(3);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  };

  const videoRef      = useRef(null);
  const startedRef    = useRef(false);
  const itineraryRef  = useRef(null);

  // Hardcoded for La Bruna 2026
  const timeLeft = useCountdown('2026-07-02T00:00:00');

  /* Init */
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startStep(0);
    }
  }, []);

  function startStep(idx) {
    if (idx >= FLOW.length) return;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
    }, 1000);
  }

  function choose(text) {
    if (typing) return;
    
    // Play video animazione
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log('Video play interrupted:', e));
    }
    
    // Salva risposta e vai avanti con un piccolo delay per l'animazione
    setTimeout(() => {
      const current = FLOW[step];
      const newAnswers = { ...answers, [current.id]: text };
      setAnswers(newAnswers);

      const next = step + 1;
      setStep(next);
      
      // Reset temporanei
      setGroupSelection(null);
      setDateFrom(null);
      setDateTo(null);

      if (next < FLOW.length) {
        startStep(next);
      } else {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setDone(true);
        }, 1200);
      }
    }, 600);
  }

  const currentMsg = done ? FINALE_MSG() : (!typing && FLOW[step]) ? FLOW[step].msg : '';

  return (
    <div className="bruna-ai-app">
      
      {/* COUNTDOWN SECTION */}
      <section className="app-countdown-section">
        <div className="countdown-pill">
          <div className="countdown-brand">
            <span className="countdown-brand-text">FESTA DELLA BRUNA</span>
          </div>
          <div className="countdown-divider"></div>
          <div className="countdown-timer-minimal">
            {timeLeft.giorni !== undefined ? (
              <>
                <div className="min-time"><b>{timeLeft.giorni}</b> <span>giorni</span></div>
                <div className="min-time"><b>{timeLeft.ore.toString().padStart(2, '0')}</b> <span>ore</span></div>
                <div className="min-time"><b>{timeLeft.minuti.toString().padStart(2, '0')}</b> <span>min</span></div>
              </>
            ) : (
              <span>È arrivata!</span>
            )}
          </div>
        </div>
      </section>

      {/* SPLIT LAYOUT: KNIGHT LEFT, AI BOX RIGHT */}
      <section className="app-split-section">
        
        {/* LEFT: AVATAR */}
        <div className="split-left">
          <div className="avatar-video-wrapper">
            <video 
              ref={videoRef}
              src="/cavliere.mp4" 
              className="avatar-video" 
              muted 
              playsInline
              preload="auto"
              poster="/knight_transparent.png"
            />
            <div className="avatar-shadow" />
          </div>
        </div>

        {/* RIGHT: AI QUIZ BOX */}
        <div className="split-right">
          <div className="ai-quiz-box">
            
            <div className="quiz-header">
              <span className="sparkle">✦</span> Cavaliere della Bruna AI
            </div>

            {!done && step < FLOW.length && (
              <div className="quiz-step-counter">
                {step + 1} / {FLOW.length}
              </div>
            )}

            <div className="quiz-body">
              {typing ? (
                <div className="typing-dots">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              ) : (
                <div className="quiz-question fade-in">
                  {currentMsg.split('\n\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="quiz-footer">
              {!done && !typing && FLOW[step] && (
                <div className="quiz-options-grid fade-in-up">
                  {FLOW[step].type === 'calendar' ? (
                    <div className="dynamic-input-container fade-in">
                      <BrunaCalendar onRangeSelect={(start, end) => {
                        setDateFrom(start);
                        setDateTo(end);
                      }} />
                      <div className="input-actions" style={{ maxWidth: '400px', width: '100%' }}>
                        <button className="confirm-btn" 
                                disabled={!dateFrom || !dateTo} 
                                onClick={() => choose(`Dal ${formatDate(dateFrom)} al ${formatDate(dateTo)}`)}>
                          Conferma {dateFrom && dateTo ? `(${formatDate(dateFrom)} - ${formatDate(dateTo)})` : 'Date'}
                        </button>
                      </div>
                    </div>
                  ) : FLOW[step].type === 'people_selection' && groupSelection ? (
                    <div className="dynamic-input-container fade-in">
                      <p>Quanti per {groupSelection}?</p>
                      <p><strong>{groupCount} persone</strong></p>
                      <input type="range" min="3" max="100" value={groupCount} onChange={e => setGroupCount(e.target.value)} className="bruna-slider" />
                      <div className="input-actions">
                        <button className="back-btn" onClick={() => setGroupSelection(null)}>Indietro</button>
                        <button className="confirm-btn" onClick={() => choose(`${groupSelection} (${groupCount} pers.)`)}>Conferma</button>
                      </div>
                    </div>
                  ) : (
                    (FLOW[step].chips || []).map((chip) => (
                      <button key={chip} className="quiz-option-btn" onClick={() => {
                        if (FLOW[step].type === 'people_selection' && (chip === 'Gruppo di amici' || chip === 'Famiglia')) {
                          setGroupSelection(chip);
                        } else {
                          choose(chip);
                        }
                      }}>
                        {chip}
                      </button>
                    ))
                  )}
                </div>
              )}

              {done && !typing && (
                <div className="quiz-finale-actions fade-in-up">
                  {!showResult && (
                    <button className="finale-btn-primary" onClick={() => { setShowCarroOverlay(true); setShowResult(true); }}>
                      Genera Itinerario
                    </button>
                  )}
                  <button 
                    className={showResult ? "finale-btn-primary" : "finale-btn-secondary"} 
                    onClick={() => { setStep(0); setAnswers({}); setDone(false); setShowResult(false); setShowCarroOverlay(false); startStep(0); }}
                  >
                    Ricomincia
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </section>

      {/* OVERLAY ANIMAZIONE CARRO */}
      {showCarroOverlay && (
        <CarroOverlay 
          onExiting={() => setIsCarroExiting(true)}
          onComplete={() => {
            setShowCarroOverlay(false);
            setIsCarroExiting(false);
          }} 
        />
      )}

      {showResult && (
        <div ref={itineraryRef}>
          {/* L'itinerario comincia a svegliarsi ("isActive") non appena il carro inizia a sfumare */}
          <ItineraryResult answers={answers} isActive={!showCarroOverlay || isCarroExiting} />
        </div>
      )}

      {/* MAPPA MAPBOX: Renderizzata una sola volta, si posiziona in basso */}
      <BrunaMap />
      
    </div>
  );
}
