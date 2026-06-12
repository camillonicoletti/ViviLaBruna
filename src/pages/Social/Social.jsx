import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Social.css';

// Frasi tradizionali della Festa della Bruna
const PRESET_QUOTES = [
  { text: "A mmoğğj a mmoğğj all'onn c vèn!", translation: "Di bene in meglio per l'anno che viene" },
  { text: "Evviva Maria! Evviva la Bruna!", translation: "Il grido di fede e devozione dei materani" },
  { text: "Il giorno più lungo di Matera.", translation: "Il 2 Luglio: fede, folklore e rinascita" },
  { text: "Il Carro è Nostro!", translation: "Il grido trionfale prima dello Strazzo" },
  { text: "Tra i Sassi brilla una luce dorata.", translation: "I Sassi vestiti a festa per la patrona" }
];

// Sticker selezionabili
const STICKERS_DATA = [
  { id: 'corona', name: 'Corona', src: '/corona.png', label: '👑 Corona Sacra' },
  { id: 'knight', name: 'Cavaliere', src: '/knight.png', label: '🐎 Cavaliere' },
  { id: 'carro', name: 'Carro', src: '/carro_dorato.png', label: '🛷 Carro Dorato' },
  { id: 'timbro', name: 'Sigillo', src: '/timbro.png', label: '⚜️ Sigillo Storico' }
];

// Template disponibili
const TEMPLATES = [
  {
    id: 'strazzo',
    name: 'Lo Strazzo (Fuoco & Notte)',
    desc: 'Un tema scuro ed energico con dettagli dorati, fiamme e l\'adrenalina dello strazzo.',
    accentColor: '#E8C96D',
    bgColor: 'linear-gradient(135deg, #080604 0%, #160f08 50%, #080604 100%)',
    textColor: '#F0E6CC',
    borderColor: '#C9A84C'
  },
  {
    id: 'cavaliere',
    name: 'Il Cavaliere (Crimisi Reale)',
    desc: 'Tema istituzionale ed elegante con sfondi rosso cremisi, cornici barocche e dettagli araldici.',
    accentColor: '#ff4d4d',
    bgColor: 'linear-gradient(135deg, #3a0808 0%, #1c0404 100%)',
    textColor: '#F0E6CC',
    borderColor: '#C9A84C'
  },
  {
    id: 'sassi',
    name: 'Tramonto nei Sassi',
    desc: 'Un layout romantico con l\'immagine crepuscolare di Matera e un taglio fotografico a Polaroid.',
    accentColor: '#E8C96D',
    bgColor: '#0d0d16',
    textColor: '#F0E6CC',
    borderColor: '#F0E6CC'
  }
];

const getActivityReviewSlug = (title) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const ACTIVITY_REVIEW_DATA = [
  {
    title: 'Tour dei Sassi al Tramonto',
    category: 'Cultura & Storia',
    image: '/hud/matera_sassi_sunset.png',
    rating: '4.9',
    totalReviews: '1.240',
    verdict: 'Il piu fotografato',
    signal: 'Top per prime visite',
    quote: 'Il tramonto sui Sassi e stato gestito con tempi perfetti. Guida precisa, scorci incredibili e ritmo mai turistico.',
    author: 'Giulia R.',
    context: 'Coppia · Maggio 2026',
    tags: ['Tramonto', 'Guida locale', 'Foto point'],
    metrics: [
      { label: 'Atmosfera', value: '9.8' },
      { label: 'Organizzazione', value: '9.6' },
      { label: 'Story-ready', value: '98%' }
    ],
    reviews: [
      { name: 'Marco V.', text: 'Percorso elegante, non troppo lungo e pieno di dettagli che da soli avremmo perso.', detail: 'Famiglia · 2 ore' },
      { name: 'Alessia P.', text: 'La luce finale dalla terrazza vale il tour. Ottimo anche per chi visita Matera per la prima volta.', detail: 'Amiche · Golden hour' },
      { name: 'Nico L.', text: 'Tutto puntuale, guida super chiara e gruppo piccolo. Esperienza molto curata.', detail: 'Solo traveller · Cultura' }
    ]
  },
  {
    title: "Volo in Mongolfiera all'Alba",
    category: 'Avventura',
    image: '/hud/matera_hot_air_balloon.png',
    rating: '5.0',
    totalReviews: '312',
    verdict: 'Esperienza wow',
    signal: 'Prenotazione anticipata consigliata',
    quote: "Silenzio totale, alba sulla Murgia e brindisi finale. E una di quelle cose che ti restano addosso.",
    author: 'Davide M.',
    context: 'Compleanno · Aprile 2026',
    tags: ['Alba', 'Panorama', 'Regalo'],
    metrics: [
      { label: 'Emozione', value: '10' },
      { label: 'Sicurezza', value: '9.9' },
      { label: 'Ricordo', value: '100%' }
    ],
    reviews: [
      { name: 'Serena T.', text: 'Equipaggio impeccabile e atmosfera quasi cinematografica. Consigliatissimo per un regalo importante.', detail: 'Coppia · Alba' },
      { name: 'Luca B.', text: 'Avevo timore dell altezza, ma e stato tutto morbido, lento e rassicurante.', detail: 'Prima volta · Avventura' },
      { name: 'Marta D.', text: 'Vista pazzesca sui Sassi. Foto bellissime senza dover forzare nulla.', detail: 'Viaggio speciale · Panorama' }
    ]
  },
  {
    title: 'Laboratorio del Pane IGP',
    category: 'Food & Drink',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1400&auto=format&fit=crop',
    rating: '4.8',
    totalReviews: '580',
    verdict: 'Piu autentico',
    signal: 'Perfetto con bambini',
    quote: 'Mani in pasta, racconti veri e profumo di forno antico. Sembra piccolo, invece ti porti via un pezzo di Matera.',
    author: 'Elena C.',
    context: 'Famiglia · Marzo 2026',
    tags: ['Tradizione', 'Degustazione', 'Forno storico'],
    metrics: [
      { label: 'Autenticita', value: '9.7' },
      { label: 'Gusto', value: '9.5' },
      { label: 'Family-fit', value: '96%' }
    ],
    reviews: [
      { name: 'Paolo F.', text: 'Esperienza concreta e calda. Il pane appena uscito dal forno e una cosa seria.', detail: 'Food lover · Mattina' },
      { name: 'Irene S.', text: 'I bambini si sono divertiti e noi abbiamo capito davvero perche il pane qui e cultura.', detail: 'Famiglia · Food' },
      { name: 'Roberto N.', text: 'Racconto semplice, ingredienti ottimi e finale goloso. Molto piu bello del previsto.', detail: 'Coppia · Degustazione' }
    ]
  },
  {
    title: 'Trekking Murgia Materana',
    category: 'Natura',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1400&auto=format&fit=crop',
    rating: '4.7',
    totalReviews: '890',
    verdict: 'Piu wild',
    signal: 'Scarpe comode obbligatorie',
    quote: 'Canyon, grotte e vento della Murgia. Faticoso il giusto, ma la vista finale ripaga ogni passo.',
    author: 'Andrea G.',
    context: 'Gruppo · Aprile 2026',
    tags: ['Outdoor', 'Canyon', 'Chiese rupestri'],
    metrics: [
      { label: 'Paesaggio', value: '9.7' },
      { label: 'Ritmo', value: '8.9' },
      { label: 'Natura', value: '97%' }
    ],
    reviews: [
      { name: 'Chiara L.', text: 'Guida attenta e percorso bellissimo. Alcuni tratti richiedono fiato, ma niente di ingestibile.', detail: 'Outdoor · Weekend' },
      { name: 'Stefano Q.', text: 'Il ponte e le chiese rupestri danno al trekking una dimensione molto materana.', detail: 'Amici · Natura' },
      { name: 'Mina A.', text: 'Consiglio acqua e cappello. Esperienza intensa, vera, molto diversa dai soliti tour.', detail: 'Solo traveller · 4 ore' }
    ]
  },
  {
    title: 'E-Bike dalla Cripta',
    category: 'Sport',
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1400&auto=format&fit=crop',
    rating: '4.9',
    totalReviews: '420',
    verdict: 'Piu dinamica',
    signal: 'Green tour consigliato',
    quote: "La bici elettrica rende tutto fluido: salite facili, campagne bellissime e arrivo alla cripta con l effetto sorpresa.",
    author: 'Francesca Z.',
    context: 'Amici · Maggio 2026',
    tags: ['E-bike', 'Panorama', 'Green'],
    metrics: [
      { label: 'Divertimento', value: '9.6' },
      { label: 'Accessibilita', value: '9.4' },
      { label: 'Green mood', value: '99%' }
    ],
    reviews: [
      { name: 'Tommaso E.', text: 'Bici in ottime condizioni e itinerario calibrato bene. Si vede tanto senza stress.', detail: 'Sport · Mezza giornata' },
      { name: 'Laura I.', text: 'Perfetta anche se non sei allenatissima. Le salite diventano parte del divertimento.', detail: 'Coppia · E-bike' },
      { name: 'Gabriele D.', text: 'La cripta alla fine chiude il giro in modo memorabile. Bella combinazione arte e sport.', detail: 'Amici · Cultura' }
    ]
  },
  {
    title: 'Cena Romantica in Grotta',
    category: 'Exclusive',
    image: '/hud/matera_romantic_dinner.png',
    rating: '4.9',
    totalReviews: '215',
    verdict: 'Piu elegante',
    signal: 'Da prenotare per tempo',
    quote: 'Luce bassa, tufo, servizio discreto e piatti curati. Sembra una scena privata dentro Matera.',
    author: 'Martina S.',
    context: 'Anniversario · Febbraio 2026',
    tags: ['Grotta', 'Cena', 'Occasione speciale'],
    metrics: [
      { label: 'Atmosfera', value: '9.9' },
      { label: 'Servizio', value: '9.6' },
      { label: 'Romance', value: '100%' }
    ],
    reviews: [
      { name: 'Claudio H.', text: 'Location bellissima senza essere pacchiana. Menu degustazione equilibrato.', detail: 'Coppia · Sera' },
      { name: 'Federica O.', text: 'Perfetta per chiudere una giornata nei Sassi. Silenziosa, intima, molto curata.', detail: 'Anniversario · Exclusive' },
      { name: 'Nadia B.', text: 'Servizio gentile e tempi rilassati. Il contesto nella grotta fa davvero la differenza.', detail: 'Cena speciale · Food' }
    ]
  }
];

