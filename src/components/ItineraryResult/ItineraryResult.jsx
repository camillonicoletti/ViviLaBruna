import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ItineraryResult.css';
import RouteMapbox from '../RouteMapbox/RouteMapbox';

const CALENDAR_YEAR_FALLBACK = 2026;
const CALENDAR_LOCATION = 'Matera, Basilicata, Italia';
const CALENDAR_TIMEZONE = 'Europe/Rome';
const ITALIAN_MONTHS = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11
};

const pad = (value) => String(value).padStart(2, '0');

const dateOnlyFromDate = (date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const parseItalianDateFromPeriod = (period = '', index = 0) => {
  const matches = [...String(period).toLowerCase().matchAll(/(\d{1,2})\s+([a-zà]+)/g)];
  const match = matches[index] || matches[0];

  if (!match) return null;

  const month = ITALIAN_MONTHS[match[2]];
  if (month === undefined) return null;

  return new Date(CALENDAR_YEAR_FALLBACK, month, Number(match[1]));
};

const addDays = (date, days) => (
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
);

const addHours = (date, hours) => (
  new Date(date.getTime() + hours * 60 * 60 * 1000)
);

const dateContains = (start, end, target) => (
  start.getTime() <= target.getTime() && target.getTime() <= end.getTime()
);

const formatGoogleAllDayDate = (date) => (
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
);

const formatIcsLocalDateTime = (date) => (
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
);

const formatIcsUtcDateTime = (date) => (
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
);

const cleanCalendarText = (value = '') => (
  String(value).replace(/[✦]/g, '').replace(/\s+/g, ' ').trim()
);

const escapeIcsText = (value = '') => (
  cleanCalendarText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
);

const slugify = (value = 'itinerario') => (
  cleanCalendarText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'itinerario'
);

const hasRainyWeather = (answers = {}) => Boolean(answers?.weather?.isRainy);

const getCalendarDateRange = (answers = {}, route) => {
  let start = parseDateOnly(answers.periodStart) || parseItalianDateFromPeriod(answers.period, 0);
  let end = parseDateOnly(answers.periodEnd) || parseItalianDateFromPeriod(answers.period, 1);

  if (!start) {
    start = route?.title === ITINERARIES.bruna.title
      ? new Date(CALENDAR_YEAR_FALLBACK, 6, 2)
      : new Date(CALENDAR_YEAR_FALLBACK, 6, 1);
  }

  if (!end || end < start) {
    end = start;
  }

  return { start, end };
};

const getScheduleBaseDate = (answers, route) => {
  const { start, end } = getCalendarDateRange(answers, route);
  const brunaDate = new Date(CALENDAR_YEAR_FALLBACK, 6, 2);

  if (route?.title === ITINERARIES.bruna.title && dateContains(start, end, brunaDate)) {
    return brunaDate;
  }

  return start;
};

const buildCalendarDetails = (route) => {
  const lines = [
    route.title,
    route.subtitle,
    '',
    route.desc,
    '',
    'Programma:'
  ];

  route.schedule?.forEach((dayData) => {
    lines.push('', dayData.day);
    dayData.events.forEach((event) => {
      lines.push(`${event.time} - ${cleanCalendarText(event.title)}: ${cleanCalendarText(event.desc)}`);
    });
  });

  return lines.join('\n');
};

const getGoogleCalendarUrl = (route, answers) => {
  const { start, end } = getCalendarDateRange(answers, route);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${route.title} - Matera da Vivere`,
    dates: `${formatGoogleAllDayDate(start)}/${formatGoogleAllDayDate(addDays(end, 1))}`,
    details: buildCalendarDetails(route),
    location: CALENDAR_LOCATION,
    ctz: CALENDAR_TIMEZONE
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const getEventDurationHours = (event) => {
  if (event.type === 'sleep') return 8;
  if (event.type === 'eat') return 1.5;
  if (event.type === 'see') return 1.5;
  if (event.type === 'drink') return 1.5;
  if (event.type === 'move') return 0.5;
  return 2;
};

// Giorni di viaggio scelti nel calendario (min 1, max 7: la durata della pergamena multi-giorno)
const getTripDaysCount = (answers = {}) => {
  const { start, end } = getCalendarDateRange(answers, null);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(7, diff));
};

// Fascia di budget scelta nel quiz ("Risparmio (0-80€)", "Lusso (150–250€)", ...)
const BUDGET_TIER_LABELS = {
  risparmio: 'Risparmio',
  comodo: 'Comodo',
  lusso: 'Lusso',
  magnifico: 'Magnifico'
};

const getBudgetTier = (answers = {}) => {
  const budget = String(answers.budget || '').toLowerCase();
  if (budget.includes('risparmio')) return 'risparmio';
  if (budget.includes('lusso')) return 'lusso';
  if (budget.includes('magnifico')) return 'magnifico';
  return 'comodo';
};

const getTimedCalendarEvents = (route, answers) => {
  const scheduleBaseDate = getScheduleBaseDate(answers, route);

  return (route.schedule || []).flatMap((dayData, dayIndex) => (
    dayData.events.map((event, eventIndex) => {
      const [hours, minutes] = event.time.split(':').map(Number);
      const midnightOffset = event.type === 'sleep' && hours === 0 ? 1 : 0;
      const start = new Date(
        scheduleBaseDate.getFullYear(),
        scheduleBaseDate.getMonth(),
        scheduleBaseDate.getDate() + dayIndex + midnightOffset,
        hours,
        minutes || 0
      );
      const end = addHours(start, getEventDurationHours(event));

      return {
        ...event,
        start,
        end,
        dayTitle: dayData.day,
        uid: `${dateOnlyFromDate(start)}-${dayIndex}-${eventIndex}-${slugify(event.title)}@materadavivere.local`
      };
    })
  ));
};

const createAppleCalendarFile = (route, answers) => {
  const now = formatIcsUtcDateTime(new Date());
  const events = getTimedCalendarEvents(route, answers);

  const eventBlocks = events.map((event) => ([
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${CALENDAR_TIMEZONE}:${formatIcsLocalDateTime(event.start)}`,
    `DTEND;TZID=${CALENDAR_TIMEZONE}:${formatIcsLocalDateTime(event.end)}`,
    `SUMMARY:${escapeIcsText(`${event.title} - Matera da Vivere`)}`,
    `LOCATION:${escapeIcsText(CALENDAR_LOCATION)}`,
    `DESCRIPTION:${escapeIcsText(`${event.dayTitle}\n${event.desc}`)}`,
    'END:VEVENT'
  ].join('\r\n')));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Matera da Vivere//Itinerario//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`Matera da Vivere - ${route.title}`)}`,
    `X-WR-TIMEZONE:${CALENDAR_TIMEZONE}`,
    ...eventBlocks,
    'END:VCALENDAR'
  ].join('\r\n');
};

