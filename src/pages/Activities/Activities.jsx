import { useState, useRef } from 'react';
import './Activities.css';
import BrunaCalendar from '../../components/BrunaCalendar/BrunaCalendar';
import ItineraryResult from '../../components/ItineraryResult/ItineraryResult';

const EXPERIENCES = [
  {
    id: 1,
    title: "Tour dei Sassi al Tramonto",
    category: "Cultura & Storia",
    price: "da 25€",
    rating: "4.9",
    reviews: 1240,
    image: "/matera_sassi_twilight.png",
    bgImage: "/matera_sassi_twilight.png",
    duration: "2 ore",
    description: "Una passeggiata guidata nei rioni Sassi di Matera mentre il sole tramonta sulle case di tufo. La luce dorata del tramonto illumina le antiche grotte e i vicoli millenari in un modo che non dimenticherai mai. La guida ti condurrà attraverso i luoghi più segreti del Sasso Caveoso e Barisano, raccontando le leggende della città di pietra."
  },
  {
    id: 2,
    title: "Volo in Mongolfiera",
    category: "Avventura",
    price: "da 180€",
    rating: "5.0",
    reviews: 312,
    image: "/hot_air_balloon_flight.png",
    bgImage: "/hot_air_balloon_flight.png",
    duration: "3 ore",
    description: "Decollate all'alba dalla Gravina di Matera e ammirate dall'alto i Sassi, il canyon e l'intera Murgia Materana. Un volo silenzioso a 500 metri di quota, dove la vastità del paesaggio lucano ti toglie il fiato. Include briefing pre-volo, navigazione di circa 45 minuti e colazione di benvenuto al rientro."
  },
  {
    id: 3,
    title: "Laboratorio del Pane Materano",
    category: "Food & Drink",
    price: "da 45€",
    rating: "4.8",
    reviews: 580,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop",
    bgImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1920&auto=format&fit=crop",
    duration: "2.5 ore",
    description: "Impara l'arte secolare del pane di Matera IGP direttamente dalle mani dei panettieri del centro storico. Impasterai a mano il famoso pane a cornetto, scoprirai il segreto del lievito madre centenario e potrai portare a casa il tuo pane cotto nel forno a legna. Un'esperienza sensoriale autentica."
  },
  {
    id: 4,
    title: "Trekking Parco della Murgia",
    category: "Natura estrema",
    price: "da 20€",
    rating: "4.7",
    reviews: 890,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop",
    bgImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1920&auto=format&fit=crop",
    duration: "4 ore",
    description: "Attraversate l'altopiano selvaggio del Parco della Murgia Materana, un paesaggio lunare di calanchi, grotte preistoriche e chiese rupestri. Il percorso include il famigerato ponte tibetano sulla Gravina, villaggi neolitici abbandonati e avvistamenti garantiti di falchi grillai e poiane. Adatto a tutti, scarpe da trekking consigliate."
  },
  {
    id: 5,
    title: "Noleggio E-Bike in Cripta",
    category: "Sport",
    price: "da 35€",
    rating: "4.9",
    reviews: 420,
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=800&auto=format&fit=crop",
    bgImage: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1920&auto=format&fit=crop",
    duration: "Mezza Giornata",
    description: "Esplora Matera e i dintorni a bordo di una e-bike di ultima generazione, ritirata direttamente da una storica cripta rupestre nel cuore dei Sassi. Percorri liberamente le murge, il canyon della Gravina e le strade panoramiche verso Miglionico e Montescaglioso. Mappa digitale inclusa, nessuna guida obbligatoria."
  },
  {
    id: 6,
    title: "Cena Romantica in Grotta",
    category: "Exclusive",
    price: "da 90€",
    rating: "4.9",
    reviews: 215,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
    bgImage: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1920&auto=format&fit=crop",
    duration: "Serata intera",
    description: "Una cena esclusiva in una grotta rupestre del III secolo, con volta in tufo, candele e musica dal vivo. Il menu è interamente a base di prodotti lucani d'eccellenza: pecorino stagionato, lagane e ceci, agnello alla lucana e vini DOC Aglianico del Vulture. Un'esperienza intima e fuori dal tempo, per soli 12 coperti a serata."
  }
];

