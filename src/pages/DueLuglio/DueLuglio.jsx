import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './DueLuglio.css';

function drawMotif(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const currentRadius = i % 2 ? radius * 0.42 : radius;
    const x = cx + Math.cos(angle) * currentRadius;
    const y = cy + Math.sin(angle) * currentRadius;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawScratchCover(ctx, width, height) {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#cda646');
  base.addColorStop(0.5, '#a87f24');
  base.addColorStop(1, '#6e4f12');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const folds = 9;
  for (let i = 0; i < folds; i++) {
    const x = ((i + 0.5) * width) / folds + (Math.random() * 60 - 30);
    const foldWidth = (width / folds) * (0.8 + Math.random() * 0.6);
    const fold = ctx.createLinearGradient(x - foldWidth / 2, 0, x + foldWidth / 2, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0)');
    fold.addColorStop(0.5, i % 2 ? 'rgba(58,38,6,0.28)' : 'rgba(255,230,160,0.12)');
    fold.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fold;
    ctx.fillRect(x - foldWidth / 2, 0, foldWidth, height);
  }

  // trama fine del tessuto
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < height; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random());
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,245,200,0.05)';
  for (let x = 0; x < width; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() * 1.6 - 0.8), height);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,240,190,0.07)';
  for (let i = 0; i < (width * height) / 650; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  ctx.fillStyle = 'rgba(30,20,0,0.09)';
  for (let i = 0; i < (width * height) / 850; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  ctx.strokeStyle = 'rgba(255,235,170,0.14)';
  ctx.lineWidth = Math.max(1, width / 1400);
  const step = Math.max(80, width / 14);
  let row = 0;
  for (let y = step / 2; y < height + step; y += step * 0.85) {
    const offset = row % 2 ? step / 2 : 0;
    for (let x = offset; x < width + step; x += step) {
      drawMotif(ctx, x, y, step * 0.16);
    }
    row++;
  }

  const sheen = ctx.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, 'rgba(255,250,220,0.11)');
  sheen.addColorStop(0.45, 'rgba(255,250,220,0)');
  sheen.addColorStop(0.7, 'rgba(255,250,220,0.07)');
  sheen.addColorStop(1, 'rgba(255,250,220,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) / 3, width / 2, height / 2, Math.max(width, height) / 1.05);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(18,11,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

const DAY_PROGRAM = [
  {
    time: '05:00',
    title: 'Processione dei Pastori',
    place: 'Centro storico',
    note: 'La festa comincia all alba con botti, campane e preghiere tra i quartieri.'
  },
  {
    time: '09:30',
    title: 'Mattina a Piccianello',
    place: 'Chiesa dell Annunziata',
    note: 'Momento piu raccolto per vedere la statua e respirare l attesa del rione.'
  },
  {
    time: '17:00',
    title: 'Raduno dei Cavalieri',
    place: 'Piccianello',
    note: 'Costumi, cavalli bardati e preparazione della scorta al Carro Trionfale.'
  },
  {
    time: '19:30',
    title: 'Uscita del Carro',
    place: 'Da Piccianello al centro',
    note: 'Arriva presto lungo il percorso: questo e il momento piu fotografato.'
  },
  {
    time: '22:30',
    title: 'Tre giri e Strazzo',
    place: 'Piazza Vittorio Veneto',
    note: 'La folla si concentra in piazza. Resta ai bordi se vuoi guardare senza entrare nel mucchio.'
  },
  {
    time: '00:30',
    title: 'Fuochi sulla Murgia',
    place: 'Belvederi e Sassi',
    note: 'Chiusura scenografica della giornata, ideale da Piazzetta Pascoli o Caveoso.'
  }
];

const QUICK_QUESTIONS = [
  'Dove vedo meglio il Carro?',
  'Dove parcheggio?',
  'Cosa porto con me?',
  'Dove vado con bambini?'
];

const ANSWERS = [
  {
    keys: ['ved', 'carro', 'punto', 'posto', 'foto'],
    answer: 'Per vedere bene il Carro scegli Via Lucana o l area verso Piazza Vittorio Veneto, arrivando molto prima della sera. Se vuoi meno pressione, guarda il passaggio lungo il percorso e non solo lo Strazzo.'
  },
  {
    keys: ['parche', 'auto', 'macchina', 'navetta', 'ztl'],
    answer: 'Il consiglio e lasciare l auto fuori dal centro e muoverti a piedi o con navetta. Controlla la pagina Viabilita prima di partire: il 2 luglio le chiusure cambiano durante la giornata.'
  },
  {
    keys: ['porto', 'zaino', 'acqua', 'caldo', 'scarpe'],
    answer: 'Porta acqua, cappello, power bank, scarpe comode e una maglia leggera per la notte. Evita zaini grandi nelle zone piu affollate.'
  },
  {
    keys: ['bambin', 'famiglia', 'anzian', 'tranquill'],
    answer: 'Con bambini o persone anziane conviene vivere mattina e pomeriggio a Piccianello, poi scegliere un punto laterale del percorso. Evita il centro del mucchio durante lo Strazzo.'
  },
  {
    keys: ['mang', 'pranzo', 'cena', 'ristorante', 'food'],
    answer: 'Prenota pranzo o cena con anticipo. Il giorno della festa punta su pause brevi: focaccia, acqua e rientri rapidi nei vicoli meno pieni.'
  },
  {
    keys: ['fuoch', 'murgia', 'notte'],
    answer: 'Per i fuochi cerca un belvedere con uscita comoda, come Piazzetta Pascoli o zona Caveoso. Non aspettare l ultimo minuto: dopo lo Strazzo i flussi pedonali sono lenti.'
  }
];

const USEFUL_BOXES = [
  {
    label: 'Punti vista',
    title: 'Dove mettersi',
    text: 'Via Lucana per il passaggio, Piazza Vittorio Veneto per il rito, Piazzetta Pascoli per chiudere con i fuochi.',
    action: 'Apri mappa',
    to: '/viabilita'
  },
  {
    label: 'Mobilita',
    title: 'Parcheggi e navette',
    text: 'Arriva con margine, lascia l auto fuori dal centro e tieni un percorso di rientro semplice.',
    action: 'Vai alla viabilita',
    to: '/viabilita'
  },
  {
    label: 'Comfort',
    title: 'Kit del 2 Luglio',
    text: 'Acqua, cappello, power bank, scarpe stabili, documento e poche cose addosso.',
    action: 'Vedi consigli',
    to: '#checklist'
  },
  {
    label: 'Community',
    title: 'Foto e recensioni',
    text: 'Raccogli la tua cartolina, leggi le esperienze e condividi il momento migliore della giornata.',
    action: 'Apri social',
    to: '/social'
  }
];

const CHECKLIST = [
  'Auto fuori dal centro',
  'Batteria sopra 70%',
  'Acqua gia nello zaino',
  'Scarpe comode',
  'Punto di ritrovo scelto',
  'Rientro pianificato'
];

const KIT_ITEMS = [
  'Acqua',
  'Cappello',
  'Power bank',
  'Scarpe comode',
  'Documento',
  'Maglia leggera'
];

const normalize = (value) => value.trim().toLowerCase();

function getKnightAnswer(value) {
  const query = normalize(value);
  if (!query) {
    return 'Scrivi una domanda pratica: dove metterti, come muoverti, cosa portare o come vivere la festa senza stress.';
  }

  const match = ANSWERS.find((item) => item.keys.some((key) => query.includes(key)));
  return match?.answer || 'Ti consiglio di tenere il programma aperto e controllare viabilita, meteo e punti di uscita. Per il 2 luglio la regola d oro e muoversi presto e restare leggeri.';
}

export default function DueLuglio() {
  const scratchCanvasRef = useRef(null);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [question, setQuestion] = useState('');
  const [kitOpen, setKitOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('Cosa mi consigli per il 2 luglio?');
  const [answer, setAnswer] = useState(
    'Arriva presto, scegli un punto preciso dove vedere il Carro e tieni sempre un piano di rientro. Io posso aiutarti con parcheggi, punti vista, bambini, caldo e fuochi.'
  );

  useEffect(() => {
    if (introDone) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [introDone]);

  useEffect(() => {
    if (introDone) return undefined;

    const canvas = scratchCanvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      drawScratchCover(ctx, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [introDone]);

  // quando l'utente sceglie di sbirciare, il manto si apre e lascia il posto alla pagina
  useEffect(() => {
    if (!introLeaving) return undefined;
    const timer = window.setTimeout(() => setIntroDone(true), 900);
    return () => window.clearTimeout(timer);
  }, [introLeaving]);

  const revealPage = () => setIntroLeaving(true);

  const askKnight = (value) => {
    const nextQuestion = value.trim();
    setLastQuestion(nextQuestion || 'Domanda rapida');
    setAnswer(getKnightAnswer(nextQuestion));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askKnight(question);
  };

  return (
    <>
    {!introDone && (
      <section className={`dl2-scratch-intro ${introLeaving ? 'dl2-scratch-leaving' : ''}`} aria-label="Ingresso 2 Luglio">
        <canvas ref={scratchCanvasRef} className="dl2-scratch-canvas" />
        <div className="dl2-peek-box">
          <span className="dl2-peek-kicker">2 Luglio · Festa della Bruna</span>
          <h1 className="dl2-peek-title">Sotto questo manto c’è la giornata più lunga di Matera.</h1>
          <p className="dl2-peek-text">Vuoi sbirciare?</p>
          <button type="button" className="dl2-peek-button" onClick={revealPage}>
            Sì, fammi vedere ✦
          </button>
        </div>
      </section>
    )}

    <main className={`dl2-page ${introDone ? 'dl2-page-revealed' : 'dl2-page-waiting'}`}>
      <section className="dl2-mobile" aria-label="La giornata della Bruna in breve">
        <header className="dl2-mobile-head">
          <span className="dl2-kicker">2 Luglio · Festa della Bruna</span>
          <h1>La Bruna</h1>
          <p>La giornata della Bruna, tutta in una pagina.</p>
        </header>

        <h2 className="dl2-mobile-section-title">Il programma</h2>
        <ol className="dl2-mobile-program">
          {DAY_PROGRAM.map((item) => (
            <li key={`m-${item.time}-${item.title}`}>
              <time>{item.time}</time>
              <div>
                <strong>{item.title}</strong>
                <span>{item.place}</span>
                <p>{item.note}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="dl2-mobile-actions">
          <Link to="/viabilita">Dove mettersi</Link>
          <Link to="/viabilita">Parcheggi e navette</Link>
          <button
            type="button"
            className={kitOpen ? 'dl2-mobile-kit-open' : ''}
            onClick={() => setKitOpen((open) => !open)}
          >
            Kit 2 Luglio
          </button>
        </div>

        {kitOpen && (
          <ul className="dl2-mobile-kit">
            {KIT_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        <a href="#app-store" className="dl2-mobile-app">
          <div className="dl2-mobile-app-info">
            <span className="dl2-kicker">App</span>
            <strong>La Mia Bruna</strong>
            <p>Programma, notifiche e percorsi sempre con te.</p>
            <span className="dl2-mobile-store-badge">
              <svg viewBox="0 0 814 1000" aria-hidden="true" focusable="false">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
              </svg>
              <span className="dl2-mobile-store-text">
                <small>Scarica su</small>
                <b>App Store</b>
              </span>
            </span>
          </div>
          <img src="/carro_dorato.png" alt="" draggable="false" />
        </a>
      </section>

      <section className="dl2-hero" aria-labelledby="due-luglio-title">
        <div className="dl2-hero-copy">
          <span className="dl2-kicker">Matera da Vivere · 2 Luglio 2026</span>
          <h1 id="due-luglio-title">La giornata della Bruna, tutta in una pagina.</h1>
          <p>
            Programma, consigli pratici, app e Cavaliere AI per orientarti durante la festa piu intensa di Matera.
          </p>
          <div className="dl2-hero-actions">
            <a href="#programma" className="dl2-primary-action">Vedi programma</a>
            <a href="#cavaliere" className="dl2-secondary-action">Chiedi al Cavaliere</a>
          </div>
        </div>

        <div className="dl2-hero-visual" aria-hidden="true">
          <div className="dl2-hero-frame">
            <img src="/carro_dorato.png" alt="" draggable="false" />
          </div>
          <div className="dl2-hero-stats">
            <span>05:00</span>
            <strong>inizio festa</strong>
          </div>
        </div>
      </section>

      <section className="dl2-dashboard" aria-label="Strumenti per il 2 luglio">
        <article className="dl2-panel dl2-program-panel" id="programma">
          <div className="dl2-panel-head">
            <span className="dl2-panel-label">Programma</span>
            <h2>La giornata in ordine</h2>
          </div>
          <ol className="dl2-program-list">
            {DAY_PROGRAM.map((item) => (
              <li key={`${item.time}-${item.title}`}>
                <time>{item.time}</time>
                <div>
                  <h3>{item.title}</h3>
                  <span>{item.place}</span>
                  <p>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="dl2-panel dl2-app-panel">
          <div className="dl2-panel-head">
            <span className="dl2-panel-label">App</span>
            <h2>La Mia Bruna</h2>
          </div>
          <p>
            Salva programma, notifiche, punti utili e percorso di rientro. Pensata per tenere tutto a portata di mano durante la festa.
          </p>
          <div className="dl2-phone-preview" aria-hidden="true">
            <span>2 Luglio</span>
            <strong>Prossimo evento</strong>
            <p>Uscita del Carro · 19:30</p>
          </div>
          <div className="dl2-store-row" aria-label="Scarica app">
            <a href="#app-store" className="dl2-store-button">
              <span>Scarica su</span>
              <strong>App Store</strong>
            </a>
            <a href="#play-store" className="dl2-store-button">
              <span>Disponibile su</span>
              <strong>Google Play</strong>
            </a>
          </div>
        </article>

        <article className="dl2-panel dl2-ai-panel" id="cavaliere">
          <div className="dl2-panel-head">
            <span className="dl2-panel-label">Cavaliere AI</span>
            <h2>Domande rapide</h2>
          </div>
          <div className="dl2-ai-answer">
            <span>{lastQuestion}</span>
            <p>{answer}</p>
          </div>
          <form className="dl2-ai-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Es: dove mi metto per vedere il Carro?"
              aria-label="Domanda per il Cavaliere AI"
            />
            <button type="submit">Chiedi</button>
          </form>
          <div className="dl2-question-chips">
            {QUICK_QUESTIONS.map((item) => (
              <button type="button" key={item} onClick={() => askKnight(item)}>
                {item}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="dl2-useful-grid" aria-label="Cose utili durante la festa">
        {USEFUL_BOXES.map((item) => (
          <article className="dl2-tool-card" key={item.title}>
            <span>{item.label}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
            {item.to.startsWith('#') ? (
              <a href={item.to}>{item.action}</a>
            ) : (
              <Link to={item.to}>{item.action}</Link>
            )}
          </article>
        ))}
      </section>

      <section className="dl2-checklist-panel" id="checklist" aria-labelledby="checklist-title">
        <div>
          <span className="dl2-panel-label">Prima di uscire</span>
          <h2 id="checklist-title">Controllo veloce</h2>
        </div>
        <ul>
          {CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
    </>
  );
}