const downloadAppleCalendarFile = (route, answers) => {
  const calendarFile = createAppleCalendarFile(route, answers);
  const blob = new Blob([calendarFile], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${slugify(route.title)}-matera-da-vivere.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

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
          { time: "18:30", type: "activity", expId: 1, title: "Tour dei Sassi al Tramonto", desc: "Passeggiata guidata nei rioni Sassi mentre la luce dorata accende il tufo, prima del Trionfo del Carro." },
          { time: "20:00", type: "see", title: "Il Trionfo del Carro", desc: "Il Carro in cartapesta attraversa la città illuminata, scortato dai generali e dai fedeli." },
          { time: "22:30", type: "see", title: "Lo Strazzo", desc: "Arrivo in Piazza Vittorio Veneto. La folla assalta e distrugge il Carro in pochi secondi. Pura adrenalina." },
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
          { time: "08:30", type: "activity", expId: 4, title: "Discesa nel Canyon", desc: "Trekking vertiginoso lungo il versante scosceso della Gravina partendo dal fantastico belvedere di Piazzetta Pascoli." },
          { time: "11:00", type: "activity", expId: 4, title: "Il Ponte Tibetano", desc: "Attraversamento da brivido dell'iconico ponte sospeso che collega i Sassi al selvaggio Parco della Murgia." },
          { time: "13:30", type: "eat", title: "Pranzo al Sacco Artigianale", desc: "Focaccia materana goduta all'ombra delle gigantesche Grotte dei Pipistrelli." },
          { time: "16:00", type: "see", title: "Villaggi Neolitici", desc: "Passeggiata tra i reperti trincerati e chiese rupestri remote in cima all'altopiano fiorito." },
          { time: "19:30", type: "sleep", title: "Glamping nel Parco", desc: "Notte indimenticabile in tenda di lusso o antica masseria rurale ('Masseria Fontana di Vite')." }
        ]
      }
    ]
  },
  food: {
    title: 'Sapori e Tradizioni',
    subtitle: 'Sette giorni di gusto nella Città di Pietra',
    desc: '',
    multiDay: true,
    waypoints: [
      { 0: 16.6074, 1: 40.6665, place: 'Panificio Storico, Sasso Barisano', title: 'Il Segreto del Pane IGP', desc: 'Laboratorio interattivo per imparare l\'antica arte del cornetto di pane materano.', time: '10:00' },
      { 0: 16.6101, 1: 40.6662, place: 'Ristorante tipico, centro storico',   title: 'Degustazione Crusca',      desc: 'Pranzo con Peperoni Cruschi e Strascinati in un ristorante tipico.',               time: '13:00' },
      { 0: 16.6095, 1: 40.6650, place: 'Via Bruno Buozzi / Piazza del Sedile', title: 'Botteghe Artigiane',       desc: 'Esplorazione dei negozietti in legno e ceramica.', time: '16:30' },
      { 0: 16.6108, 1: 40.6643, place: 'Enoteca dai Tosi',                    title: 'Cena Sotterranea',         desc: 'Degustazione di vini lucani e taglieri in una grotta circolare.',                time: '20:30' },
      { 0: 16.6082, 1: 40.6670, place: 'Palazzo Viceconte',                   title: 'Boutique Hotel',           desc: 'Pernottamento a Palazzo Viceconte, dimora nobiliare con terrazza privata sui Sassi.', time: '23:00' }
    ],
    schedule: [
      {
        day: 'Giorno 1 — Il Pane e il Barisano',
        tip: 'Oggi ti ho organizzato l\'arrivo perfetto: tu pensa solo a camminare e assaggiare, alle prenotazioni ci pensiamo noi. Un tocco sul telefono e il tavolo è tuo.',
        cost: { risparmio: 40, comodo: 65, lusso: 110, magnifico: 190 },
        waypoints: [
          { 0: 16.6074, 1: 40.6665, place: 'Panificio storico, Sasso Barisano', title: 'Laboratorio del Pane IGP', desc: 'Mani in pasta nel forno storico del Barisano.', time: '11:00', icon: '🥖' },
          { 0: 16.6101, 1: 40.6662, place: 'Trattoria del centro storico', title: 'Pranzo di benvenuto', desc: 'Strascinati con peperoni cruschi e pane caldo.', time: '13:30', icon: '🍽️' },
          { 0: 16.6095, 1: 40.6650, place: 'Piazza del Sedile', title: 'Botteghe artigiane', desc: 'Legno, ceramica e cartapesta dei maestri materani.', time: '16:00', icon: '🎨' },
          { 0: 16.6066, 1: 40.6663, place: 'Piazza Vittorio Veneto', title: 'Calice sotto le stelle', desc: 'Aglianico del Vulture per chiudere la prima giornata.', time: '22:00', icon: '🍷' }
        ],
        events: [
          { time: '09:30', type: 'see', title: 'Passeggiata nel Sasso Barisano', desc: 'Primo contatto con la Città di Pietra: vicoli, camini e profumo di forno appena acceso. Ti ho segnato sulla mappa il percorso più scenografico.' },
          { time: '10:45', type: 'move', mode: 'walk', title: '5 minuti a piedi', desc: 'Dal belvedere al panificio: tutto in discesa, segui i profumi.' },
          { time: '11:00', type: 'activity', expId: 3, title: 'Laboratorio del Pane IGP', desc: 'Metti le mani in pasta in un panificio storico e impara il cornetto di pane materano. Posti limitati: prenota da qui in un tocco.' },
          { time: '13:30', type: 'eat', place: 'Trattoria del Caveoso', phone: '+39 0835 310 892', title: 'Pranzo di benvenuto', desc: 'Strascinati con peperoni cruschi e pane caldo. Di\' che ti manda il Cavaliere: il tavolo vicino alla finestra è il migliore.' },
          { time: '15:00', type: 'move', mode: 'walk', title: '10 minuti a piedi verso Piazza del Sedile', desc: 'Via delle Beccherie e Via Bruno Buozzi: tutto il centro si gira a piedi, senza pensieri.' },
          { time: '16:00', type: 'see', title: 'Botteghe artigiane', desc: 'Legno, ceramica e cartapesta: entra, chiedi, fatti raccontare. Gli artigiani amano mostrare il mestiere.' },
          { time: '20:00', type: 'eat', place: 'Osteria al Casale', phone: '+39 0835 333 545', title: 'Cena tipica lucana', desc: 'Crapiata materana e caciocavallo podolico in una sala scavata nel tufo. Chiama entro le 18 e il tavolo è già apparecchiato.',
            tiers: {
              risparmio: { place: 'Panificio con cucina del Sedile', phone: '+39 0835 331 187', desc: 'Focaccia farcita, crapiata del giorno e vino della casa: si spende poco e si mangia da re.' },
              lusso: { place: 'Ristorante di Palazzo Gattini', phone: '+39 0835 334 358', desc: 'Cucina lucana elegante nelle sale nobiliari con vista Cattedrale. Chiama entro le 18: il tavolo panoramico è tuo.' },
              magnifico: { place: 'Vitantonio Lombardo — stella Michelin', phone: '+39 0835 335 475', desc: 'Il fine dining nella grotta più famosa di Matera: menu degustazione da ricordare. Prenota subito, i tavoli sono pochi.' }
            } },
          { time: '22:00', type: 'drink', place: 'Vineria del Sedile', phone: '+39 0835 331 244', title: 'Calice sotto le stelle', desc: 'Aglianico del Vulture e chiacchiere in piazzetta. Se chiami, ti tengono i posti fuori: le sedie in piazza volano.' }
        ]
      },
      {
        day: 'Giorno 2 — I Sassi al Tramonto',
        tip: 'Giornata di mercato e di luce dorata. Il tour del tramonto va prenotato al mattino: pensaci mentre fai colazione, al resto pensiamo noi.',
        cost: { risparmio: 35, comodo: 60, lusso: 105, magnifico: 175 },
        waypoints: [
          { 0: 16.6113, 1: 40.6634, place: 'Sasso Caveoso', title: 'Casa Grotta', desc: 'La vita contadina dentro una grotta arredata d\'epoca.', time: '09:00', icon: '🏠' },
          { 0: 16.6055, 1: 40.6668, place: 'Piazza Ascanio Persio', title: 'Mercato cittadino', desc: 'Cruschi, ortaggi e panzerotti al volo.', time: '11:00', icon: '🍅' },
          { 0: 16.6066, 1: 40.6663, place: 'Piazza Vittorio Veneto', title: 'Palombaro Lungo', desc: 'La cisterna monumentale sotto la piazza.', time: '16:00', icon: '💧' },
          { 0: 16.6105, 1: 40.6647, place: 'Piazzetta Pascoli', title: 'Tramonto sui Sassi', desc: 'Il belvedere del tour serale.', time: '18:30', icon: '🌅' }
        ],
        events: [
          { time: '09:00', type: 'see', title: 'Casa Grotta del Casalnuovo', desc: 'La vita contadina di un tempo: come si viveva (e si cucinava) dentro una grotta.' },
          { time: '10:45', type: 'move', mode: 'walk', title: '15 minuti a piedi verso il mercato', desc: 'Risalita dolce verso il Piano: prenditela comoda, i vicoli fanno parte del viaggio.' },
          { time: '11:00', type: 'see', title: 'Mercato di Piazza Ascanio Persio', desc: 'Frutta, ortaggi e peperoni cruschi: la spesa come la fanno i materani. Assaggia prima di comprare, qui è normale.' },
          { time: '13:00', type: 'eat', title: 'Pranzo al mercato', desc: 'Panzerotti fritti e focaccia farciti al momento, da mangiare in piedi tra i banchi. Zero prenotazioni, pura vita di piazza.' },
          { time: '16:00', type: 'see', title: 'Palombaro Lungo', desc: 'La cattedrale dell\'acqua sotto Piazza Vittorio Veneto. Gli ingressi sono contingentati: ti conviene il biglietto delle 16.' },
          { time: '18:00', type: 'move', mode: 'walk', title: '8 minuti a piedi al punto di ritrovo', desc: 'Da Piazza Vittorio Veneto a Piazzetta Pascoli lungo Via Ridola, tra palazzi nobiliari e vetrine.' },
          { time: '18:30', type: 'activity', expId: 1, title: 'Tour dei Sassi al Tramonto', desc: 'Guida locale e luce dorata sul tufo: il momento più fotogenico della giornata. Prenota entro pranzo, i gruppi sono piccoli.' },
          { time: '21:00', type: 'eat', place: 'Terrazza sulla Gravina', phone: '+39 0835 312 460', title: 'Cena con vista', desc: 'Orecchiette al ragù lucano su una terrazza affacciata sul canyon. Chiama e chiedi il tavolo d\'angolo: il tramonto fa il resto.',
            tiers: {
              risparmio: { place: 'Friggitoria del Caveoso', phone: '+39 0835 312 023', desc: 'Cartoccio di panzerotti e birra fredda seduti sul muretto panoramico: la vista è la stessa, il conto no.' },
              lusso: { place: 'Terrazza di Palazzo Gattini', phone: '+39 0835 334 358', desc: 'Cena à la carte sulla terrazza più alta della Civita, i Sassi illuminati sotto di te. Chiedi il tavolo sul bordo.' },
              magnifico: { place: 'Chef privato in terrazza', phone: '+39 0835 312 460', desc: 'Terrazza riservata solo per voi, chef e sommelier dedicati: chiama e il Cavaliere organizza tutto.' }
            } },
          { time: '22:30', type: 'drink', place: 'Area 8 Cocktail Bar', phone: '+39 0835 388 916', title: 'Cocktail nei Sassi', desc: 'Drink d\'autore in un locale scavato nella roccia. Un colpo di telefono e salti la fila del weekend.' }
        ]
      },
      {
        day: 'Giorno 3 — La Murgia Contadina',
        tip: 'Oggi si esce dai Sassi: navetta, altopiano e la cena più romantica del viaggio. La grotta privata va bloccata con un giorno d\'anticipo: chiamiamo?',
        cost: { risparmio: 55, comodo: 95, lusso: 150, magnifico: 240 },
        waypoints: [
          { 0: 16.6066, 1: 40.6663, place: 'Piazza Vittorio Veneto', title: 'Partenza navetta', desc: 'Il bus per Murgia Timone parte dal centro.', time: '09:00', icon: '🚌' },
          { 0: 16.6201, 1: 40.6586, place: 'Parco della Murgia', title: 'Chiese rupestri', desc: 'Altopiano, ovili e affreschi millenari.', time: '09:30', icon: '⛪' },
          { 0: 16.6186, 1: 40.6619, place: 'Murgia Timone', title: 'Belvedere "The Passion"', desc: 'La cartolina dei Sassi visti di fronte.', time: '15:30', icon: '🌄' },
          { 0: 16.6108, 1: 40.6643, place: 'Enoteca dai Tosi', title: 'Amaro della staffa', desc: 'Chiusura in grotta circolare.', time: '23:00', icon: '🍷' }
        ],
        events: [
          { time: '09:00', type: 'move', mode: 'bus', title: 'Navetta per il Parco della Murgia', desc: 'Bus dal centro a Murgia Timone: 15 minuti e sei nella natura selvaggia. Biglietti a bordo, ci pensa l\'autista.' },
          { time: '09:30', type: 'see', title: 'Chiese rupestri e villaggi neolitici', desc: 'Passeggiata dolce sull\'altopiano tra ovili, cisterne e affreschi millenari. Scarpe comode e acqua: al resto abbiamo pensato noi.' },
          { time: '13:00', type: 'eat', place: 'Masseria didattica', phone: '+39 0835 259 082', title: 'Pranzo in masseria', desc: 'Ricotta appena fatta, salumi e ortaggi di stagione. Avvisa che arrivi: la ricotta calda esce a mezzogiorno in punto.' },
          { time: '15:30', type: 'see', title: 'Belvedere di Murgia Timone', desc: 'La cartolina dei Sassi visti di fronte: il punto dove è stato girato "The Passion".' },
          { time: '17:00', type: 'move', mode: 'bus', title: 'Navetta di rientro in città', desc: 'Ritorno in centro e tempo per una doccia prima della serata speciale.' },
          { time: '20:30', type: 'activity', expId: 6, title: 'Cena Romantica in Grotta', desc: 'Menu degustazione a lume di candela in una grotta privata: la serata da ricordare. Va prenotata in anticipo: aprila e blocca il tavolo.' },
          { time: '23:00', type: 'drink', place: 'Enoteca dai Tosi', phone: '+39 0835 240 258', title: 'Amaro della staffa', desc: 'Amaro lucano e vini da meditazione in una grotta circolare scavata nel tufo. Digli che arrivi dalla cena: ti aspettano.' }
        ]
      },
      {
        day: 'Giorno 4 — Cucina Povera e Caveoso',
        tip: 'Il giorno più autentico: pasta fatta a mano, cucina povera e caffè storici. La pignata va ordinata al mattino perché cuoce ore: una telefonata e sei a posto.',
        cost: { risparmio: 30, comodo: 55, lusso: 95, magnifico: 160 },
        waypoints: [
          { 0: 16.6114, 1: 40.6631, place: 'Piazza San Pietro Caveoso', title: 'Sasso Caveoso', desc: 'Il rione più autentico dei Sassi.', time: '09:30', icon: '⛪' },
          { 0: 16.6119, 1: 40.6629, place: 'Madonna de Idris', title: 'Chiesa rupestre', desc: 'Il santuario nella roccia.', time: '10:30', icon: '🗿' },
          { 0: 16.6098, 1: 40.6645, place: 'Via Ridola', title: 'Caffè storici', desc: 'Pausa dolce sul Piano.', time: '16:00', icon: '☕' },
          { 0: 16.6090, 1: 40.6672, place: 'Sasso Barisano', title: 'Birrificio artigianale', desc: 'Birre di grano lucano per la serata.', time: '22:00', icon: '🍺' }
        ],
        events: [
          { time: '09:30', type: 'see', title: 'Sasso Caveoso e Madonna de Idris', desc: 'Il rione più autentico, con la chiesa rupestre incastonata nello sperone di roccia.' },
          { time: '11:15', type: 'move', mode: 'walk', title: '5 minuti a piedi alla bottega', desc: 'Due vicoli e sei davanti alla porta giusta: segui la mappa, non i cartelli.' },
          { time: '11:30', type: 'see', title: 'Bottega della pasta fresca', desc: 'Orecchiette e cavatelli fatti a mano da una massaia materana. Se chiedi, ti fa provare: le mani in semola sono un ricordo che resta.' },
          { time: '13:00', type: 'eat', place: 'Osteria della Pignata', phone: '+39 0835 336 262', title: 'Pranzo di cucina povera', desc: 'Fave e cicorie, pane cotto e verdure di campo. Chiama al mattino e ordina la pignata: cuoce ore, ma che ore.' },
          { time: '15:00', type: 'move', mode: 'walk', title: 'Salita verso il Piano, 15 minuti', desc: 'Passeggiata lenta con soste panoramiche: i gradini di tufo si fanno con calma.' },
          { time: '16:00', type: 'see', title: 'Caffè storici del Piano', desc: 'Pausa dolce tra Via Ridola e Piazza Vittorio Veneto: tette delle monache e caffè leccese.' },
          { time: '20:00', type: 'eat', place: 'Osteria della Pignata', phone: '+39 0835 336 262', title: 'Cena in osteria', desc: 'La pignata ordinata stamattina arriva in tavola nella terracotta. Il resto della serata si racconta da sé.',
            tiers: {
              risparmio: { desc: 'La pignata è già il piatto più onesto della città: porzione unica, vino sfuso e conto leggero. Ordinala al mattino.' },
              lusso: { place: 'Osteria con cantina in grotta', phone: '+39 0835 336 410', desc: 'La stessa pignata, servita in una cantina scavata con verticale di Aglianico abbinata dal patron.' },
              magnifico: { place: 'Tavolo dello chef contadino', phone: '+39 0835 336 410', desc: 'Cena privata nella cucina di una casa grotta: la pignata si apre davanti a voi, con racconto e brindisi finale.' }
            } },
          { time: '22:00', type: 'drink', place: 'Birrificio 79', phone: '+39 0835 312 079', title: 'Birra artigianale lucana', desc: 'Birre di grano locale e taglieri di salumi. Chiama per il tavolo grande se siete in gruppo.' }
        ]
      },
      {
        day: 'Giorno 5 — Pedalando tra le Cripte',
        tip: 'Mezza giornata in e-bike senza fatica: pedalata assistita, guida e transfer inclusi. Tu porta solo l\'appetito per l\'agriturismo.',
        cost: { risparmio: 45, comodo: 75, lusso: 125, magnifico: 200 },
        waypoints: [
          { 0: 16.6066, 1: 40.6663, place: 'Centro storico', title: 'Partenza e-bike', desc: 'Ritrovo del tour in pedalata assistita.', time: '09:00', icon: '🚲' },
          { 0: 16.5570, 1: 40.6205, place: 'Contrada Pietrapenta', title: 'Cripta del Peccato Originale', desc: 'La "Cappella Sistina rupestre".', time: '11:00', icon: '🎨' },
          { 0: 16.6082, 1: 40.6670, place: 'Belvedere Luigi Guerricchio', title: 'Riposo e terrazze', desc: 'Granita e affaccio sui Sassi.', time: '16:30', icon: '🌇' },
          { 0: 16.6101, 1: 40.6662, place: 'Centro storico', title: 'Cena di pesce ionico', desc: 'Il mare della Basilicata in tavola.', time: '20:30', icon: '🐟' }
        ],
        events: [
          { time: '09:00', type: 'activity', expId: 5, title: 'E-Bike dalla Cripta', desc: 'Mezza giornata in bici elettrica fino alla Cripta del Peccato Originale, la "Cappella Sistina rupestre". Caschi e guida inclusi: prenota e presentati.' },
          { time: '13:30', type: 'eat', place: 'Agriturismo Pietrapenta', phone: '+39 0835 307 154', title: 'Pranzo in agriturismo', desc: 'Olio EVO di maiatica e formaggi a latte crudo tra gli uliveti. Avvisa quando parti dal tour: apparecchiano all\'ombra.' },
          { time: '15:30', type: 'move', mode: 'bus', title: 'Transfer di rientro verso i Sassi', desc: 'Il rientro è incluso nel tour: pomeriggio libero, senza pensieri.' },
          { time: '16:30', type: 'see', title: 'Riposo e terrazze', desc: 'Tempo lento: un affaccio dal belvedere Luigi Guerricchio e una granita al limone.' },
          { time: '20:30', type: 'eat', place: 'Ristorante di pesce del centro', phone: '+39 0835 314 118', title: 'Cena di pesce ionico', desc: 'Crudo di Gallipoli e frittura dello Ionio: la Basilicata ha anche il mare vicino. Il pescato finisce presto: chiama nel pomeriggio.',
            tiers: {
              risparmio: { place: 'Pescheria con cucina', phone: '+39 0835 314 302', desc: 'Frittura al cartoccio e polpo alla brace al banco della pescheria: fresco, veloce, economico.' },
              lusso: { place: 'Ristorante di pesce con cantina', phone: '+39 0835 314 118', desc: 'Crudo di Gallipoli, spaghetti ai ricci e bollicine: chiedi il tavolo nella sala in tufo.' },
              magnifico: { place: 'Degustazione dello chef', phone: '+39 0835 314 118', desc: 'Menu mare a mano libera dello chef con abbinamento vini: di\' solo cosa non mangi, al resto pensa lui.' }
            } },
          { time: '22:30', type: 'drink', place: 'Malto Vino e Cucina', phone: '+39 0835 334 461', title: 'Vini naturali', desc: 'Etichette lucane naturali raccontate dal sommelier, tra botti e volte in tufo. Digli cosa hai mangiato: abbina lui.' }
        ]
      },
      {
        day: 'Giorno 6 — Dolci, Musei e Vicinato',
        tip: 'Penultimo giorno: musei, pasticceria e il pranzo nel vicinato, che va prenotato perché si cucina per te. Una chiamata oggi vale doppio.',
        cost: { risparmio: 35, comodo: 65, lusso: 115, magnifico: 210 },
        waypoints: [
          { 0: 16.6098, 1: 40.6645, place: 'Via Ridola', title: 'Museo Ridola', desc: 'Dai corredi neolitici a Carlo Levi.', time: '09:30', icon: '🏛️' },
          { 0: 16.6102, 1: 40.6640, place: 'Palazzo Lanfranchi', title: 'Pinacoteca', desc: 'I contadini dipinti da Carlo Levi.', time: '10:30', icon: '🖼️' },
          { 0: 16.6105, 1: 40.6647, place: 'Piazzetta Pascoli', title: 'Sosta fotografica', desc: 'L\'affaccio più amato del Piano.', time: '15:30', icon: '📷' },
          { 0: 16.6075, 1: 40.6660, place: 'Via del Corso', title: 'Bottega del crusco', desc: 'Scorte di cruschi e vincotto da portare a casa.', time: '17:00', icon: '🌶️' }
        ],
        events: [
          { time: '09:30', type: 'see', title: 'Museo Ridola e Palazzo Lanfranchi', desc: 'La storia della città, dai corredi neolitici ai contadini dipinti da Carlo Levi.' },
          { time: '11:15', type: 'move', mode: 'walk', title: '5 minuti a piedi in pasticceria', desc: 'Via Ridola, poi il profumo di mandorla ti guida da solo.' },
          { time: '11:30', type: 'see', title: 'Pasticceria storica', desc: 'Lezione golosa: strazzate alle mandorle e biscotti al vincotto di fichi. Ordina un vassoio da viaggio: te lo incartano per domani.' },
          { time: '13:00', type: 'eat', place: 'Casa grotta del vicinato', phone: '+39 0835 319 708', title: 'Pranzo nel vicinato', desc: 'Pranzo conviviale in una casa grotta: si mangia tutti allo stesso tavolo, come una volta. Va prenotato: cucinano apposta per te.' },
          { time: '15:30', type: 'move', mode: 'walk', title: 'Passeggiata digestiva nel Caveoso', desc: 'Anello lento con sosta fotografica a Piazzetta Pascoli: la luce del pomeriggio è la migliore.' },
          { time: '17:00', type: 'see', title: 'Bottega del peperone crusco', desc: 'Scorta di cruschi, pasta di Matera e vincotto da portare a casa. Spediscono anche: chiedi in cassa e viaggi leggero.' },
          { time: '20:30', type: 'eat', place: 'Ristorante gourmet del Piano', phone: '+39 0835 335 201', title: 'Cena gourmet', desc: 'La tradizione rivisitata: cucina d\'autore lucana per la penultima sera. Il menu degustazione va avvisato: chiama entro le 17.',
            tiers: {
              risparmio: { place: 'Trattoria storica del Piano', phone: '+39 0835 335 088', desc: 'Cucina della nonna a prezzo giusto: cavatelli, polpette di pane e dolce della casa offerto.' },
              lusso: { desc: 'Menu degustazione in sette portate con i grandi classici lucani rivisitati. Avvisa entro le 17 e lascia fare alla cucina.' },
              magnifico: { place: 'Tavolo dello chef — cucina a vista', phone: '+39 0835 335 201', desc: 'Il tavolo dentro la cucina: ogni portata raccontata dallo chef, vini rari dalla cantina in grotta.' }
            } },
          { time: '22:30', type: 'drink', place: 'Charlie Chaplin Pub', phone: '+39 0835 256 918', title: 'Serata nel Barisano', desc: 'Musica dal vivo e atmosfera calda per brindare al viaggio quasi concluso.' }
        ]
      },
      {
        day: 'Giorno 7 — L\'Arrivederci',
        tip: 'Ultimo giorno senza corse: colazione lenta, ultimi vicoli e un pranzo d\'addio già organizzato. Ci rivediamo per la Festa della Bruna.',
        cost: { risparmio: 20, comodo: 35, lusso: 60, magnifico: 100 },
        waypoints: [
          { 0: 16.6082, 1: 40.6670, place: 'Terrazza sui Sassi', title: 'Colazione lenta', desc: 'Cornetto alla ricotta con vista.', time: '09:00', icon: '☕' },
          { 0: 16.6112, 1: 40.6667, place: 'Cattedrale di Matera', title: 'Ultimi vicoli', desc: 'Il saluto alla Civita e alle campane.', time: '10:30', icon: '⛪' },
          { 0: 16.6101, 1: 40.6662, place: 'Centro storico', title: 'Pranzo dell\'arrivederci', desc: 'Cavatelli con cime di rapa prima di partire.', time: '13:00', icon: '🍽️' }
        ],
        events: [
          { time: '09:00', type: 'eat', place: 'Terrazza del boutique hotel', phone: '+39 0835 330 699', title: 'Colazione lenta', desc: 'Cornetto alla crema di ricotta e caffè su una terrazza con vista sui Sassi. Chiedi il tavolo sul bordo: si prenota anche quello.' },
          { time: '10:30', type: 'see', title: 'Ultimi vicoli', desc: 'Un\'ultima passeggiata senza meta: il saluto ai camini fumanti e alle campane della Civita.' },
          { time: '12:00', type: 'move', mode: 'walk', title: 'Check-out e bagagli, 15 minuti', desc: 'Dal centro storico si raggiunge ogni parcheggio a piedi. Se hai valigie pesanti, chiama un ape-taxi: numero in reception.' },
          { time: '13:00', type: 'eat', place: 'Trattoria del centro', phone: '+39 0835 332 892', title: 'Pranzo dell\'arrivederci', desc: 'Un ultimo piatto di cavatelli con cime di rapa prima di rimettersi in viaggio. Tavolo già consigliato: di\' che ti manda il Cavaliere.' },
          { time: '15:00', type: 'see', title: 'Buon viaggio, Cavaliere', desc: 'Matera non si visita, si vive: la Città di Pietra ti aspetta per la Festa della Bruna.' }
        ]
      }
    ]
  },
  rain: {
    title: 'Matera al Riparo',
    subtitle: 'Piano intelligente per pioggia e vicoli bagnati',
    desc: 'Il meteo segnala pioggia su Matera: il percorso si sposta in luoghi coperti, grotte visitabili, botteghe e soste gastronomiche riparate. Restano i Sassi e la Festa, ma con meno tratti esposti e più pause al chiuso.',
    waypoints: [
      { 0: 16.6102, 1: 40.6640, title: 'Palazzo Lanfranchi', desc: 'Museo e punto coperto per iniziare dal racconto storico della città.', time: '10:00', icon: '🏛️' },
      { 0: 16.6113, 1: 40.6634, title: 'Casa Grotta nei Sassi', desc: 'Visita interna per capire la vita nelle grotte materane senza restare sotto la pioggia.', time: '11:30', icon: '🏠' },
      { 0: 16.6122, 1: 40.6657, title: 'MUSMA', desc: 'Scultura contemporanea negli ambienti ipogei di Palazzo Pomarici.', time: '15:30', icon: '🎨' },
      { 0: 16.6098, 1: 40.6660, title: 'Cena in grotta', desc: 'Chiusura lenta in un ristorante scavato nel tufo, evitando gli spostamenti più scoperti.', time: '20:00', icon: '🍽️' }
    ],
    schedule: [
      {
        day: 'Giorno 1 - Piano al Coperto',
        events: [
          { time: '10:00', type: 'see', title: 'Palazzo Lanfranchi', desc: 'Ingresso al museo e lettura storica della città, con una prima tappa completamente riparata.' },
          { time: '11:30', type: 'see', title: 'Casa Grotta nei Sassi', desc: 'Visita negli ambienti scavati nel tufo per vivere i Sassi senza lunghi tratti all’aperto.' },
          { time: '13:00', type: 'eat', title: 'Pranzo in trattoria coperta', desc: 'Crapiata, pane di Matera e peperoni cruschi in una sala interna del centro storico.' },
          { time: '15:30', type: 'see', title: 'MUSMA e ambienti ipogei', desc: 'Arte e scultura negli spazi sotterranei di Palazzo Pomarici, ideale quando piove.' },
          { time: '17:30', type: 'activity', title: 'Bottega di cartapesta', desc: 'Laboratorio breve sui simboli della Bruna, con lavorazione al chiuso e souvenir artigianale.' },
          { time: '20:00', type: 'eat', title: 'Cena in grotta', desc: 'Cena riparata in un ristorante scavato nel tufo, con spostamenti ridotti e atmosfera materana.' },
          { time: '22:00', type: 'sleep', title: 'Rientro nei Sassi', desc: 'Rientro consigliato con percorso breve e scarpe adatte ai gradini bagnati.' }
        ]
      }
    ]
  }
};