export default function Activities() {
  const [activeId, setActiveId] = useState(EXPERIENCES[0].id);
  const [itinerary, setItinerary] = useState([]);
  const [wizardStep, setWizardStep] = useState(false);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const [pendingId, setPendingId] = useState(null);
  const [infoId, setInfoId] = useState(null); // Card info modal

  // Calendar states for the wizard
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  };

  const toggleItinerary = (id) => {
    // Se c'è un itinerario generato, mostra il banner di ricalcolo
    if (wizardStep === 'done') {
      setPendingId(id);
      return;
    }
    // In tutti gli altri casi (anche durante il wizard), permetti il toggle libero
    setItinerary(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Ricalcola MANTENENDO le vecchie risposte → salta il wizard e rigenera subito
  const confirmRecalculateKeep = () => {
    setItinerary(prev => {
      if (prev.includes(pendingId)) return prev.filter(i => i !== pendingId);
      return [...prev, pendingId];
    });
    setPendingId(null);
    setWizardStep('done'); // Va dritto al risultato con le vecchie risposte
  };

  // Ricalcola DA ZERO → aggiunge l'attività e riparte dal wizard
  const confirmRecalculateFresh = () => {
    setItinerary(prev => {
      if (prev.includes(pendingId)) return prev.filter(i => i !== pendingId);
      return [...prev, pendingId];
    });
    setPendingId(null);
    setWizardAnswers({});
    setWizardStep(false); // Riapre il wizard da capo
  };

  const cancelRecalculate = () => setPendingId(null);

  return (
    <div className="cinematic-wrapper">
      {/* Rendering all backgrounds and using opacity to transition (hardware accelerated) */}
      <div className="bg-container">
        {EXPERIENCES.map((exp) => (
          <div 
            key={`bg-${exp.id}`}
            className={`dynamic-bg ${activeId === exp.id ? 'active' : ''}`} 
            style={{ backgroundImage: `url(${exp.bgImage})` }}
          />
        ))}
      </div>

      {/* Cinematic Overlay */}
      <div className="cinematic-overlay"></div>

      <div className={`cinematic-content fade-in-up ${itinerary.length > 0 ? 'has-sidebar' : ''}`}>
        
        <header className="cinematic-header">
          <h1>Crea la tua leggenda.</h1>
          <p>Scorri per scoprire le esperienze più esclusive per vivere la Festa in prima fila.</p>
        </header>

        <div className="carousel-track">
          {EXPERIENCES.map((exp) => (
            <div 
              key={exp.id} 
              className="movie-poster-card"
              onMouseEnter={() => setActiveId(exp.id)}
            >
              <img src={exp.image} alt={exp.title} className="poster-img" loading="eager" />
              <div className="poster-gradient"></div>
              
              {/* Bottone info */}
              <button className="info-btn" onClick={(e) => { e.stopPropagation(); setInfoId(exp.id); }}>
                i
              </button>

              <div className="poster-info">
                <span className="category-tag">{exp.category}</span>
                <h2 className="poster-title">{exp.title}</h2>
                
                <div className="poster-meta">
                  <span>⏱ {exp.duration}</span>
                  <span>★ {exp.rating} ({exp.reviews})</span>
                </div>
                
                <div className="poster-action">
                  <span className="price">{exp.price}</span>
                  <button 
                    className={`book-btn ${itinerary.includes(exp.id) ? 'selected' : ''}`}
                    onClick={() => toggleItinerary(exp.id)}
                  >
                    {itinerary.includes(exp.id) ? '✓ Aggiunto' : '+ Aggiungi'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Aggiungiamo uno spazio vuoto alla fine per far sembrare il carosello infinito/conclusivo */}
          <div className="spacer-card"></div>
        </div>

      </div>

      {/* ITINERARY SIDEBAR (Slide-in) */}
      <div className={`itinerary-sidebar ${itinerary.length > 0 ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Il tuo Programma</h3>
          <span className="sidebar-count">{itinerary.length} {itinerary.length === 1 ? 'attività' : 'attività'}</span>
        </div>
        
        <div className="sidebar-timeline">
          {/* Se wizardStep è 'done', nascondiamo le card dell'itinerario e srotoliamo solo la pergamena */}
          {wizardStep !== 'done' && itinerary.map((id, index) => {
            const exp = EXPERIENCES.find(e => e.id === id);
            return (
              <div key={`side-${id}`} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <img src={exp.image} alt={exp.title} className="timeline-img" />
                  <div className="timeline-info">
                    <h4>{exp.title}</h4>
                    <span>{exp.duration} • {exp.price}</span>
                  </div>
                  <button className="remove-btn" onClick={() => toggleItinerary(exp.id)}>×</button>
                </div>
              </div>
            );
          })}

          {/* BANNER RICALCOLO */}
          {pendingId && (() => {
            const pendingExp = EXPERIENCES.find(e => e.id === pendingId);
            return (
              <div className="recalculate-banner fade-in-up">
                <div className="recalculate-icon">↺</div>
                <div className="recalculate-body">
                  <strong>Aggiornare l'itinerario?</strong>
                  <p>Hai aggiunto <em>{pendingExp?.title}</em></p>
                </div>
                <div className="recalculate-actions">
                  <button className="recalc-confirm-btn" onClick={confirmRecalculateKeep}>
                    ✦ Mantieni preferenze aggiungendo questa attività
                  </button>
                  <button className="recalc-fresh-btn" onClick={confirmRecalculateFresh}>
                    ↺ Rifai da zero aggiungendo questa attività
                  </button>
                  <button className="recalc-cancel-btn" onClick={cancelRecalculate}>
                    Annulla
                  </button>
                </div>
              </div>
            );
          })()}

          {/* IL QUIZ MAGICO (simile a KnightChat) */}
          {wizardStep !== false && wizardStep !== 'done' && (
            <div className="wizard-pergamena fade-in-up">
              <div className="pergamena-inner">
                <h4 className="pergamena-title">Cavaliere della Bruna AI</h4>
                
                {wizardStep === 0 && (
                  <div className="pergamena-step fade-in">
                    <p>In quanti siete in questo viaggio?</p>
                    <div className="pergamena-options">
                      {['Solo', 'In coppia', 'Gruppo di amici', 'Famiglia'].map(opt => (
                        <button key={opt} onClick={() => { setWizardAnswers({...wizardAnswers, people: opt}); setWizardStep(1); }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 1 && (
                  <div className="pergamena-step fade-in">
                    <p>In quali giorni il vostro cammino toccherà la Murgia?</p>
                    <div className="dynamic-input-container fade-in">
                      <BrunaCalendar onRangeSelect={(start, end) => { setDateFrom(start); setDateTo(end); }} />
                      <div className="input-actions" style={{ width: '100%', marginTop: '15px' }}>
                        <button 
                          className="confirm-btn"
                          disabled={!dateFrom || !dateTo} 
                          onClick={() => {
                            setWizardAnswers({...wizardAnswers, period: `Dal ${formatDate(dateFrom)} al ${formatDate(dateTo)}`});
                            setWizardStep(2);
                          }}>
                          Conferma {dateFrom && dateTo ? `(${formatDate(dateFrom)} - ${formatDate(dateTo)})` : 'Date'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="pergamena-step fade-in">
                    <p>Come vorreste vivere questo soggiorno?</p>
                    <div className="pergamena-options">
                      {[
                        { label: 'Risparmio', desc: '(0-80€)' },
                        { label: 'Comodo', desc: '(80–150€)' },
                        { label: 'Lusso', desc: '(150–250€)' },
                        { label: 'Magnifico', desc: '(250€+)' }
                      ].map(opt => (
                        <button key={opt.label} onClick={() => { setWizardAnswers({...wizardAnswers, budget: opt.label}); setWizardStep(3); }}>
                          {opt.label}<br/><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="pergamena-step fade-in">
                    <p>Cosa cerca la vostra anima tra le pietre antiche?</p>
                    <div className="pergamena-options">
                      {['Storia e spiritualità', 'Sapori e tradizioni', 'Arte e fotografia', 'Avventura'].map(opt => (
                        <button key={opt} onClick={() => { setWizardAnswers({...wizardAnswers, vibe: opt}); setWizardStep(4); }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="pergamena-step fade-in text-center">
                    <p>Ho tutto ciò che mi serve. Sto tracciando il vostro percorso segreto.</p>
                    <button className="build-program-btn" style={{ width: '100%', marginTop: '15px' }} onClick={() => setWizardStep('done')}>
                      Genera Itinerario Definitivo ➔
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RISULTATO FINALE (PERGAMENA GRANDE COME IN HOME) - nascosta se il banner di ricalcolo è attivo */}
          {wizardStep === 'done' && !pendingId && (
            <div className="final-program-wrapper fade-in-up" style={{ margin: '0 -30px' }}>
              <ItineraryResult 
                answers={wizardAnswers} 
                isActive={true} 
                selectedExperiences={itinerary.map(id => EXPERIENCES.find(e => e.id === id))} 
                hideMap={true}
              />
              <div style={{ padding: '0 20px 20px 20px' }}>
                <button className="recalc-fresh-btn" onClick={() => { setWizardStep(false); setWizardAnswers({}); }}>
                  ↺ Ricomincia e modifica
                </button>
              </div>
            </div>
          )}
        </div>
        
        {wizardStep === false && (
          <div className="sidebar-footer">
            <button className="build-program-btn" onClick={() => setWizardStep(0)}>Genera Programma ➔</button>
          </div>
        )}
      </div>

    </div>
  );
}
