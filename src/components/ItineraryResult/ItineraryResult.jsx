import { useState, useEffect } from 'react';
import './ItineraryResult.css';
import RouteMapbox from '../RouteMapbox/RouteMapbox';

// 4 Predefined routes
const ITINERARIES = {
  bruna: {
    title: 'Il Cammino della Bruna',
    subtitle: 'Il percorso sacro del Carro Trionfale',
    desc: 'Segui le orme dei cavalieri e il tracciato storico del 2 Luglio. Partendo dalla Fabbrica del Carro a Piccianello, passando per la Cattedrale, fino allo Strazzo in Piazza Vittorio Veneto. Un itinerario denso di devozione, folla e mito.',
    waypoints: [
      { 0: 16.6112, 1: 40.6667, title: 'Cattedrale di Matera', desc: 'Punto di snodo della processione storica. Il Carro sfila davanti alla facciata romanica.', time: '21:00', icon: '⛪' },
      { 0: 16.6046, 1: 40.6666, title: 'Via XX Settembre', desc: 'Il percorso del Carro attraversa questa via storica nel cuore del Sasso Barisano.', time: '22:00', icon: '🚶' },
      { 0: 16.6066, 1: 40.6663, title: 'Piazza Vittorio Veneto — Lo Strazzo', desc: 'La folla assalta il Carro e lo distrugge in pochi secondi. Adrenalina pura.', time: '22:30', icon: '🎆' }
    ],
    schedule: [
      {
        day: "2 Luglio - Il Giorno più Lungo",
        events: [
          { time: "05:00", type: "see", title: "Processione dei Pastori", desc: "La città si sveglia all'alba al suono dei botti. Inizio della processione storica dai rioni antichi." },
          { time: "12:30", type: "see", title: "La Scorta del Cavaliere", desc: "I Cavalieri scortano la statua della Madonna nella Fabbrica del Carro a Piccianello." },
          { time: "13:30", type: "eat", title: "Pranzo Tradizionale", desc: "Sosta in trattoria tipica per la 'Crapiata' materana, ricaricando le energie con la comunità." },
          { time: "20:00", type: "see", title: "Il Trionfo del Carro", desc: "Il Carro in cartapesta attraversa la città illuminata, scortato dai generali e dai fedeli." },
          { time: "22:30", type: "activity", title: "Lo Strazzo", desc: "Arrivo in Piazza Vittorio Veneto. La folla assalta e distrugge il Carro in pochi secondi. Pura adrenalina." },
          { time: "00:00", type: "sleep", title: "Notte nel cuore dei Sassi", desc: "Pernottamento consigliato presso 'Sextantio Le Grotte della Civita' per vivere il silenzio dopo la tempesta." }
        ]
      }
    ]
  },
  spiritual: {
    title: 'La Via dello Spirito',
    subtitle: 'Tra Chiese Rupestri e il Silenzio dei Sassi',
    desc: 'Un viaggio mistico pensato per chi cerca la pace. Attraverserete il Sasso Caveoso per raggiungere le antiche chiese scavate nella roccia e contemplare il tramonto dall\'altopiano della Murgia.',
    waypoints: [
      { 0: 16.6114, 1: 40.6631, title: 'Piazza San Pietro Caveoso', desc: 'La chiesa rupestre più antica dei Sassi. Inizio del cammino mistico nel silenzio dei vicoli.', time: '09:00', icon: '⛪' },
      { 0: 16.6119, 1: 40.6629, title: 'Madonna de Idris', desc: 'Santuario scavato nella roccia viva del tufo, incastonato nella collinetta dei Sassi.', time: '16:00', icon: '🗷️' },
      { 0: 16.6146, 1: 40.6644, title: 'Belvedere dei Sassi', desc: 'Il punto panoramico più suggestivo su tutto il rione Caveoso. Tramonto indimenticabile.', time: '19:00', icon: '🌅' }
    ],
    schedule: [
      {
        day: "Giorno 1 - L'Antico Culto",
        events: [
          { time: "09:00", type: "see", title: "Cattedrale e Sasso Caveoso", desc: "Passeggiata mistica nella Cattedrale Romanica e discesa lenta nei vicoli silenti del Sasso Caveoso." },
          { time: "13:00", type: "eat", title: "Pranzo con Vista", desc: "Pranzo leggero a 'Osteria Pico' ammirando il panorama mozzafiato sui Sassi." },
          { time: "16:00", type: "see", title: "Chiese Rupestri", desc: "Esplorazione della Madonna de Idris e Santa Lucia alle Malve, santuari millenari scavati a mano nel tufo." },
          { time: "20:00", type: "sleep", title: "Riposo mistico", desc: "Pernottamento in hotel diffuso ('Locanda di San Martino') con antiche terme romane interne." }
        ]
      }
    ]
  },
  adventure: {
    title: 'Il Sentiero Selvaggio',
    subtitle: 'L\'Avventura nella Murgia Materana',
    desc: 'Per gli spiriti indomiti. Si scende nel profondo del Canyon della Gravina attraverso il ponte tibetano, esplorando grotte naturali e sentieri sterrati tra falchi grillai e natura incontaminata.',
    waypoints: [
      { 0: 16.6105, 1: 40.6647, title: 'Piazzetta Pascoli', desc: 'Il punto di partenza: un belvedere vertiginoso sul canyon della Gravina.', time: '08:30', icon: '🏔️' },
      { 0: 16.6186, 1: 40.6619, title: 'Ponte Tibetano della Gravina', desc: 'Il ponte sospeso da brivido che collega i Sassi al Parco della Murgia.', time: '11:00', icon: '🧗' },
      { 0: 16.6201, 1: 40.6586, title: 'Parco della Murgia', desc: "L'altopiano selvaggio con grotte naturali e villaggi neolitici immersi nel verde.", time: '16:00', icon: '🌿' }
    ],
    schedule: [
      {
        day: "Giorno 1 - Discesa nel Burrone",
        events: [
          { time: "08:30", type: "activity", title: "Discesa nel Canyon", desc: "Trekking vertiginoso lungo il versante scosceso della Gravina partendo dal fantastico belvedere di Piazzetta Pascoli." },
          { time: "11:00", type: "activity", title: "Il Ponte Tibetano", desc: "Attraversamento da brivido dell'iconico ponte sospeso che collega i Sassi al selvaggio Parco della Murgia." },
          { time: "13:30", type: "eat", title: "Pranzo al Sacco Artigianale", desc: "Focaccia materana goduta all'ombra delle gigantesche Grotte dei Pipistrelli." },
          { time: "16:00", type: "see", title: "Villaggi Neolitici", desc: "Passeggiata tra i reperti trincerati e chiese rupestri remote in cima all'altopiano fiorito." },
          { time: "19:30", type: "sleep", title: "Glamping nel Parco", desc: "Notte indimenticabile in tenda di lusso o antica masseria rurale ('Masseria Fontana di Vite')." }
        ]
      }
    ]
  },
  food: {
    title: 'I Sensi dei Sassi',
    subtitle: 'Tradizione, Gusto e Relax',
    desc: 'Un percorso lento, disegnato sui sapori antichi. Dal pane nero di Matera ai peperoni cruschi, passando per i belvedere più belli. Una passeggiata senza sforzo per godersi la Città di Pietra.',
    waypoints: [
      { 0: 16.6074, 1: 40.6665, place: 'Panificio Storico, Sasso Barisano', title: 'Il Segreto del Pane IGP', desc: 'Laboratorio interattivo per imparare l\'antica arte del cornetto di pane materano.', time: '10:00' },
      { 0: 16.6101, 1: 40.6662, place: 'Ristorante tipico, centro storico',   title: 'Degustazione Crusca',      desc: 'Pranzo con Peperoni Cruschi e Strascinati in un ristorante tipico.',               time: '13:00' },
      { 0: 16.6095, 1: 40.6650, place: 'Via Bruno Buozzi / Piazza del Sedile', title: 'Botteghe Artigiane',       desc: 'Esplorazione dei negozietti in legno e ceramica.', time: '16:30' },
      { 0: 16.6108, 1: 40.6643, place: 'Enoteca dai Tosi',                    title: 'Cena Sotterranea',         desc: 'Degustazione di vini lucani e taglieri in una grotta circolare.',                time: '20:30' },
      { 0: 16.6082, 1: 40.6670, place: 'Palazzo Viceconte',                   title: 'Boutique Hotel',           desc: 'Pernottamento a Palazzo Viceconte, dimora nobiliare con terrazza privata sui Sassi.', time: '23:00' }
    ],
    schedule: [
      {
        day: "Giorno 1 - I Sapori di Grotta",
        events: [
          { time: "10:00", type: "activity", title: "Il Segreto del Pane IGP", desc: "Laboratorio interattivo in un panificio storico per imparare l'antica arte del cornetto di pane materano." },
          { time: "13:00", type: "eat", title: "Degustazione Crusca", desc: "Pranzo indimenticabile con Peperoni Cruschi e Strascinati in un ristorante tipico del centro storico." },
          { time: "16:30", type: "see", title: "Botteghe Artigiane", desc: "Esplorazione dei negozietti in legno e ceramica." },
          { time: "20:30", type: "eat", title: "Cena Sotterranea", desc: "Degustazione di vini strutturati lucani e taglieri presso 'Enoteca dai Tosi', incastonata in una grotta circolare." },
          { time: "23:00", type: "sleep", title: "Boutique Hotel", desc: "Pernottamento principesco a 'Palazzo Viceconte', dimora nobiliare con terrazza privata sui Sassi." }
        ]
      }
    ]
  }
};