// Riferimento stabile: un default `= []` inline crea un NUOVO array ad ogni render,
// facendo scattare l'effect (dipendente da selectedExperiences) all'infinito ->
// loop di render che ricrea la mappa Mapbox in continuazione (mappa che "lampeggia"
// e l'altra mappa nera per esaurimento dei contesti WebGL).
const EMPTY_EXPERIENCES = [];

// Titoli delle attività di "Esplora Attività" (/prova, menu hamburger), in ordine
// di indice HUD (0-5): l'expId 1-6 dei percorsi corrisponde all'indice expId-1.
// Servono perché su /attivita esistono attività con nomi quasi uguali ma diverse:
// il link della pergamena deve aprire SEMPRE la scheda di quelle del menu hamburger.
const PROVA_ACTIVITY_TITLES = [
  'Tour dei Sassi al Tramonto',
  "Volo in Mongolfiera all'Alba",
  'Laboratorio del Pane IGP',
  'Trekking Murgia Materana',
  'E-Bike dalla Cripta',
  'Cena Romantica in Grotta',
];

// Ancora di ritorno: ricorda quale attività era stata aperta dalla pergamena,
// così al rientro la pagina scrolla esattamente sulla sua card della timeline.
export const PERGAMENA_ANCHOR_KEY = 'pergamenaAnchor';