export default function Social() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [template, setTemplate] = useState('strazzo');
  const [customText, setCustomText] = useState("A mmoğğj a mmoğğj all'onn c vèn!");
  const [authorName, setAuthorName] = useState('');
  
  // Foto utente e regolazioni
  const [userPhoto, setUserPhoto] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1.0);
  const [photoX, setPhotoX] = useState(0);
  const [photoY, setPhotoY] = useState(0);
  const [photoRotate, setPhotoRotate] = useState(0);
  
  // Sticker attivi (nessuno preselezionato)
  const [activeStickers, setActiveStickers] = useState([]);
  const [selectedReviewActivity, setSelectedReviewActivity] = useState(0);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);

  // Stati ausiliari
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  const fileInputRef = useRef(null);
  const previewCardRef = useRef(null);
  const photoContainerRef = useRef(null);

  // Forza lo scroll in cima alla pagina all'avvio,
  // MA non quando si arriva qui per vedere le recensioni (tasto "Vedi Recensioni")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsReviews = params.get('review') || window.location.hash === '#recensioni-attivita';
    if (!wantsReviews) {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reviewSlug = params.get('review');
    const shouldScrollToReviews = location.hash === '#recensioni-attivita';

    if (reviewSlug) {
      const reviewIndex = ACTIVITY_REVIEW_DATA.findIndex(
        (activity) => getActivityReviewSlug(activity.title) === reviewSlug
      );

      if (reviewIndex >= 0) {
        setSelectedReviewActivity(reviewIndex);
      }
    }

    if (reviewSlug || shouldScrollToReviews) {
      const scrollToSection = () => {
        document.getElementById('recensioni-attivita')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      };
      // Primo tentativo subito dopo il paint, secondo a layout assestato
      // (immagini/sezioni sopra possono spostare la posizione della sezione).
      window.requestAnimationFrame(scrollToSection);
      const retry = setTimeout(scrollToSection, 600);
      return () => clearTimeout(retry);
    }
  }, [location.hash, location.search]);

  useEffect(() => {
    setSelectedReviewIndex(0);
  }, [selectedReviewActivity]);

  // Gestione upload foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target.result);
        // Reset delle regolazioni al caricamento di una nuova foto
        setPhotoZoom(1.0);
        setPhotoX(0);
        setPhotoY(0);
        setPhotoRotate(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setUserPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag della foto all'interno del frame dell'anteprima
  const handleMouseDown = (e) => {
    if (!userPhoto) return;
    setDragStart({ x: e.clientX - photoX, y: e.clientY - photoY });
  };

  const handleMouseMove = (e) => {
    if (!dragStart || !userPhoto) return;
    setPhotoX(e.clientX - dragStart.x);
    setPhotoY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setDragStart(null);
  };

  // Supporto Touch per Drag Mobile
  const handleTouchStart = (e) => {
    if (!userPhoto || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - photoX, y: touch.clientY - photoY });
  };

  const handleTouchMove = (e) => {
    if (!dragStart || !userPhoto || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPhotoX(touch.clientX - dragStart.x);
    setPhotoY(touch.clientY - dragStart.y);
  };

  // Toggle Sticker
  const toggleSticker = (stickerId) => {
    if (activeStickers.includes(stickerId)) {
      setActiveStickers(activeStickers.filter(id => id !== stickerId));
    } else {
      setActiveStickers([...activeStickers, stickerId]);
    }
  };

  // Generazione ed Esportazione su Canvas (1080x1920)
  const generatePostcard = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      // Helper caricamento immagini asincrono
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Errore caricamento immagine: ${src}`));
          img.src = src;
        });
      };

      const finishCanvas = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            alert("Si è verificato un errore nella generazione dell'immagine.");
            setIsGenerating(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const isMobileShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'storia.png', { type: 'image/png' })] });

          if (isMobileShare) {
            const file = new File([blob], 'cartolina-matera-da-vivere.png', { type: 'image/png' });
            navigator.share({
              files: [file],
              title: 'Cartolina della Bruna',
              text: 'Guarda la cartolina che ho creato con Matera da Vivere! 🎆',
            })
            .catch((err) => {
              console.log("Condivisione annullata, procedo con il download diretto:", err);
              triggerDownload(url);
            });
          } else {
            triggerDownload(url);
          }

          setIsGenerating(false);
        }, 'image/png');
      };

      const wrapCanvasLines = (text, maxWidth, maxLines) => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];

        const lines = [];
        let line = '';

        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          if (ctx.measureText(testLine).width <= maxWidth || !line) {
            line = testLine;
          } else {
            lines.push(line);
            line = word;
            if (lines.length === maxLines - 1) break;
          }
        }

        if (line && lines.length < maxLines) lines.push(line);
        return lines;
      };

      if (template === 'strazzo') {
        const [brunaTemplate, brunaFrame] = await Promise.all([
          loadImage('/bruna_template.png'),
          loadImage('/bruna_template_frame.png'),
        ]);
        const templateScale = canvas.width / brunaTemplate.width;
        const templateW = brunaTemplate.width * templateScale;
        const templateH = brunaTemplate.height * templateScale;
        const templateX = (canvas.width - templateW) / 2;
        const templateY = (canvas.height - templateH) / 2;

        // 1. Draw the new 9:16 template as the base.
        ctx.drawImage(brunaTemplate, templateX, templateY, templateW, templateH);

        // Photo slot matches transparent cutout in frame (template coords: x=80, y=706, w=920, h=502)
        const photoSlot = {
          x: templateX + 80 * templateScale,
          y: templateY + 706 * templateScale,
          w: 920 * templateScale,
          h: 502 * templateScale,
        };

        if (userPhoto) {
          const img = await loadImage(userPhoto);
          const imgRatio = img.width / img.height;
          const slotRatio = photoSlot.w / photoSlot.h;
          let drawW, drawH;
          if (imgRatio > slotRatio) {
            drawH = photoSlot.h;
            drawW = drawH * imgRatio;
          } else {
            drawW = photoSlot.w;
            drawH = drawW / imgRatio;
          }

          const previewEl = previewCardRef.current;
          const previewW = previewEl ? previewEl.offsetWidth * 0.852 : 240;
          const previewH = previewEl ? previewEl.offsetHeight * 0.2615 : 180;
          const exportDragRatioX = photoSlot.w / previewW;
          const exportDragRatioY = photoSlot.h / previewH;

          ctx.save();
          ctx.beginPath();
          ctx.rect(photoSlot.x, photoSlot.y, photoSlot.w, photoSlot.h);
          ctx.clip();
          ctx.translate(
            photoSlot.x + photoSlot.w / 2 + photoX * exportDragRatioX,
            photoSlot.y + photoSlot.h / 2 + photoY * exportDragRatioY
          );
          ctx.rotate(photoRotate * Math.PI / 180);
          ctx.scale(photoZoom, photoZoom);
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }

        // 3. Draw the frame overlay on top, with the photo cutout transparent.
        ctx.drawImage(brunaFrame, templateX, templateY, templateW, templateH);

        // 4. Draw selected stickers above the frame for the Strazzo template.
        for (const stickerId of activeStickers) {
          const sticker = STICKERS_DATA.find(s => s.id === stickerId);
          if (!sticker) continue;

          try {
            const stickerImg = await loadImage(sticker.src);
            ctx.save();

            if (stickerId === 'corona') {
              ctx.translate(canvas.width / 2 + 18, 690);
              ctx.rotate(-2 * Math.PI / 180);
              ctx.drawImage(stickerImg, -70, -70, 140, 140);
            } else if (stickerId === 'timbro') {
              ctx.translate(100, 680);
              ctx.rotate(15 * Math.PI / 180);
              ctx.globalAlpha = 0.9;
              ctx.drawImage(stickerImg, -84, -84, 168, 168);
            } else if (stickerId === 'knight') {
              ctx.drawImage(stickerImg, 56, 1320, 180, 180);
            } else if (stickerId === 'carro') {
              ctx.drawImage(stickerImg, 52, 1665, 155, 112);
            }

            ctx.restore();
          } catch {
            console.warn(`Impossibile caricare sticker ${stickerId}`);
          }
        }

        // Text slot = small frame at bottom (template coords: x=90, y=1500, w=590, h=250)
        const message = customText.trim();
        if (message || authorName.trim()) {
          const textSlot = {
            x: templateX + 90 * templateScale,
            y: templateY + 1500 * templateScale,
            w: 590 * templateScale,
            h: 250 * templateScale,
          };

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#7a5c28';
          ctx.font = 'italic 34px Georgia, serif';
          const lines = wrapCanvasLines(message || 'Scrivi il tuo messaggio...', textSlot.w - 120, 3);
          const lineHeight = 42;
          const authorOffset = authorName ? 30 : 0;
          const firstY = textSlot.y + textSlot.h / 2 - 8 * templateScale - ((lines.length - 1) * lineHeight) / 2 - authorOffset;
          lines.forEach((line, idx) => {
            ctx.fillText(line, textSlot.x + textSlot.w / 2, firstY + idx * lineHeight);
          });

          if (authorName) {
            ctx.fillStyle = '#a6843e';
            ctx.font = '700 22px Century Gothic, sans-serif';
            ctx.fillText(`— ${authorName.toUpperCase()}`, textSlot.x + textSlot.w / 2, textSlot.y + textSlot.h - 45);
          }
        }

        finishCanvas();
        return;
      }

      // ── Step 1: Disegno Sfondo ──
      if (template === 'sassi') {
        try {
          const sassiBg = await loadImage('/matera_sassi_twilight.png');
          // Disegna in aspect-fill
          const scale = Math.max(canvas.width / sassiBg.width, canvas.height / sassiBg.height);
          const w = sassiBg.width * scale;
          const h = sassiBg.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          ctx.drawImage(sassiBg, x, y, w, h);
          // Overlay scuro per migliorare contrasto testo
          ctx.fillStyle = 'rgba(13, 13, 22, 0.45)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch {
          // Fallback gradiente se l'immagine fallisce
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#0d0d16');
          grad.addColorStop(1, '#2c1e13');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (template === 'cavaliere') {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#3a0808');
        grad.addColorStop(1, '#0e0202');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Strazzo
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#080604');
        grad.addColorStop(0.5, '#160f08');
        grad.addColorStop(1, '#080604');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // ── Step 2: Texture e Fregi Background ──
      if (template === 'strazzo') {
        // Disegna cerchio/bagliore dorato centrale
        const radialGrad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2 - 100, 100,
          canvas.width / 2, canvas.height / 2 - 100, 500
        );
        radialGrad.addColorStop(0, 'rgba(201, 168, 76, 0.15)');
        radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (template === 'cavaliere') {
        // Carica e disegna sigillo araldico sullo sfondo con trasparenza
        try {
          const timbroBg = await loadImage('/timbro.png');
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.drawImage(timbroBg, canvas.width / 2 - 300, canvas.height / 2 - 400, 600, 600);
          ctx.restore();
        } catch {
          console.warn('Impossibile caricare il timbro araldico di sfondo');
        }
      }

      // ── Step 3: Cornici Esterne della Storia ──
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#C9A84C';
      
      if (template === 'cavaliere') {
        // Doppia cornice classica
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#E8C96D';
        ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);
      } else if (template === 'strazzo') {
        // Cornice dorata con angoli stilizzati
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        // Ornamenti angolari
        ctx.fillStyle = '#C9A84C';
        const size = 30;
        // Top-left
        ctx.fillRect(40, 40, size, size);
        // Top-right
        ctx.fillRect(canvas.width - 40 - size, 40, size, size);
        // Bottom-left
        ctx.fillRect(40, canvas.height - 40 - size, size, size);
        // Bottom-right
        ctx.fillRect(canvas.width - 40 - size, canvas.height - 40 - size, size, size);
      } else {
        // Polaroid / Sassi
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(240, 230, 204, 0.4)';
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      }

      // ── Step 4: Disegno Foto Utente (se presente) ──
      // Definiamo il box della foto
      let frameW = 760;
      let frameH = 920;
      let frameX = canvas.width / 2 - frameW / 2;
      let frameY = canvas.height / 2 - 320;
      let scaleRatio = 1080 / 337.5; // Rapporto tra canvas (1080) e preview (337.5)

      if (userPhoto) {
        const img = await loadImage(userPhoto);
        ctx.save();
        
        // Creazione maschera di ritaglio in base al template
        ctx.beginPath();
        if (template === 'cavaliere') {
          // Rettangolo con angoli arrotondati
          const r = 50;
          ctx.moveTo(frameX + r, frameY);
          ctx.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + frameH, r);
          ctx.arcTo(frameX + frameW, frameY + frameH, frameX, frameY + frameH, r);
          ctx.arcTo(frameX, frameY + frameH, frameX, frameY, r);
          ctx.arcTo(frameX, frameY, frameX + frameW, frameY, r);
          ctx.closePath();
          ctx.clip();
        } else if (template === 'sassi') {
          // Polaroid look (leggermente ruotato)
          ctx.translate(canvas.width / 2, frameY + frameH / 2);
          ctx.rotate(3 * Math.PI / 180);
          ctx.rect(-frameW / 2, -frameH / 2, frameW, frameH);
          ctx.clip();
        } else {
          // Strazzo (rettangolo dritto, ruotato di -2 deg)
          ctx.translate(canvas.width / 2, frameY + frameH / 2);
          ctx.rotate(-2 * Math.PI / 180);
          ctx.rect(-frameW / 2, -frameH / 2, frameW, frameH);
          ctx.clip();
        }

        // Calcoliamo la posizione e trasformazione della foto
        // La foto dell'utente è posizionata rispetto al centro del contenitore
        let imgRatio = img.width / img.height;
        let drawW = frameW;
        let drawH = frameW / imgRatio;
        if (drawH < frameH) {
          drawH = frameH;
          drawW = frameH * imgRatio;
        }

        // Applichiamo le regolazioni dell'utente (zoom, pan, rotazione micrometrica)
        if (template === 'sassi' || template === 'strazzo') {
          // Se siamo già traslati/ruotati per il frame:
          ctx.translate(photoX * scaleRatio, photoY * scaleRatio);
          ctx.rotate(photoRotate * Math.PI / 180);
          ctx.scale(photoZoom, photoZoom);
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          // Cavaliere (nessuna rotazione del frame)
          ctx.translate(frameX + frameW / 2 + photoX * scaleRatio, frameY + frameH / 2 + photoY * scaleRatio);
          ctx.rotate(photoRotate * Math.PI / 180);
          ctx.scale(photoZoom, photoZoom);
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        }

        ctx.restore();

        // Disegno Cornice Sopra la Foto
        ctx.save();
        ctx.lineWidth = 14;
        
        if (template === 'cavaliere') {
          ctx.strokeStyle = '#C9A84C';
          // Disegna bordo arrotondato
          ctx.beginPath();
          const r = 50;
          ctx.moveTo(frameX + r, frameY);
          ctx.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + frameH, r);
          ctx.arcTo(frameX + frameW, frameY + frameH, frameX, frameY + frameH, r);
          ctx.arcTo(frameX, frameY + frameH, frameX, frameY, r);
          ctx.arcTo(frameX, frameY, frameX + frameW, frameY, r);
          ctx.closePath();
          ctx.stroke();
          
          // Profilo oro chiaro sottile interno
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#E8C96D';
          ctx.stroke();
        } else if (template === 'sassi') {
          // Polaroid Frame (Disegnato come cartone bianco/crema)
          ctx.translate(canvas.width / 2, frameY + frameH / 2);
          ctx.rotate(3 * Math.PI / 180);
          
          // Sfondo bianco polaroid allargato (con spazio in basso per il testo)
          ctx.fillStyle = '#F4EFEB';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 15;
          
          // Disegna il cartoncino polaroide
          const polW = frameW + 60;
          const polH = frameH + 200; // Spazio extra in basso
          ctx.fillRect(-polW / 2, -frameH / 2 - 30, polW, polH);
          
          // Ripristina l'ombra per non inficiare il resto
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Disegna bordo interno scuro attorno alla foto
          ctx.strokeStyle = '#C8B888';
          ctx.lineWidth = 4;
          ctx.strokeRect(-frameW / 2, -frameH / 2, frameW, frameH);
        } else {
          // Strazzo Frame
          ctx.translate(canvas.width / 2, frameY + frameH / 2);
          ctx.rotate(-2 * Math.PI / 180);
          ctx.strokeStyle = '#C9A84C';
          ctx.strokeRect(-frameW / 2, -frameH / 2, frameW, frameH);
          
          // Doppio bordo interno
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#080604';
          ctx.strokeRect(-frameW / 2 + 8, -frameH / 2 + 8, frameW - 16, frameH - 16);
          ctx.strokeStyle = '#E8C96D';
          ctx.strokeRect(-frameW / 2 + 12, -frameH / 2 + 12, frameW - 24, frameH - 24);
        }
        ctx.restore();
      } else {
        // Nessuna foto caricata: mostra un placeholder grafico d'effetto conforme col tema
        ctx.save();
        ctx.fillStyle = 'rgba(201, 168, 76, 0.05)';
        ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        const r = template === 'cavaliere' ? 50 : 0;
        ctx.roundRect ? ctx.roundRect(frameX, frameY, frameW, frameH, r) : ctx.rect(frameX, frameY, frameW, frameH);
        ctx.fill();
        ctx.stroke();

        // Disegna un'icona o testo elegante nel placeholder
        ctx.fillStyle = '#C9A84C';
        ctx.font = 'italic 36px Lemonde, serif, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Matera da Vivere", canvas.width / 2, frameY + frameH / 2 - 20);
        ctx.font = '24px Century Gothic, sans-serif';
        ctx.fillStyle = 'rgba(240, 230, 204, 0.6)';
        ctx.fillText("Personalizza questa storia con la tua foto", canvas.width / 2, frameY + frameH / 2 + 30);
        ctx.restore();
      }

      // ── Step 5: Adesivi / Sticker Selezionati ──
      for (const stickerId of activeStickers) {
        const sticker = STICKERS_DATA.find(s => s.id === stickerId);
        if (sticker) {
          try {
            const stickerImg = await loadImage(sticker.src);
            ctx.save();
            // Determiniamo posizioni eleganti e fisse per ciascun sticker sul canvas
            if (stickerId === 'corona') {
              // Sopra il frame della foto
              if (template === 'sassi') {
                ctx.translate(canvas.width / 2, frameY - 20);
                ctx.rotate(3 * Math.PI / 180);
                ctx.drawImage(stickerImg, -110, -80, 220, 160);
              } else if (template === 'strazzo') {
                ctx.translate(canvas.width / 2, frameY - 30);
                ctx.rotate(-2 * Math.PI / 180);
                ctx.drawImage(stickerImg, -110, -80, 220, 160);
              } else {
                ctx.drawImage(stickerImg, canvas.width / 2 - 110, frameY - 100, 220, 160);
              }
            } else if (stickerId === 'knight') {
              // In basso a sinistra
              ctx.drawImage(stickerImg, 70, canvas.height - 350, 180, 180);
            } else if (stickerId === 'carro') {
              // In basso a destra
              ctx.drawImage(stickerImg, canvas.width - 290, canvas.height - 330, 220, 140);
            } else if (stickerId === 'timbro') {
              // In alto a destra, inclinato
              ctx.translate(canvas.width - 150, 200);
              ctx.rotate(15 * Math.PI / 180);
              ctx.globalAlpha = 0.85;
              ctx.drawImage(stickerImg, -80, -80, 160, 160);
            }
            ctx.restore();
          } catch {
            console.warn(`Impossibile caricare sticker ${stickerId}`);
          }
        }
      }

      // ── Step 6: Testi Personalizzati ──
      ctx.save();
      ctx.textAlign = 'center';
      
      // A. Titolo Superiore
      if (template === 'strazzo') {
        ctx.fillStyle = '#C9A84C';
        ctx.font = '800 48px Century Gothic, sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillText("IL CARRO È NOSTRO!", canvas.width / 2, 190);
        
        ctx.fillStyle = 'rgba(240, 230, 204, 0.5)';
        ctx.font = 'italic 28px Lemonde, serif, sans-serif';
        ctx.fillText("Festa della Bruna · Matera", canvas.width / 2, 240);
      } else if (template === 'cavaliere') {
        ctx.fillStyle = '#E8C96D';
        ctx.font = '800 44px Century Gothic, sans-serif';
        ctx.letterSpacing = '10px';
        ctx.fillText("FESTA DELLA BRUNA", canvas.width / 2, 180);
        
        // Linea divisoria oro
        ctx.strokeStyle = '#C9A84C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 180, 220);
        ctx.lineTo(canvas.width / 2 + 180, 220);
        ctx.stroke();
      } else {
        // Polaroid / Sassi
        ctx.fillStyle = '#F0E6CC';
        ctx.font = 'italic 54px Lemonde, serif, sans-serif';
        ctx.fillText("Cartolina da Matera", canvas.width / 2, 190);
      }

      // B. Testo Principale (Citazione / Messaggio) in basso
      // Calcolo dell'altezza per il testo
      let textY = canvas.height - 480;
      
      if (template === 'sassi' && userPhoto) {
        // Con Polaroid e foto, disegniamo il testo personalizzato nel margine bianco in basso del Polaroid!
        ctx.restore();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.translate(canvas.width / 2, frameY + frameH / 2);
        ctx.rotate(3 * Math.PI / 180);
        
        ctx.fillStyle = '#1c1c1c';
        ctx.font = 'italic 34px Lemonde, serif, sans-serif';
        
        // Wrap del testo nel Polaroid
        const wrapPolaroidText = (text, maxW) => {
          const words = text.split(' ');
          let lines = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxW) {
              currentLine += " " + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
          return lines;
        };

        const polLines = wrapPolaroidText(customText, frameW - 40);
        let polY = frameH / 2 + 50;
        polLines.slice(0, 2).forEach((line, idx) => {
          ctx.fillText(line, 0, polY + idx * 45);
        });

        // Nome autore nel polaroid
        if (authorName) {
          ctx.font = 'bold 22px Century Gothic, sans-serif';
          ctx.fillStyle = '#6b5a30';
          ctx.fillText(`- da ${authorName}`, 0, frameH / 2 + 140);
        }
        
      } else {
        // Disegno testo classico a fondo schermo (per gli altri temi o se non c'è foto)
        ctx.fillStyle = '#F0E6CC';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.font = 'italic 44px Lemonde, serif, sans-serif';

        // Funzione per andare a capo nel testo del canvas
        const wrapText = (text, x, y, maxWidth, lineHeight) => {
          const words = text.split(' ');
          let line = '';
          let testY = y;
          let lineCount = 0;

          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, testY);
              line = words[n] + ' ';
              testY += lineHeight;
              lineCount++;
              if (lineCount >= 2) { // Massimo 3 righe per layout storia
                ctx.fillText(line, x, testY);
                return testY;
              }
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, testY);
          return testY;
        };

        const finalY = wrapText(customText, canvas.width / 2, textY, 800, 60);

        // Nome Autore/Firma
        if (authorName) {
          ctx.shadowBlur = 5;
          ctx.fillStyle = '#C9A84C';
          ctx.font = '800 24px Century Gothic, sans-serif';
          ctx.letterSpacing = '3px';
          ctx.fillText(`DA: ${authorName.toUpperCase()}`, canvas.width / 2, finalY + 70);
        }
      }

      ctx.restore();

      // ── Step 7: Branding Piè di Pagina (Matera da Vivere) ──
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#C9A84C';
      ctx.font = '800 24px Century Gothic, sans-serif';
      ctx.letterSpacing = '5px';
      ctx.textAlign = 'center';
      ctx.fillText("MATERA DA VIVERE", canvas.width / 2, canvas.height - 130);
      ctx.fillStyle = 'rgba(240, 230, 204, 0.4)';
      ctx.font = '500 20px Century Gothic, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText("#MATERADAVIVERE", canvas.width / 2, canvas.height - 90);
      ctx.restore();

      // Converti Canvas in Blob e apri download/condivisione
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Si è verificato un errore nella generazione dell'immagine.");
          setIsGenerating(false);
          return;
        }

        const url = URL.createObjectURL(blob);

        // Azione condizionale in base a cosa supporta il browser
        const isMobileShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'storia.png', { type: 'image/png' })] });

        if (isMobileShare) {
          const file = new File([blob], 'cartolina-matera-da-vivere.png', { type: 'image/png' });
          navigator.share({
            files: [file],
            title: 'Cartolina della Bruna',
            text: 'Guarda la cartolina che ho creato con Matera da Vivere! 🎆',
          })
          .catch((err) => {
            console.log("Condivisione annullata, procedo con il download diretto:", err);
            // Fallback download
            triggerDownload(url);
          });
        } else {
          // Download diretto
          triggerDownload(url);
        }
        
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      console.error(error);
      alert("Errore durante la compilazione della cartolina: " + error.message);
      setIsGenerating(false);
    }
  };

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.download = `cartolina-matera-da-vivere-${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Seleziona un template
  const handleSelectTemplate = (id) => {
    setTemplate(id);
    // Seleziona una frase tipica di default congruente se l'utente non ha scritto altro
    if (id === 'strazzo') {
      setCustomText("A mmoğğj a mmoğğj all'onn c vèn!");
    } else if (id === 'cavaliere') {
      setCustomText("Evviva Maria! Evviva la Bruna!");
    } else {
      setCustomText("Tra i Sassi brilla una luce dorata.");
    }
  };

  // Avanzamento Wizard
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Ottieni i colori del template corrente per stili inline dinamici nell'editor
  const currTemp = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
  const activeActivityReview = ACTIVITY_REVIEW_DATA[selectedReviewActivity];
  const activeReviewItems = activeActivityReview.reviews;
  const activeMobileReview = activeReviewItems[selectedReviewIndex] || activeReviewItems[0];
  const updateMobileReview = (direction) => {
    setSelectedReviewIndex((prev) => (
      (prev + direction + activeReviewItems.length) % activeReviewItems.length
    ));
  };

  return (
    <div className="social-page-container">
      {/* Sfondo di scintille/particelle dorate per ricreare atmosfera */}
      <div className="particles-overlay">
        <div className="spark spark-1"></div>
        <div className="spark spark-2"></div>
        <div className="spark spark-3"></div>
        <div className="spark spark-4"></div>
        <div className="spark spark-5"></div>
      </div>

      <div className="social-header-section">
        <h1 className="social-main-title">
          Crea la tua <br className="social-title-mobile-break" />Cartolina Social
        </h1>
        <p className="social-subtitle">Crea la tua cartolina social, scegli il tema, carica la tua foto e condividi</p>
      </div>

      <div className="editor-workspace">
        {/* COLONNA A: ANTEPRIMA LIVE (Rapporto d'aspetto 9:16) */}
        <div className="preview-column">
          <div className="phone-mockup-wrapper new-iphone-mockup">
            {/* La preview card della storia sitting inside the screen of the overlay */}
            <div 
              ref={previewCardRef}
              className={`instagram-story-preview template-${template}`}
              style={{ background: currTemp.bgColor }}
            >
              {/* Status Bar di iOS */}
              <div className="iphone-status-bar">
                <span className="iphone-status-time">9:41</span>
                <div className="iphone-status-icons">
                  <div className="iphone-icon-signal">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <svg className="iphone-icon-wifi" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-6a6 6 0 0 0-5.65-4 6 6 0 0 0 0 8A5.92 5.92 0 0 0 12 15zm0-5a11 11 0 0 0-9.9 6.22 1 1 0 1 0 1.79.88A9 9 0 0 1 12 12a9 9 0 0 1 8.11 5.1 1 1 0 1 0 1.79-.88A11 11 0 0 0 12 10z" />
                  </svg>
                  <div className="iphone-icon-battery">
                    <div className="iphone-icon-battery-level"></div>
                  </div>
                </div>
              </div>

              {/* CARTOLINA: si aggiorna live con le risposte dell'utente */}
              <div className={`cartolina-live ${template === 'strazzo' ? 'bruna-template-live' : ''}`}>
                {template === 'strazzo' ? (
                  <div className="bruna-template-stage">
                    <div className="bruna-template-bg" />
                    <div
                      ref={photoContainerRef}
                      className={`bruna-template-photo-slot ${userPhoto ? 'has-photo' : ''}`}
                      onClick={!userPhoto ? () => fileInputRef.current.click() : undefined}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleMouseUpOrLeave}
                    >
                      {userPhoto && (
                        <div
                          className="user-uploaded-image"
                          style={{
                            backgroundImage: `url(${userPhoto})`,
                            transform: `translate(${photoX}px, ${photoY}px) scale(${photoZoom}) rotate(${photoRotate}deg)`,
                            cursor: dragStart ? 'grabbing' : 'grab'
                          }}
                        />
                      )}
                    </div>
                    <div className="bruna-template-frame" />
                    {activeStickers.includes('corona') && (
                      <img src="/corona.png" alt="Corona" className="preview-sticker-corona bruna-sticker" />
                    )}
                    {activeStickers.includes('timbro') && (
                      <img src="/timbro.png" alt="Timbro" className="preview-sticker-timbro bruna-sticker" />
                    )}
                    {activeStickers.includes('knight') && (
                      <img src="/knight.png" alt="Cavaliere" className="preview-sticker-knight bruna-sticker" />
                    )}
                    {activeStickers.includes('carro') && (
                      <img src="/carro_dorato.png" alt="Carro" className="preview-sticker-carro bruna-sticker" />
                    )}
                    <div className="bruna-template-text-slot">
                      <p className="bruna-template-quote">
                        {customText || 'Scrivi il tuo messaggio...'}
                      </p>
                      {authorName ? (
                        <span className="bruna-template-firma">— {authorName}</span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Area foto (se caricata, diventa sfondo della cartolina) */}
                    {userPhoto && (
                  <div
                    ref={photoContainerRef}
                    className="cartolina-photo-bg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUpOrLeave}
                  >
                    <div
                      className="user-uploaded-image"
                      style={{
                        backgroundImage: `url(${userPhoto})`,
                        transform: `translate(${photoX}px, ${photoY}px) scale(${photoZoom}) rotate(${photoRotate}deg)`,
                        cursor: dragStart ? 'grabbing' : 'grab'
                      }}
                    />
                    <div className="cartolina-photo-overlay" />
                  </div>
                )}

                    {/* Sticker Corona */}
                    {activeStickers.includes('corona') && (
                      <img src="/corona.png" alt="Corona" className="preview-sticker-corona" />
                    )}
                    {activeStickers.includes('timbro') && (
                      <img src="/timbro.png" alt="Timbro" className="preview-sticker-timbro" />
                    )}
                    {activeStickers.includes('knight') && (
                      <img src="/knight.png" alt="Cavaliere" className="preview-sticker-knight" />
                    )}
                    {activeStickers.includes('carro') && (
                      <img src="/carro_dorato.png" alt="Carro" className="preview-sticker-carro" />
                    )}

                    {/* HEADER cartolina */}
                    <div className="cartolina-header">
                      <div className="cartolina-ornament-line" />
                      <span className="cartolina-header-label">
                        {template === 'cavaliere' ? 'MATERA · 2 LUGLIO' : 'CARTOLINA DA MATERA'}
                      </span>
                      <div className="cartolina-ornament-line" />
                    </div>

                    {/* CORPO: messaggio principale - si aggiorna live */}
                    <div className="cartolina-body">
                      {!userPhoto && (
                        <div className="cartolina-photo-placeholder" onClick={() => fileInputRef.current.click()}>
                          <span className="photo-placeholder-icon">📷</span>
                          <span className="photo-placeholder-text">Aggiungi foto</span>
                        </div>
                      )}
                      <div className="cartolina-message-wrap">
                        <p className="cartolina-quote">
                          {customText || 'Scrivi il tuo messaggio...'}
                        </p>
                        {authorName ? (
                          <span className="cartolina-firma">— {authorName}</span>
                        ) : null}
                      </div>
                    </div>

                    {/* FOOTER cartolina */}
                    <div className="cartolina-footer">
                      <div className="cartolina-ornament-line" />
                      <div className="cartolina-footer-inner">
                        <span className="preview-brand-text">Matera da Vivere</span>
                        <span className="preview-hashtag">#MATERADAVIVERE</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Immagine Mockup Overlay dell'iPhone fornito dal cliente */}
            <img src="/iphone-frame.png" alt="iPhone Frame" className="iphone-overlay-frame" />

            {/* Home indicator di iOS */}
            <div className="phone-home-indicator"></div>
          </div>
          
          {userPhoto && (
            <p className="drag-hint">
              {template === 'strazzo'
                ? "💡 Trascina la foto dentro la cornice per centrarla"
                : "💡 Trascina la foto direttamente nell'inquadratura per centrarla"}
            </p>
          )}
        </div>

        {/* COLONNA B: PANNELLO DI CONTROLLO WIZARD */}
        <div className="editor-panel-column">
          
          {/* Step indicator */}
          <div className="wizard-stepper">
            {[1, 2, 3, 4, 5].map((step) => (
              <div 
                key={step} 
                className={`step-dot-wrapper ${currentStep === step ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step)}
              >
                <div className="step-dot">{step < currentStep ? '✓' : step}</div>
                <span className="step-dot-label">
                  {step === 1 && "Tema"}
                  {step === 2 && "Testo"}
                  {step === 3 && "Foto"}
                  {step === 4 && "Sticker"}
                  {step === 5 && "Salva"}
                </span>
              </div>
            ))}
          </div>

          <div className="wizard-card-body">
            
            {/* STEP 1: SCEGLI IL TEMA */}
            {currentStep === 1 && (
              <div className="wizard-step-content fade-in">
                <h2 className="step-title">1. Scegli il Tema della Cartolina</h2>
                <p className="step-description">Seleziona una delle cornici storiche e combinazioni di colori ispirate alla tradizione materana:</p>
                
                <div className="template-selectors-list">
                  {TEMPLATES.map((t) => (
                    <div 
                      key={t.id} 
                      className={`template-option-card ${template === t.id ? 'selected' : ''}`}
                      onClick={() => handleSelectTemplate(t.id)}
                      style={{ '--border-highlight': t.accentColor }}
                    >
                      <div className="template-option-indicator">
                        <div className="inner-indicator"></div>
                      </div>
                      <div className="template-option-details">
                        <h4>{t.name}</h4>
                        <p>{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PERSONALIZZA IL TESTO */}
            {currentStep === 2 && (
              <div className="wizard-step-content fade-in">
                <h2 className="step-title">2. Inserisci il tuo Messaggio</h2>
                <p className="step-description">Personalizza la scritta centrale o seleziona una delle storiche frasi in dialetto materano:</p>
                
                <div className="input-group">
                  <label htmlFor="custom-message-input">Messaggio personalizzato</label>
                  <textarea 
                    id="custom-message-input"
                    className="custom-textarea" 
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.substring(0, 120))}
                    placeholder="Digita qualcosa di speciale sulla festa..."
                    maxLength={120}
                  />
                  <div className="char-counter">{customText.length}/120 caratteri</div>
                </div>

                <div className="input-group">
                  <label htmlFor="author-name-input">Tuo Nome / Firma</label>
                  <input 
                    id="author-name-input"
                    type="text" 
                    className="custom-input" 
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value.substring(0, 30))}
                    placeholder="Es. Maria e Giovanni"
                    maxLength={30}
                  />
                </div>

                <div className="preset-quotes-section">
                  <label>Consigliate dalla tradizione materana:</label>
                  <div className="preset-quotes-grid">
                    {PRESET_QUOTES.map((q, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        className="preset-quote-btn"
                        onClick={() => setCustomText(q.text)}
                      >
                        <span className="quote-text">{q.text}</span>
                        <span className="quote-sub">{q.translation}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: AGGIUNGI FOTO E REGOLA */}
            {currentStep === 3 && (
              <div className="wizard-step-content fade-in">
                <h2 className="step-title">3. Aggiungi una Tua Foto (Opzionale)</h2>
                <p className="step-description">Inserisci un tuo scatto per incastonarlo all&apos;interno della cornice dorata della storia:</p>

                {!userPhoto ? (
                  <div className="upload-dropzone" onClick={() => fileInputRef.current.click()}>
                    <span className="dropzone-icon">📥</span>
                    <h3>Seleziona un&apos;immagine</h3>
                    <p>Trascina un file PNG o JPG qui o sfoglia le tue foto</p>
                  </div>
                ) : (
                  <div className="photo-controls-card">
                    <div className="uploaded-photo-header">
                      <span>✓ Foto Caricata</span>
                      <button className="remove-photo-btn" onClick={removePhoto}>Rimuovi</button>
                    </div>

                    <div className="sliders-list">
                      <div className="control-slider-group">
                        <div className="slider-label-val">
                          <label htmlFor="zoom-slider">Zoom / Scala Foto</label>
                          <span>{photoZoom.toFixed(1)}x</span>
                        </div>
                        <input 
                          id="zoom-slider"
                          type="range" 
                          min="0.5" 
                          max="3.0" 
                          step="0.1" 
                          value={photoZoom} 
                          onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                          className="premium-slider"
                        />
                      </div>

                      <div className="control-slider-group">
                        <div className="slider-label-val">
                          <label htmlFor="rotate-slider">Rotazione</label>
                          <span>{photoRotate}°</span>
                        </div>
                        <input 
                          id="rotate-slider"
                          type="range" 
                          min="-180" 
                          max="180" 
                          step="1" 
                          value={photoRotate} 
                          onChange={(e) => setPhotoRotate(parseInt(e.target.value))}
                          className="premium-slider"
                        />
                      </div>

                      <div className="control-slider-group">
                        <div className="slider-label-val">
                          <label>Regola Allineamento</label>
                          <button className="reset-alignment-btn" onClick={() => { setPhotoX(0); setPhotoY(0); }}>Centra</button>
                        </div>
                        <p className="adjustment-tip">Usa il mouse o trascina col dito direttamente la foto nell&apos;anteprima a sinistra per spostarla in orizzontale/verticale.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input file nascosto */}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handlePhotoUpload} 
                />
              </div>
            )}

            {/* STEP 4: ADESIVI E STICKER */}
            {currentStep === 4 && (
              <div className="wizard-step-content fade-in">
                <h2 className="step-title">4. Applica Adesivi della Tradizione</h2>
                <p className="step-description">Seleziona quali dettagli decorativi storici includere per abbellire la tua cartolina:</p>

                <div className="stickers-selector-grid">
                  {STICKERS_DATA.map((s) => {
                    const isActive = activeStickers.includes(s.id);
                    return (
                      <div 
                        key={s.id} 
                        className={`sticker-select-card ${isActive ? 'active' : ''}`}
                        onClick={() => toggleSticker(s.id)}
                      >
                        <div className="sticker-img-preview-container">
                          <img src={s.src} alt={s.name} className="sticker-select-thumbnail" />
                        </div>
                        <span className="sticker-select-label">{s.label}</span>
                        <div className="sticker-toggle-checkbox">
                          {isActive ? "Attivo" : "Disattivo"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: CONDIVISIONE E DOWNLOAD */}
            {currentStep === 5 && (
              <div className="wizard-step-content fade-in">
                <h2 className="step-title">5. Esporta e Condividi la Storia</h2>
                <p className="step-description">Tutto è pronto! Clicca per generare la tua storia personalizzata ad alta definizione (1080x1920px):</p>

                <div className="export-options-box">
                  <button 
                    className="action-btn-primary" 
                    onClick={generatePostcard}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner"></span> Generazione in corso...
                      </>
                    ) : (
                      <>✨ Scarica & Condividi sui Social</>
                    )}
                  </button>
                  
                  <p className="share-note">
                    {navigator.share 
                      ? "💡 Sui dispositivi mobili, si aprirà direttamente il menu di condivisione di Instagram Stories, WhatsApp, Facebook o Telegram." 
                      : "💡 Su desktop, verrà avviato il download immediato dell'immagine PNG ad alta risoluzione."}
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* BOTTONI NAVIGAZIONE WIZARD */}
          <div className="wizard-navigation-buttons">
            <button 
              className="nav-wizard-btn prev-btn" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              ← Indietro
            </button>
            
            {currentStep < 5 ? (
              <button 
                className="nav-wizard-btn next-btn" 
                onClick={nextStep}
              >
                Avanti →
              </button>
            ) : (
              <button 
                className="nav-wizard-btn reset-wizard-btn"
                onClick={() => setCurrentStep(1)}
              >
                Ricomincia ↺
              </button>
            )}
          </div>

        </div>
      </div>

      <section id="recensioni-attivita" className="activity-reviews-section" aria-labelledby="activity-reviews-title">
        <div className="reviews-section-header">
          <span className="reviews-kicker">Recensioni esperienze</span>
          <div className="reviews-title-row">
            <h2 id="activity-reviews-title">
              <span className="reviews-title-desktop">Le voci di chi ha gia vissuto le attivita</span>
              <span className="reviews-title-mobile">Recensioni esperienze</span>
            </h2>
            <button
              type="button"
              className="reviews-explore-link"
              onClick={() => navigate('/prova')}
              aria-label="Apri Esplora Attivita"
            >
              <span>↗</span>
              Esplora
            </button>
          </div>
          <p>
            Seleziona una delle esperienze presenti in Esplora Attivita e leggi feedback,
            segnali utili e micro-recensioni pensate per scegliere piu in fretta.
          </p>
        </div>

        <div className="activity-review-tabs" role="tablist" aria-label="Attivita recensite">
          {ACTIVITY_REVIEW_DATA.map((activity, idx) => (
            <button
              key={activity.title}
              type="button"
              role="tab"
              aria-selected={selectedReviewActivity === idx}
              className={`activity-review-tab ${selectedReviewActivity === idx ? 'active' : ''}`}
              onClick={() => setSelectedReviewActivity(idx)}
            >
              <span className="activity-tab-index">{String(idx + 1).padStart(2, '0')}</span>
              <span className="activity-tab-copy">
                <strong>{activity.title}</strong>
                <small>{activity.category}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="reviews-showcase-grid">
          <article className="featured-review-panel">
            <div
              className="featured-review-media"
              style={{ backgroundImage: `url(${activeActivityReview.image})` }}
              aria-hidden="true"
            >
              <div className="featured-review-rating">
                <span>★</span>
                {activeActivityReview.rating}
              </div>
            </div>

            <div className="featured-review-content">
              <div className="featured-review-topline">
                <span>{activeActivityReview.category}</span>
                <strong>{activeActivityReview.totalReviews} recensioni</strong>
              </div>
              <h3>{activeActivityReview.title}</h3>
              <p className="featured-review-quote">“{activeActivityReview.quote}”</p>

              <div className="featured-review-author">
                <span>{activeActivityReview.author}</span>
                <small>{activeActivityReview.context}</small>
              </div>

              <div className="review-tag-list" aria-label="Punti forti">
                {activeActivityReview.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>

          <aside className="review-insight-panel" aria-label="Sintesi recensioni">
            <div className="review-verdict-card">
              <span className="review-verdict-label">Verdetto rapido</span>
              <strong>{activeActivityReview.verdict}</strong>
              <p>{activeActivityReview.signal}</p>
            </div>

            <div className="review-metrics-grid">
              {activeActivityReview.metrics.map((metric) => (
                <div className="review-metric" key={metric.label}>
                  <span>{metric.value}</span>
                  <small>{metric.label}</small>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="review-card-row" aria-label={`Recensioni per ${activeActivityReview.title}`}>
          {activeActivityReview.reviews.map((review) => (
            <article className="mini-review-card" key={`${activeActivityReview.title}-${review.name}`}>
              <div className="mini-review-stars" aria-label="Valutazione 5 su 5">★★★★★</div>
              <p>“{review.text}”</p>
              <div>
                <strong>{review.name}</strong>
                <span>{review.detail}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mobile-review-carousel" aria-label={`Recensioni per ${activeActivityReview.title}`}>
          <button
            type="button"
            className="mobile-review-arrow mobile-review-arrow--prev"
            onClick={() => updateMobileReview(-1)}
            aria-label="Recensione precedente"
            disabled={activeReviewItems.length <= 1}
          >
            ‹
          </button>

          <article className="mobile-review-card">
            <div className="mobile-review-card-top">
              <div className="mini-review-stars" aria-label="Valutazione 5 su 5">★★★★★</div>
              <span>{selectedReviewIndex + 1}/{activeReviewItems.length}</span>
            </div>
            <p>“{activeMobileReview.text}”</p>
            <div className="mobile-review-author">
              <strong>{activeMobileReview.name}</strong>
              <span>{activeMobileReview.detail}</span>
            </div>
          </article>

          <button
            type="button"
            className="mobile-review-arrow mobile-review-arrow--next"
            onClick={() => updateMobileReview(1)}
            aria-label="Recensione successiva"
            disabled={activeReviewItems.length <= 1}
          >
            ›
          </button>
        </div>
      </section>
    </div>
  );
}