export default function ItineraryResult({ answers, isActive }) {
  const [route, setRoute] = useState(ITINERARIES.spiritual);
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    // Logic to select the route based on answers
    const period = answers.period || '';
    const vibe = answers.vibe || '';

    let selectedKey = 'spiritual';
    if (period.includes('2 Luglio') || period.includes('Luglio')) {
      selectedKey = 'bruna';
    } else if (vibe.includes('Avventura')) {
      selectedKey = 'adventure';
    } else if (vibe.includes('Sapori')) {
      selectedKey = 'food';
    } else if (vibe.includes('Storia')) {
      selectedKey = 'spiritual';
    }
    
    setRoute(ITINERARIES[selectedKey]);
    
    // Inizia l'animazione della linea blu poco dopo il render (se attivo)
    if (isActive) {
      setTimeout(() => setDraw(true), 500);
    }
  }, [answers, isActive]);

  return (
    <div className={`itinerary-wrapper ${isActive ? 'is-active' : ''}`}>
      <div className={`parchment-container ${isActive ? 'parchment-unroll' : ''}` }>
        
        {/* ── SIGILLO COMPOSITO (RIPRISTINATO LAYOUT SEPARATO) ── */}
        <div className={`parchment-medallion composite-seal ${isActive ? 'reveal-seal' : ''}`}>
          
          <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className="medallion-svg">
            <defs>
              <path id="outerRing" d="M 110,110 m -88,0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0" />
            </defs>
            
            <circle cx="110" cy="110" r="100" fill="none" stroke="#8b6914" strokeWidth="1.5" />
            <circle cx="110" cy="110" r="95"  fill="none" stroke="#8b6914" strokeWidth="0.5" strokeDasharray="4 3" />
            <circle cx="110" cy="110" r="76"  fill="none" stroke="#8b6914" strokeWidth="1" />
            
            <text fontFamily="Georgia, serif" fontSize="9" fill="#8b2500" letterSpacing="3">
              <textPath href="#outerRing" startOffset="5%">
                ✦ IL TUO PIANO SEGRETO ✦ CAVALIERE DELLA BRUNA ✦ MATERA MMXXVI ✦
              </textPath>
            </text>

            {[0,60,120,180,240,300].map(angle => {
              const rad = (angle * Math.PI) / 180;
              const x = 110 + 76 * Math.cos(rad);
              const y = 110 + 76 * Math.sin(rad);
              return <text key={angle} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#8b6914">★</text>;
            })}
          </svg>

          {/* Il Timbro ora usa la PNG senza sfondo fornita dall'utente */}
          <div className="stamp-overlay-container">
            <div className={`post-mark-knight ${isActive ? 'stamp-drop' : ''}`}></div>
            <div className={isActive ? 'stamp-shockwave' : ''}></div>
          </div>
        </div>

        {/* Intestazione Pergamena */}
        <div className="parchment-header">
          <p className="parchment-meta">Sigillato dal Cavaliere della Bruna</p>
        </div>

        {/* Dettagli Itinerario */}
        <div className="itinerary-content">
          <h3 className="route-title">{route.title}</h3>
          <h4 className="route-subtitle">{route.subtitle}</h4>
          <p className="route-desc">{route.desc}</p>
        </div>

        {/* Piantina di Matera (Ora Mapbox 3D) */}
        <div className="map-container" style={{ margin: '0 auto', marginBottom: '30px' }}>
          {draw && route.waypoints && (
            <RouteMapbox waypoints={route.waypoints} draw={draw} />
          )}
        </div>
        
        {/* Programma Giornaliero (Timeline) */}
        {route.schedule && route.schedule.length > 0 && (
          <div className="timeline-container">
            {route.schedule.map((dayData, dIdx) => (
              <div key={dIdx} className="timeline-day-block">
                <h3 className="timeline-day-title">{dayData.day}</h3>
                <div className="timeline-events-list">
                  {dayData.events.map((evt, eIdx) => (
                    <div key={eIdx} className="timeline-event">
                      <div className="timeline-time">{evt.time}</div>
                      <div className="timeline-content">
                        {evt.type === 'eat'      && <span className="timeline-icon">🍽️</span>}
                        {evt.type === 'sleep'    && <span className="timeline-icon">🌙</span>}
                        {evt.type === 'activity' && <span className="timeline-icon">🥾</span>}
                        {evt.type === 'see'      && <span className="timeline-icon">🏛️</span>}
                        
                        {evt.type === 'activity' ? (
                          <div className="activity-card">
                            <h5 className="timeline-event-title">{evt.title}</h5>
                            <p className="timeline-event-desc">{evt.desc}</p>
                            <div className="explore-cta">Esplora Attività <span>➔</span></div>
                          </div>
                        ) : (
                          <>
                            <h5 className="timeline-event-title">{evt.title}</h5>
                            <p className="timeline-event-desc">{evt.desc}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="parchment-footer" style={{ marginTop: '20px', position: 'relative' }}>
          <button className="download-btn">Scarica la Mappa in PDF</button>
        </div>
        
      </div>
    </div>
  );
}

