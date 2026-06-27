import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import './Prova.css';
import BrunaCalendar from '../../components/BrunaCalendar/BrunaCalendar';
import ItineraryResult, { scrollToPergamenaAnchor } from '../../components/ItineraryResult/ItineraryResult';

const getActivityReviewSlug = (title) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Programma e pergamena salvati per la sessione: navigando alle recensioni
// e tornando indietro, sidebar/wizard/itinerario si ritrovano come lasciati.
const PROGRAM_STORAGE_KEY = 'provaProgramma';

const readSavedProgram = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PROGRAM_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

// ── DATA ──────────────────────────────────────────────────────────────────
const ITEMS = [
      { title:"Tour dei Sassi al Tramonto", cat:"Cultura & Storia", price:"25€", rating:"4.9", reviews:1240, duration:"2 ore",
        img:"/hud/matera_sassi_sunset.png", desc: "Scopri la magia dei Sassi di Matera al calar del sole in un suggestivo percorso guidato tra i rioni storici. Visiteremo antiche cisterne e chiese rupestri avvolti dalla luce dorata del tramonto.", map: "Piazza Vittorio Veneto, Matera", cont: "+39 333 1234567 | info@materatours.it", dates: "Tutti i giorni, h 18:00", coords: [16.6105, 40.6664] },
      { title:"Volo in Mongolfiera all'Alba", cat:"Avventura", price:"180€", rating:"5.0", reviews:312, duration:"3 ore",
        img:"/hud/matera_hot_air_balloon.png", desc: "Sorvola i Sassi e il Parco della Murgia alle prime luci dell'alba in un'esperienza mozzafiato. Al termine del volo nel silenzio più assoluto, brinderemo con deliziosi prodotti tipici locali.", map: "Contrada Murgia Timone, Matera", cont: "+39 340 9876543 | voli@matera-balloons.com", dates: "Mar, Gio, Sab, Dom, h 05:30", coords: [16.6210, 40.6720] },
      { title:"Laboratorio del Pane IGP", cat:"Food & Drink", price:"45€", rating:"4.8", reviews:580, duration:"2.5 ore",
        img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1400&auto=format&fit=crop", desc: "Metti le mani in pasta e scopri i segreti della panificazione tradizionale materana in un antico forno. Impara la storia del Pane di Matera IGP e gusta la tua forma calda appena sfornata.", map: "Via Santo Stefano, Matera", cont: "+39 0835 123456 | panificio@materabread.it", dates: "Lun, Mer, Ven, h 10:00", coords: [16.6080, 40.6675] },
      { title:"Trekking Murgia Materana", cat:"Natura", price:"20€", rating:"4.7", reviews:890, duration:"4 ore",
        img:"https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1400&auto=format&fit=crop", desc: "Avventurati attraverso il canyon della Gravina, tra ponti tibetani e antiche chiese rupestri. Un'escursione indimenticabile che unisce la natura selvaggia del Parco Archeologico alla spiritualità.", map: "Jazzo Gattini, Parco della Murgia", cont: "+39 320 1122334 | trekking@murgiapark.it", dates: "Sabato e Domenica, h 09:00", coords: [16.6150, 40.6600] },
      { title:"E-Bike dalla Cripta", cat:"Sport", price:"35€", rating:"4.9", reviews:420, duration:"½ Giornata",
        img:"https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1400&auto=format&fit=crop", desc: "Esplora senza fatica le magnifiche campagne materane fino alla Cripta del Peccato Originale, la 'Cappella Sistina' dell'arte rupestre. Un tour in E-Bike immersivo, panoramico e green.", map: "Piazzetta Pascoli, Matera", cont: "+39 331 4455667 | rent@ebikematera.it", dates: "Tutti i giorni, h 09:00 e 15:00", coords: [16.6040, 40.6650] },
      { title:"Cena Romantica in Grotta", cat:"Exclusive", price:"90€", rating:"4.9", reviews:215, duration:"Serata intera",
        img:"/hud/matera_romantic_dinner.png", desc: "Goditi un esclusivo menu degustazione a lume di candela in un raffinato ristorante scavato direttamente nel tufo del Sasso Caveoso. Un'atmosfera intima e suggestiva per una serata speciale.", map: "Sasso Caveoso, Matera", cont: "+39 0835 987654 | ristorante@grottamatera.it", dates: "Tutte le sere, su prenotazione", coords: [16.6110, 40.6640] },
];

export default function Prova() {
  const containerRef = useRef(null);
  // Stato eventualmente salvato prima di navigare via (es. verso le recensioni)
  const savedProgramRef = useRef(readSavedProgram());
  const [modalData, setModalData] = useState(null);
  const [selectedItems, setSelectedItems] = useState(() => savedProgramRef.current?.selectedItems || []); // indici sincronizzati col Set dell'HUD
  const [programOpen, setProgramOpen] = useState(() => Boolean(savedProgramRef.current?.programOpen));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Navigate sempre aggiornato, usabile dentro l'effetto a deps vuote (hudOpenReviews)
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  // Da dove è stata aperta la scheda descrizione, per riportarci l'utente alla chiusura:
  // null = dall'HUD (si resta qui) · 'map' = mappa della home · 'home' = pergamena
  // della home · 'prova' = pergamena della sidebar "Il mio programma".
  const returnTargetRef = useRef(null);
  // Indice dell'attività da riselezionare tornando sulla mappa /geolocalizzati.
  const geoReturnIndexRef = useRef(null);

  const closeModal = () => {
    const target = returnTargetRef.current;
    returnTargetRef.current = null;

    if (target === 'geo') {
      // Si arrivava dalla mappa /geolocalizzati: torniamo lì riaprendo la barra
      // sull'evento/attività appena consultato (non in home page).
      const idx = geoReturnIndexRef.current;
      geoReturnIndexRef.current = null;
      navigate('/geolocalizzati', { state: { reselectActivity: idx } });
      return;
    }
    if (target === 'map') {
      navigate('/', { state: { scrollToMap: true } });
      return;
    }
    if (target === 'home') {
      // La pergamena della home viene ripristinata da KnightChat (sessionStorage)
      navigate('/');
      return;
    }
    setModalData(null);
    if (target === 'prova') {
      // Si era nella pergamena della sidebar: riaprila e torna alla card
      // dell'attività appena consultata (l'apertura dura 0.5s)
      setProgramOpen(true);
      setTimeout(scrollToPergamenaAnchor, 600);
    }
  };

  // ── Wizard "Genera Programma" (stessa logica di Esplora attività) ──
  const [wizardStep, setWizardStep] = useState(() => savedProgramRef.current?.wizardStep ?? false); // false | 0..4 | 'done'
  const [wizardAnswers, setWizardAnswers] = useState(() => savedProgramRef.current?.wizardAnswers || {});
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const formatDate = (date) =>
    date ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';

  const formatDateOnly = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];

    return ITEMS
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.cat.toLowerCase().includes(normalizedSearch) ||
        item.desc.toLowerCase().includes(normalizedSearch) ||
        item.map.toLowerCase().includes(normalizedSearch) ||
        item.dates.toLowerCase().includes(normalizedSearch)
      ));
  }, [normalizedSearch]);

  const goToActivity = (index) => {
    if (typeof window !== 'undefined' && window.hudGoTo) {
      window.hudGoTo(index);
    }
    setSearchFocused(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      goToActivity(searchResults[0].index);
    }
  };

  // Persistenza del programma per la sessione (vedi PROGRAM_STORAGE_KEY)
  useEffect(() => {
    try {
      if (selectedItems.length > 0 || wizardStep !== false || programOpen) {
        sessionStorage.setItem(
          PROGRAM_STORAGE_KEY,
          JSON.stringify({ selectedItems, wizardStep, wizardAnswers, programOpen })
        );
      } else {
        sessionStorage.removeItem(PROGRAM_STORAGE_KEY);
      }
    } catch { /* ignora */ }
  }, [selectedItems, wizardStep, wizardAnswers, programOpen]);

  useEffect(() => {
    // Arrivando da una pagina scrollata (es. la mappa in fondo alla home), senza
    // questo reset l'HUD si presenta già scrollato sul footer: si riparte dall'alto.
    window.scrollTo(0, 0);

    const N = ITEMS.length;
    let cur = 0, spinning = false;
    // Il Set dell'HUD riparte dalle attività eventualmente ripristinate
    const selected = new Set(savedProgramRef.current?.selectedItems || []);
    const container = containerRef.current;
    if (!container) return;

    window.hudOpenModal = function(idx) {
      returnTargetRef.current = null; // aperta dall'interno dell'HUD → alla chiusura si resta qui
      setModalData(ITEMS[idx]);
    };

    const G = (id) => container.querySelector(`#${id}`);

    // Preload images
    ITEMS.forEach(it => { const i = new Image(); i.src = it.img; });

    // ── BUILD TRACKS ─────────────────────────────────────────────────────────────
    function buildTracks() {
      const b1 = G('band-1');
      const b2 = G('band-2');
      const b3 = G('band-3');
      if(!b1 || !b2 || !b3) return;

      const h1 = b1.offsetHeight;
      const h2 = b2.offsetHeight;
      const h3 = b3.offsetHeight;
      const t1 = G('track-1');
      const t2 = G('track-2');
      const t3 = G('track-3');
      t1.innerHTML = ''; t2.innerHTML = ''; t3.innerHTML = '';

      ITEMS.forEach((it, i) => {
        // Band 1 slide
        const s1 = document.createElement('div');
        s1.className = 'band-slide';
        s1.style.height = h1 + 'px';
        s1.innerHTML = `
          <div class="slide-img" style="background-image:url(${it.img})"></div>
          <div class="slide-cat">${it.cat}</div>
          <div class="slide-counter">${String(i+1).padStart(2,'0')}</div>
        `;
        t1.appendChild(s1);

        // Band 2 slide
        const s2 = document.createElement('div');
        s2.className = 'band-slide';
        s2.style.height = h2 + 'px';
        s2.innerHTML = `
          <div class="slide-title-bg">${it.title}</div>
          <h2 class="slide-title">${it.title}</h2>
          <div class="slide-desc-btn" onclick="window.hudOpenModal(${i})">Leggi descrizione</div>
          <div class="slide-duration">${it.duration}</div>
        `;
        t2.appendChild(s2);

        // Band 3 slide
        const s3 = document.createElement('div');
        s3.className = 'band-slide';
        s3.style.height = h3 + 'px';
        s3.innerHTML = `
          <div class="slide-price">
            <span class="price-label">A partire da</span>
            <span class="price-val">${it.price}</span>
          </div>
          <div class="b3-line"></div>
          <div class="slide-reviews">★ ${it.rating} · ${it.reviews.toLocaleString()} recensioni</div>
          <div class="slide-cta">
            <div class="add-ring" id="ring-${i}" onclick="window.hudToggleAdd(${i})">
              <span class="add-plus" style="font-size:22px;color:var(--gold-l)">+</span>
            </div>
            <div class="add-label">Aggiungi al programma</div>
          </div>
        `;
        t3.appendChild(s3);
      });

      // Build dots
      const dotsEl = G('dots');
      if(dotsEl) {
        dotsEl.innerHTML = '';
        ITEMS.forEach((_, i) => {
          const d = document.createElement('div');
          d.className = 'dot-p' + (i === 0 ? ' active' : '');
          d.id = `dot-${i}`;
          d.onclick = () => window.hudGoTo(i);
          d.style.cursor = 'none';
          dotsEl.appendChild(d);
        });
      }

      // Anelli "aggiunto" coerenti col programma (anche dopo un ripristino)
      ITEMS.forEach((_, i) => {
        const ring = G(`ring-${i}`);
        if (ring) ring.classList.toggle('done', selected.has(i));
      });

      setPositions(0, false);
    }

    // ── POSITION TRACKS ───────────────────────────────────────────────────────────
    function setPositions(idx, animated = true) {
      if(!G('band-1')) return;
      const h1 = G('band-1').offsetHeight;
      const h2 = G('band-2').offsetHeight;
      const h3 = G('band-3').offsetHeight;

      const apply = (track, h, delay, dur) => {
        if(!track) return;
        track.style.transition = animated
          ? `transform ${dur}s cubic-bezier(0.77,0,0.18,1) ${delay}s`
          : 'none';
        track.style.transform = `translateY(-${idx * h}px)`;
      };

      apply(G('track-3'), h3, 0,    0.55);
      apply(G('track-2'), h2, 0.09, 0.58);
      apply(G('track-1'), h1, 0.17, 0.60);
    }

    // ── NAVIGATE ──────────────────────────────────────────────────────────────────
    window.hudGoTo = function(idx) {
      if (spinning || idx === cur || idx < 0 || idx >= N) return;
      spinning = true;
      cur = idx;

      setPositions(cur, true);

      // Flash after all bands settle (~850ms)
      setTimeout(() => {
        const flash = G('scan-flash');
        if(flash) {
          flash.classList.remove('fire');
          void flash.offsetWidth;
          flash.classList.add('fire');
        }
        spinning = false;
        updateMeta();
      }, 850);
    }

    window.hudNavigate = function(dir) { window.hudGoTo(cur + dir); }

    function updateMeta() {
      // Dots
      container.querySelectorAll('.dot-p').forEach((d,i) => d.classList.toggle('active', i === cur));
      // Update header stars
      const starContainer = G('header-stars');
      if(starContainer) {
        starContainer.innerHTML = `<span class="star">★</span>${ITEMS[cur].rating}`;
      }
      // V-fill
      if(G('v-fill')) G('v-fill').style.height = `${((cur+1)/N)*100}%`;
      // Add ring states
      ITEMS.forEach((_, i) => {
        const ring = G(`ring-${i}`);
        if (ring) ring.classList.toggle('done', selected.has(i));
      });
    }

    // ── TOGGLE ADD ────────────────────────────────────────────────────────────────
    window.hudToggleAdd = function(idx) {
      if (selected.has(idx)) {
        selected.delete(idx);
        setSelectedItems(Array.from(selected));
        const ring = G(`ring-${idx}`);
        if(ring) {
          ring.classList.remove('done');
          const plus = ring.querySelector('.add-plus');
          if(plus) plus.style.opacity = '1';
        }
        showToast('Rimosso dal programma');
      } else {
        const ring = G(`ring-${idx}`);
        if(ring) ring.classList.add('spinning');
        setTimeout(() => {
          if(!G(`ring-${idx}`)) return;
          const r = G(`ring-${idx}`);
          r.classList.remove('spinning');
          r.classList.add('done');
          selected.add(idx);
          setSelectedItems(Array.from(selected));
          if(G('badge-count')) G('badge-count').textContent = selected.size;
          showToast(`"${ITEMS[idx].title.split(' ').slice(0,3).join(' ')}…" aggiunto`);
        }, 650);
      }
      if(G('badge-count')) G('badge-count').textContent = selected.size;
    }

    // ── PARALLAX on band-2 title ──────────────────────────────────────────────────
    let curX = 0, curY = 0;
    let rAF;
    
    function mouseMoveHandler(e) {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const titles = container.querySelectorAll('.slide-title');
      const bgs = container.querySelectorAll('.slide-title-bg');
      const imgs = container.querySelectorAll('.slide-img');
      titles.forEach(t => { t.style.transform = `translateX(${mx * 8}px)`; });
      bgs.forEach(t => { t.style.transform = `translateY(-50%) translateX(${mx * -18}px)`; });
      imgs.forEach(img => { img.style.transform = `translateX(${mx * -6}px)`; });

      // cursor
      curX += (e.clientX - curX) * 0.14;
      curY += (e.clientY - curY) * 0.14;
      if(G('cur-ring')) {
        G('cur-ring').style.left = curX + 'px';
        G('cur-ring').style.top = curY + 'px';
      }
      if(G('cur')) {
        G('cur').style.left = e.clientX + 'px';
        G('cur').style.top = e.clientY + 'px';
      }
    }

    function curTick() {
      rAF = requestAnimationFrame(curTick);
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    curTick();

    // big cursor on band2
    const band2 = G('band-2');
    const mhEnter = () => G('cur') && G('cur').classList.add('big');
    const mhLeave = () => G('cur') && G('cur').classList.remove('big');
    if(band2) {
      band2.addEventListener('mouseenter', mhEnter);
      band2.addEventListener('mouseleave', mhLeave);
    }

    function keyDownHandler(e) {
      if (document.querySelector('.hud-modal-overlay')) return;
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      if (isEditable) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') window.hudNavigate(1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') window.hudNavigate(-1);
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); window.hudToggleAdd(cur); }
    }
    document.addEventListener('keydown', keyDownHandler);

    // ── SCROLL WHEEL ──────────────────────────────────────────────────────────────
    let lastWheelTime = 0;
    
    function wheelHandler(e) {
      if (document.querySelector('.hud-modal-overlay')) {
        e.preventDefault(); // Blocca scrolling nativo del body se il modale è aperto
        return;
      }
      const isScrollToFooter = (cur === N - 1 && e.deltaY > 0);
      const isScrollFromFooter = (window.scrollY > 5 && e.deltaY < 0);
      let now = Date.now();
      let delta = e.deltaY;

      // Se sei all'ultima attività e vuoi scendere, permettiamo il native scroll 
      // solo se l'animazione è ferma o c'è un colpo deciso per "sfondare" il footer.
      if (isScrollToFooter && !spinning && (now - lastWheelTime > 100 || Math.abs(delta) > 30)) {
        return;
      }

      // Risalita dal footer
      if (isScrollFromFooter) {
        lastWheelTime = now;
        return;
      }

      e.preventDefault(); // blocca lo scroll nell'HUD

      // Se l'animazione 3D è in corso (dura circa 1s), tracciamo l'arrivo 
      // del segnale ma lo ignoriamo per evitare accavallamenti grafici.
      if (spinning) {
        lastWheelTime = now;
        return;
      }

      // Se siamo fuori dall'animazione, controlliamo se questo scroll è un rimasuglio 
      // di inerzia o un colpo nuovo. (Inerzia = eventi arrivano < 100ms di distanza 
      // ed hanno una potenza debole giunta a fine corsa).
      if (now - lastWheelTime < 100) {
        lastWheelTime = now;
        // Se il tocco è deciso (> 30), è uno scorrimento volontario veloce! Lasciapassare.
        if (Math.abs(delta) < 30) return; 
      } else {
        lastWheelTime = now;
      }
      
      const dir = delta > 0 ? 1 : -1;
      
      // limit navigation bounds
      if (cur + dir >= N || cur + dir < 0) return;
      
      window.hudNavigate(dir);
    }
    container.addEventListener('wheel', wheelHandler, { passive: false });

    // ── SWIPE ─────────────────────────────────────────────────────────────────────
    let ty0 = 0;
    function tStart(e) { ty0 = e.touches[0].clientY; }
    
    function tMove(e) {
      if (document.querySelector('.hud-modal-overlay')) {
        e.preventDefault(); // Blocca lo scorrimento verso il footer su iOS Safari
        return;
      }
      const dy = e.touches[0].clientY - ty0;
      const isScrollToFooter = (cur === N - 1 && dy < 0);
      const isScrollFromFooter = (window.scrollY > 5 && dy > 0);

      if (isScrollToFooter || isScrollFromFooter) return;
      e.preventDefault(); 
    }

    function tEnd(e) {
      if (document.querySelector('.hud-modal-overlay')) return;
      const dy = e.changedTouches[0].clientY - ty0;
      const isScrollToFooter = (cur === N - 1 && dy < 0);
      const isScrollFromFooter = (window.scrollY > 5 && dy > 0);
      
      if (isScrollToFooter || isScrollFromFooter) return;

      if (Math.abs(dy) > 40) {
        const dir = dy < 0 ? 1 : -1;
        if (cur + dir >= N || cur + dir < 0) return;
        window.hudNavigate(dir);
      }
    }
    
    container.addEventListener('touchstart', tStart, { passive: true });
    container.addEventListener('touchmove', tMove, { passive: false });
    container.addEventListener('touchend', tEnd);

    // ── TOAST ─────────────────────────────────────────────────────────────────────
    let toastTimer;
    function showToast(msg) {
      const t = G('toast');
      if(!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }
    window.hudShowToast = showToast;
    window.hudOpenReviews = function() {
      const slug = getActivityReviewSlug(ITEMS[cur].title);
      // Navigazione SPA (niente ricarica completa): porta alla sezione
      // recensioni di Social con l'attività corrente già selezionata.
      navigateRef.current(`/social?review=${encodeURIComponent(slug)}#recensioni-attivita`);
    };

    // ── INIT ──────────────────────────────────────────────────────────────────────
    buildTracks();
    if(G('v-fill')) G('v-fill').style.height = `${(1/N)*100}%`;
    window.addEventListener('resize', buildTracks);

    // ── CLEANUP ───────────────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('resize', buildTracks);
      container.removeEventListener('wheel', wheelHandler);
      container.removeEventListener('touchstart', tStart);
      container.removeEventListener('touchend', tEnd);
      if(band2) {
        band2.removeEventListener('mouseenter', mhEnter);
        band2.removeEventListener('mouseleave', mhLeave);
      }
      cancelAnimationFrame(rAF);
      clearTimeout(toastTimer);
      delete window.hudGoTo;
      delete window.hudNavigate;
      delete window.hudToggleAdd;
      delete window.hudShowToast;
      delete window.hudOpenModal;
      delete window.hudOpenReviews;
    };
  }, []);

  useEffect(() => {
    if (modalData) {
      document.body.classList.add('hud-modal-open');
    } else {
      document.body.classList.remove('hud-modal-open');
    }
    return () => { document.body.classList.remove('hud-modal-open'); };
  }, [modalData]);

  // Arrivando dalla mappa della home ("Scopri di più") o dalla pergamena
  // ("Esplora Attività"): /prova?activity=INDEX posiziona l'HUD sull'attività
  // giusta e apre subito la scheda descrizione. Lo state fromPergamena
  // ('home' | 'prova') indica dove riportare l'utente alla chiusura.
  // Questo effetto è dichiarato dopo quello principale, quindi window.hudGoTo è già
  // pronto: agiamo in modo sincrono (niente setTimeout, così ripulendo l'URL non si
  // annulla nessun timer in sospeso).
  useEffect(() => {
    const param = searchParams.get('activity');
    if (param === null) return;

    const idx = Number(param);
    if (Number.isInteger(idx) && idx >= 0 && idx < ITEMS.length) {
      if (location.state?.fromGeo) {
        // Arrivo dalla mappa /geolocalizzati: alla chiusura ci si torna riaprendo la barra.
        returnTargetRef.current = 'geo';
        geoReturnIndexRef.current = idx;
      } else {
        returnTargetRef.current = location.state?.fromPergamena || 'map';
      }
      // La scheda deve stare sopra a tutto: se la sidebar del programma era
      // aperta (o ripristinata), va chiusa; alla chiusura della scheda si riapre.
      setProgramOpen(false);
      window.hudGoTo?.(idx);
      setModalData(ITEMS[idx]);
    }

    // Ripuliamo l'URL così un refresh non riapre la scheda.
    const next = new URLSearchParams(searchParams);
    next.delete('activity');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, location.state]);

  return (
    <>
    <div className={`prova-wrapper ${programOpen ? 'mp-open' : ''}`} ref={containerRef}>
      <div id="cur"></div>
      <div id="cur-ring"></div>
      <div id="scan-flash"></div>
      <div className="noise"></div>
      <div id="toast"></div>

      {/* Header */}
      <header className="header-hud">
        <div className="hud-rating-box" id="header-stars-box">
          <div className="hud-stars" id="header-stars">★ 4.9</div>
          <button type="button" className="hud-reviews-btn" onClick={() => window.hudOpenReviews?.()}>Vedi Recensioni</button>
        </div>

        <form
          className={`activity-search ${searchFocused ? 'is-focused' : ''}`}
          onSubmit={handleSearchSubmit}
          onKeyDown={(e) => e.stopPropagation()}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSearchFocused(false);
            }
          }}
        >
          <div className="activity-search-field">
            <span className="activity-search-icon" aria-hidden="true"></span>
            <input
              className="activity-search-input"
              type="search"
              value={searchQuery}
              placeholder="Cerca attività"
              aria-label="Cerca attività"
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            {searchQuery && (
              <button
                className="activity-search-clear"
                type="button"
                aria-label="Cancella ricerca"
                onClick={() => {
                  setSearchQuery('');
                  setSearchFocused(false);
                }}
              >
                ×
              </button>
            )}
          </div>

          {searchFocused && normalizedSearch && (
            <div className="activity-search-results" role="listbox">
              {searchResults.length > 0 ? (
                searchResults.map(({ item, index }) => (
                  <button
                    key={item.title}
                    className="activity-search-result"
                    type="button"
                    role="option"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      goToActivity(index);
                    }}
                  >
                    <span className="activity-search-result-title">{item.title}</span>
                    <span className="activity-search-result-meta">{item.cat} • {item.duration}</span>
                  </button>
                ))
              ) : (
                <div className="activity-search-empty">Nessuna attività trovata</div>
              )}
            </div>
          )}
        </form>

        <div className="header-right">
          <div className="itinerary-btn" onClick={() => setProgramOpen(true)}>
            Il mio programma <span id="badge-count">{selectedItems.length}</span>
          </div>
        </div>
      </header>

      {/* Left vertical indicator */}
      <div className="v-indicator">
        <div className="v-label">Scorri</div>
        <div className="v-track"><div className="v-fill" id="v-fill"></div></div>
      </div>

      {/* 3 BANDS */}
      <div className="slots">
        {/* Band 1: IMAGE */}
        <div className="band" id="band-1">
          <div className="band-track" id="track-1"></div>
          <div className="band1-grad-top"></div>
          <div className="band1-grad"></div>
        </div>
        {/* Band 2: TITLE */}
        <div className="band" id="band-2">
          <div className="band-track" id="track-2"></div>
        </div>
        {/* Band 3: META */}
        <div className="band" id="band-3">
          <div className="band-track" id="track-3"></div>
        </div>
      </div>

      {/* Bottom nav hints */}
      <div className="nav-hint">
        <div className="hint-key"><div className="key-box">↑</div><div className="key-box">↓</div> navigare</div>
        <div className="dot-progress" id="dots"></div>
        <div className="hint-key"><div className="key-box">Space</div> aggiungi</div>
      </div>

      {/* Modal / Scheda */}
      {modalData && (
        <div
          className="hud-modal-overlay"
          onClick={closeModal}
          onWheel={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
        >
          <div className="hud-modal-content modern horizontal" onClick={e => e.stopPropagation()}>
            <button className="hud-modal-close" onClick={closeModal}>✕</button>
            
            <div className="hud-modal-left-pane" style={{ backgroundImage: `url(${modalData.img})` }}>
              <div className="hud-modal-hero-gradient"></div>
            </div>
            
            <div className="hud-modal-right-pane">
              <div className="hud-modal-header">
                <div className="hud-modal-cat">{modalData.cat}</div>
                <h3 className="hud-modal-title">{modalData.title}</h3>
                <div className="hud-modal-meta-row">
                  <span>★ {modalData.rating} ({modalData.reviews})</span>
                  <span>•</span>
                  <span>{modalData.duration}</span>
                  <span>•</span>
                  <span>{modalData.price}</span>
                </div>
              </div>
              <p className="hud-modal-desc clamped">{modalData.desc}</p>
              
              <div className="hud-modal-info-compact">
                <div className="hud-info-item">
                  <div className="hud-info-icon-box"><span className="hud-info-icon">📍</span></div>
                  <div className="hud-info-text">
                    <strong>Luogo</strong>
                    <span>{modalData.map}</span>
                  </div>
                </div>
                <div className="hud-info-item">
                  <div className="hud-info-icon-box"><span className="hud-info-icon">📞</span></div>
                  <div className="hud-info-text">
                    <strong>Contatti</strong>
                    <span>{modalData.cont}</span>
                  </div>
                </div>
                <div className="hud-info-item">
                  <div className="hud-info-icon-box"><span className="hud-info-icon">📅</span></div>
                  <div className="hud-info-text">
                    <strong>Disponibilità</strong>
                    <span>{modalData.dates}</span>
                  </div>
                </div>
              </div>

              <div className="hud-modal-actions">
                <div className="hud-modal-cta" onClick={() => {
                  // Dopo l'aggiunta si resta qui; ma se si veniva dalla pergamena
                  // della sidebar, la sidebar si riapre con la nuova attività.
                  const target = returnTargetRef.current;
                  returnTargetRef.current = null;
                  setModalData(null);
                  const idx = ITEMS.findIndex(i => i.title === modalData.title);
                  if(idx !== -1) window.hudToggleAdd(idx);
                  if (target === 'prova') setProgramOpen(true);
                }}>
                  Aggiungi al programma
                </div>

                {modalData.coords && (
                  <div className="hud-modal-nav-links">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${modalData.coords[1]},${modalData.coords[0]}`} target="_blank" rel="noreferrer" className="nav-btn google">
                      <span className="nav-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </span> Google Maps
                    </a>
                    <a href={`http://maps.apple.com/?daddr=${modalData.coords[1]},${modalData.coords[0]}`} target="_blank" rel="noreferrer" className="nav-btn apple">
                      <span className="nav-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                      </span> Apple Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Backdrop pannello "Il mio programma" */}
      {programOpen && <div className="mp-sidebar-backdrop" onClick={() => setProgramOpen(false)}></div>}

      {/* IL MIO PROGRAMMA — pannello laterale (fuori da .prova-wrapper per evitare
          il reset universale e il font serif dell'HUD: stesso design di "Esplora attività") */}
      <div className={`mp-sidebar ${programOpen ? 'open' : ''}`}>
        <div className="mp-sidebar-header">
          <button className="mp-sidebar-close" onClick={() => setProgramOpen(false)}>✕</button>
          <h3>Il tuo Programma</h3>
          <span className="mp-sidebar-count">
            {selectedItems.length} {selectedItems.length === 1 ? 'attività' : 'attività'}
          </span>
        </div>

        <div className="mp-sidebar-timeline">
          {selectedItems.length === 0 && wizardStep === false && (
            <p className="mp-sidebar-empty">
              Nessuna attività nel programma.<br />
              Aggiungi le esperienze che vuoi vivere.
            </p>
          )}

          {/* Card delle attività selezionate (nascoste quando l'itinerario è pronto) */}
          {wizardStep !== 'done' && selectedItems.map((idx) => {
            const exp = ITEMS[idx];
            if (!exp) return null;
            return (
              <div key={`mp-${idx}`} className="mp-timeline-item">
                <div className="mp-timeline-dot"></div>
                <div className="mp-timeline-card">
                  <img src={exp.img} alt={exp.title} className="mp-timeline-img" />
                  <div className="mp-timeline-info">
                    <h4>{exp.title}</h4>
                    <span>{exp.duration} • {exp.price}</span>
                  </div>
                  <button className="mp-remove-btn" onClick={() => window.hudToggleAdd(idx)}>×</button>
                </div>
              </div>
            );
          })}

          {/* IL QUIZ MAGICO — 4 domande (come in Esplora attività) */}
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
                            setWizardAnswers({
                              ...wizardAnswers,
                              period: `Dal ${formatDate(dateFrom)} al ${formatDate(dateTo)}`,
                              periodStart: formatDateOnly(dateFrom),
                              periodEnd: formatDateOnly(dateTo)
                            });
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

          {/* RISULTATO FINALE (pergamena con itinerario) */}
          {wizardStep === 'done' && (
            <div className="final-program-wrapper fade-in-up" style={{ margin: '0 -30px' }}>
              <ItineraryResult
                answers={wizardAnswers}
                isActive={true}
                selectedExperiences={selectedItems.map(idx => {
                  const it = ITEMS[idx];
                  return { title: it.title, duration: it.duration, price: it.price, image: it.img };
                })}
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
          <div className="mp-sidebar-footer">
            <button
              className="build-program-btn"
              disabled={selectedItems.length === 0}
              style={selectedItems.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              onClick={() => setWizardStep(0)}
            >
              Genera Programma ➔
            </button>
          </div>
        )}
      </div>
    </>
  );
}