export function scrollToPergamenaAnchor() {
  let anchor = null;
  try {
    anchor = sessionStorage.getItem(PERGAMENA_ANCHOR_KEY);
    sessionStorage.removeItem(PERGAMENA_ANCHOR_KEY);
  } catch {
    return false;
  }
  if (!anchor) return false;
  const cards = document.querySelectorAll('[data-pergamena-anchor]');
  for (const el of cards) {
    if (el.dataset.pergamenaAnchor === anchor) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
  }
  return false;
}

export default function ItineraryResult({ answers, isActive, selectedExperiences = EMPTY_EXPERIENCES, hideMap = false }) {
  const navigate = useNavigate();
  const [route, setRoute] = useState(ITINERARIES.spiritual);
  const [draw, setDraw] = useState(false);
  // Giorno mostrato nella timeline dei percorsi multi-giorno (default: il primo)
  const [selectedDay, setSelectedDay] = useState(0);

  // Apre la scheda "Leggi descrizione" dell'attività giusta su /prova (Esplora
  // Attività del menu hamburger). Lo state fromPergamena dice a /prova dove
  // riportare l'utente alla chiusura: sulla pergamena da cui è partito.
  const openActivity = (evt) => {
    const title = evt.reviewTitle
      || PROVA_ACTIVITY_TITLES[evt.expId - 1]
      || String(evt.title || '').replace(/^✦\s*/, '');
    const idx = PROVA_ACTIVITY_TITLES.indexOf(title);
    if (idx === -1) return;
    // Al ritorno si scrolla direttamente sulla card di QUESTA attività
    try { sessionStorage.setItem(PERGAMENA_ANCHOR_KEY, title); } catch { /* ignora */ }
    const origin = window.location.pathname === '/prova' ? 'prova' : 'home';
    navigate(`/prova?activity=${idx}`, { state: { fromPergamena: origin } });
  };

  useEffect(() => {
    // Logic to select the route based on answers
    const period = (answers?.period || '').toLowerCase();
    const vibe = (answers?.vibe || '').toLowerCase();

    let selectedKey = 'spiritual';
    if (hasRainyWeather(answers)) {
      selectedKey = 'rain';
    } else if (vibe.includes('sapori')) {
      // La scelta "Sapori e tradizioni" ha la sua pergamena dedicata,
      // anche se le date cadono nei giorni della Festa della Bruna.
      selectedKey = 'food';
    } else if (period.includes('2 luglio') || period.includes('luglio')) {
      selectedKey = 'bruna';
    } else if (vibe.includes('avventura')) {
      selectedKey = 'adventure';
    } else if (vibe.includes('storia')) {
      selectedKey = 'spiritual';
    }
    
    // Create a copy of the base itinerary to inject our cart selections
    const baseRoute = JSON.parse(JSON.stringify(ITINERARIES[selectedKey]));

    // I percorsi multi-giorno si adattano ai giorni scelti nel calendario
    if (baseRoute.multiDay && baseRoute.schedule) {
      baseRoute.schedule = baseRoute.schedule.slice(0, getTripDaysCount(answers));
    }
    setSelectedDay(0);

    // Fascia di budget del quiz: locali e descrizioni si adattano alla fascia
    // (le varianti stanno in evt.tiers; "comodo" è il default già scritto).
    const budgetTier = getBudgetTier(answers);
    baseRoute.budgetTier = budgetTier;
    baseRoute.schedule?.forEach((dayData) => {
      dayData.events = dayData.events.map((evt) => {
        if (!evt.tiers) return evt;
        const override = evt.tiers[budgetTier];
        const { tiers: _tiers, ...cleanEvt } = evt;
        return override ? { ...cleanEvt, ...override } : cleanEvt;
      });
    });

    if (selectedExperiences.length > 0 && baseRoute.schedule && baseRoute.schedule.length > 0) {
      // Assegnamo orari verosimili sfalsati di qualche ora partendo dalle 10:30
      const injectedEvents = selectedExperiences.map((exp, index) => {
        const hour = 10 + (index * 3); // 10:30, 13:30, 16:30...
        return {
          time: `${hour.toString().padStart(2, '0')}:30`,
          type: 'activity',
          expId: exp.id,
          reviewTitle: exp.title, // titolo originale → link alle recensioni giuste
          title: `✦ ${exp.title}`, // Stellina per evidenziare quelli scelti da noi!
          desc: `Esperienza Selezionata: ${exp.duration} • Prezzo: ${exp.price}`,
          image: exp.image
        };
      });

      // Appendi ed ordina per orario la stringa 'HH:MM'
      baseRoute.schedule[0].events.push(...injectedEvents);
      baseRoute.schedule[0].events.sort((a, b) => a.time.localeCompare(b.time));
    }

    setRoute(baseRoute);
    
    // Inizia l'animazione della linea blu poco dopo il render (se attivo)
    if (isActive) {
      setTimeout(() => setDraw(true), 500);
    }
  }, [answers, isActive, selectedExperiences]);

  const googleCalendarUrl = getGoogleCalendarUrl(route, answers);
  const weather = answers?.weather;

  // Giorno attivo e mappa del giorno: nei percorsi multi-giorno ogni giorno
  // ha le sue tappe, quindi la piantina segue il giorno selezionato.
  const scheduleDays = route.schedule || [];
  const safeDay = scheduleDays.length > 0 ? Math.min(selectedDay, scheduleDays.length - 1) : 0;
  const activeDayData = scheduleDays[safeDay];
  const mapWaypoints = (route.multiDay && activeDayData?.waypoints) || route.waypoints;
  const visibleDays = route.multiDay && activeDayData ? [activeDayData] : scheduleDays;

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
        {weather?.isRainy && (
          <div className="weather-route-alert">
            <span className="weather-route-alert-icon" aria-hidden="true"></span>
            <div>
              <strong>Meteo intelligente attivo</strong>
              <p>
                {weather.conditionLabel || 'Pioggia'} a Matera
                {weather.temperature !== null && weather.temperature !== undefined ? `, ${weather.temperature}°C` : ''}: il programma è stato ricalcolato con tappe coperte.
              </p>
            </div>
          </div>
        )}

        <div className="itinerary-content" style={{ textAlign: 'left', paddingLeft: '20px', paddingRight: '20px', marginBottom: '40px' }}>
          <h3 className="route-title">{route.title}</h3>
          <h4 className="route-subtitle">{route.subtitle}</h4>
          {route.desc && <p className="route-desc">{route.desc}</p>}
        </div>

        {/* Selettore del giorno (solo percorsi multi-giorno), sopra la mappa:
            cambiando giorno cambiano sia la piantina che il programma */}
        {route.multiDay && scheduleDays.length > 1 && (
          <div className="day-tabs" role="tablist" aria-label="Scegli il giorno">
            {scheduleDays.map((dayData, dIdx) => (
              <button
                key={dIdx}
                type="button"
                role="tab"
                aria-selected={dIdx === safeDay}
                className={`day-tab ${dIdx === safeDay ? 'is-active' : ''}`}
                onClick={() => setSelectedDay(dIdx)}
              >
                Giorno {dIdx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Piantina di Matera (Ora Mapbox 3D) - Nascosta se hideMap=true */}
        {!hideMap && (
          <div className="map-container" style={{ marginBottom: '30px' }}>
            {draw && mapWaypoints && (
              <RouteMapbox waypoints={mapWaypoints} draw={draw} />
            )}
          </div>
        )}

        {/* Programma Giornaliero (Timeline) */}
        {visibleDays.length > 0 && (
          <div className="timeline-container">
            {visibleDays.map((dayData, dIdx) => (
              <div key={route.multiDay ? dayData.day : dIdx} className="timeline-day-block">
                <h3 className="timeline-day-title">{dayData.day}</h3>
                {dayData.tip && (
                  <p className="timeline-day-tip"><span aria-hidden="true">⚔️</span> {dayData.tip}</p>
                )}
                <div className="timeline-events-list">
                  {dayData.events.map((evt, eIdx) => (
                    evt.type === 'move' ? (
                      /* Spostamento: connettore compatto tra un'attività e l'altra */
                      <div key={eIdx} className="timeline-event timeline-transfer">
                        <div className="timeline-time">{evt.time}</div>
                        <div className="transfer-pill">
                          <span className="transfer-icon" aria-hidden="true">{evt.mode === 'bus' ? '🚌' : '🚶'}</span>
                          <div className="transfer-text">
                            <h5 className="transfer-title">{evt.title}</h5>
                            <p className="transfer-desc">{evt.desc}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div key={eIdx} className="timeline-event">
                      <div className="timeline-time">{evt.time}</div>
                      <div className="timeline-content">
                        {evt.type === 'eat'      && <span className="timeline-icon">🍽️</span>}
                        {evt.type === 'sleep'    && <span className="timeline-icon">🌙</span>}
                        {evt.type === 'activity' && <span className="timeline-icon">🥾</span>}
                        {evt.type === 'see'      && <span className="timeline-icon">🏛️</span>}
                        {evt.type === 'drink'    && <span className="timeline-icon">🍷</span>}
                        
                        {evt.type === 'activity' ? (
                          <div
                            className={`activity-card ${(evt.expId || evt.reviewTitle) ? 'is-linkable' : 'is-static'}`}
                            data-pergamena-anchor={evt.reviewTitle || PROVA_ACTIVITY_TITLES[evt.expId - 1] || String(evt.title || '').replace(/^✦\s*/, '')}
                            onClick={() => openActivity(evt)}
                            role={(evt.expId || evt.reviewTitle) ? 'button' : undefined}
                            tabIndex={(evt.expId || evt.reviewTitle) ? 0 : undefined}
                            onKeyDown={(e) => {
                              if ((evt.expId || evt.reviewTitle) && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                openActivity(evt);
                              }
                            }}
                          >
                            <h5 className="timeline-event-title">{evt.title}</h5>
                            <p className="timeline-event-desc">{evt.desc}</p>
                            {(evt.expId || evt.reviewTitle) && (
                              <div className="explore-cta">Esplora Attività <span>➔</span></div>
                            )}
                          </div>
                        ) : (
                          <>
                            <h5 className="timeline-event-title">{evt.title}</h5>
                            <p className="timeline-event-desc">{evt.desc}</p>
                            {evt.phone && (
                              <a
                                className="call-place-btn"
                                href={`tel:${evt.phone.replace(/\s+/g, '')}`}
                              >
                                📞 {evt.type === 'eat' ? 'Prenota un tavolo' : 'Chiama'}{evt.place ? ` — ${evt.place}` : ''}
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    )
                  ))}
                </div>
                {dayData.cost && (
                  <div className="day-budget">
                    <span className="day-budget-icon" aria-hidden="true">💰</span>
                    <p className="day-budget-text">
                      Oggi spenderai circa <strong>{dayData.cost[route.budgetTier] || dayData.cost.comodo}€ a persona</strong>
                      <span className="day-budget-tier"> · fascia {BUDGET_TIER_LABELS[route.budgetTier] || 'Comodo'}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="parchment-footer" style={{ marginTop: '20px', position: 'relative' }}>
          <button className="download-btn">Scarica Programma in PDF</button>
          <a
            className="calendar-btn calendar-btn-google"
            href={googleCalendarUrl}
            target="_blank"
            rel="noreferrer"
          >
            Aggiungi a Google Calendar
          </a>
          <button
            className="calendar-btn calendar-btn-apple"
            onClick={() => downloadAppleCalendarFile(route, answers)}
          >
            Aggiungi ad Apple Calendar
          </button>
        </div>
        
      </div>
    </div>
  );
}
