import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_SATELLITE_STYLE, createStreetFallbackStyle, shouldUseFallbackStyle } from '../mapStyleFallback';
import './BrunaMap.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const markersData = [
  {
    coordinates: [16.6066, 40.6663], // Piazza Vittorio Veneto, Matera
    title: "Lo Strazzo",
    place: "Piazza Vittorio Veneto",
    time: "2 Luglio, verso mezzanotte",
    type: "Evento Pubblico",
    info: "Il carro arriva nella piazza per essere distrutto."
  },
  {
    coordinates: [16.6112, 40.6667], // Basilica Cattedrale di Matera
    title: "3 Giri",
    place: "Basilica Cattedrale di Matera",
    time: "2 Luglio, verso le 23:00",
    type: "Evento Pubblico della Festa",
    info: "Il carro arriva in cattedrale dove procede a compiere tre giri attorno alla piazza."
  }
];

// Segnaposti rossi delle esperienze di "Esplora Attività" (il nuovo HUD su /prova).
// Titoli, coordinate e dati combaciano con ITEMS di Prova.jsx; `index` è la posizione
// nell'HUD così il popup apre la scheda descrizione giusta (/prova?activity=index).
const activitiesData = [
  {
    index: 0,
    coordinates: [16.6105, 40.6664],
    title: "Tour dei Sassi al Tramonto",
    category: "Cultura & Storia",
    place: "Piazza Vittorio Veneto, Matera",
    duration: "2 ore",
    price: "da 25€",
    rating: "4.9"
  },
  {
    index: 1,
    coordinates: [16.6210, 40.6720],
    title: "Volo in Mongolfiera all'Alba",
    category: "Avventura",
    place: "Contrada Murgia Timone, Matera",
    duration: "3 ore",
    price: "da 180€",
    rating: "5.0"
  },
  {
    index: 2,
    coordinates: [16.6080, 40.6675],
    title: "Laboratorio del Pane IGP",
    category: "Food & Drink",
    place: "Via Santo Stefano, Matera",
    duration: "2.5 ore",
    price: "da 45€",
    rating: "4.8"
  },
  {
    index: 3,
    coordinates: [16.6150, 40.6600],
    title: "Trekking Murgia Materana",
    category: "Natura",
    place: "Jazzo Gattini, Parco della Murgia",
    duration: "4 ore",
    price: "da 20€",
    rating: "4.7"
  },
  {
    index: 4,
    coordinates: [16.6040, 40.6650],
    title: "E-Bike dalla Cripta",
    category: "Sport",
    place: "Piazzetta Pascoli, Matera",
    duration: "½ Giornata",
    price: "da 35€",
    rating: "4.9"
  },
  {
    index: 5,
    coordinates: [16.6110, 40.6640],
    title: "Cena Romantica in Grotta",
    category: "Exclusive",
    place: "Sasso Caveoso, Matera",
    duration: "Serata intera",
    price: "da 90€",
    rating: "4.9"
  }
];

// Flag di rientro dalla schermata /mappa: chi preme "Torna indietro" deve
// riatterrare sulla mappa della home, anche se c'è una pergamena salvata.
// KnightChat lo legge (senza consumarlo) per saltare il suo scroll automatico
// all'itinerario; lo consuma BrunaMap nel suo effetto di scroll.
const RETURN_TO_MAP_KEY = 'brunaMapReturnToMap';

// Immagini dei segnaposti dorati usate SOLO nella pagina /geolocalizzati al posto
// del pin rosso. Vengono assegnate in modo casuale ai marker (stessa logica, stessa
// posizione/ancoraggio: cambia solo la grafica del pin).
const geoPinImages = [
  '/segnaposti/A086C988-29FC-40F1-90C6-AC9FED8335AE.png',
  '/segnaposti/AD982487-D4C5-4838-8DB6-4B37BA3F6883.png',
  '/segnaposti/B62D8302-CCD3-4525-AF4F-C04700851792.png',
  '/segnaposti/B708C0C1-DE01-4E58-BBC1-39FA3BDB5579.png',
  '/segnaposti/EEE90F3F-399E-417F-9165-A1017C6BFCE2.png',
  '/segnaposti/F59B54C3-4CF0-4497-9748-7191F0CC422A.png',
];
const randomGeoPin = () => geoPinImages[Math.floor(Math.random() * geoPinImages.length)];

export function readReturnToMapFlag() {
  try { return sessionStorage.getItem(RETURN_TO_MAP_KEY) === '1'; } catch { return false; }
}

export default function BrunaMap({ fullscreenPage = false, geoPage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate; // sempre aggiornato, usabile dentro l'effetto a deps vuote
  // Intento "torna alla mappa" catturato al montaggio (resta valido anche dopo aver
  // ripulito lo state dalla history). Arriva da closeModal in Prova.jsx
  // (navigate('/', { scrollToMap })) oppure dal "Torna indietro" di /mappa.
  const wantMapScrollRef = useRef(location.state?.scrollToMap === true || readReturnToMapFlag());
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const geolocateControlRef = useRef(null);
  const isManualGeolocateRef = useRef(false); // Flag anti-rimbalzo GPS
  const [is3D, setIs3D] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Pagina /geolocalizzati: elemento selezionato mostrato nella barra in basso
  const [selected, setSelected] = useState(null);
  // Pagina /geolocalizzati: box introduttivo all'ingresso
  const [showGeoIntro, setShowGeoIntro] = useState(true);
  // Barra in basso: stato "Indicazioni aperte" (mostra Apple/Google Maps al posto di
  // Indicazioni + Scopri di più) e ref per la chiusura con trascinamento della maniglia.
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const geoSheetRef = useRef(null);
  const sheetDragRef = useRef({ startY: 0, dy: 0, dragging: false });

  // Ogni volta che cambia l'elemento selezionato, ripartiamo dai pulsanti standard.
  useEffect(() => { setDirectionsOpen(false); }, [selected]);

  // Rientro dalla scheda "Scopri di più": riapriamo la barra sull'attività consultata.
  useEffect(() => {
    if (!geoPage) return;
    const idx = location.state?.reselectActivity;
    if (idx === undefined || idx === null) return;
    setShowGeoIntro(false); // si rientra sulla mappa, non rimostrare il box introduttivo
    const act = activitiesData.find((a) => a.index === idx);
    if (act) {
      setSelected({
        kind: 'activity',
        title: act.title,
        category: act.category,
        meta: `⏱ ${act.duration}  ·  ★ ${act.rating}  ·  ${act.price}`,
        place: act.place,
        index: act.index,
        coordinates: act.coordinates,
      });
    }
    // Ripuliamo lo state così un refresh non riapre la barra da solo.
    navigate(location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoPage]);

  // Chiusura della barra trascinando la maniglia verso il basso (gesto mobile).
  const onSheetDragStart = (e) => {
    sheetDragRef.current = { startY: e.clientY, dy: 0, dragging: true };
    if (geoSheetRef.current) geoSheetRef.current.style.transition = 'none';
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onSheetDragMove = (e) => {
    const drag = sheetDragRef.current;
    if (!drag.dragging) return;
    const dy = Math.max(0, e.clientY - drag.startY);
    drag.dy = dy;
    if (geoSheetRef.current) geoSheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onSheetDragEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.dragging) return;
    drag.dragging = false;
    if (drag.dy > 80) {
      setSelected(null); // oltre la soglia: chiudi la barra
      return;
    }
    // Sotto la soglia: torna su con un breve scatto morbido.
    if (geoSheetRef.current) {
      geoSheetRef.current.style.transition = 'transform 0.25s ease';
      geoSheetRef.current.style.transform = 'translateY(0)';
    }
  };

  // Fallback CSS (mobile): il wrapper diventa fixed a tutto schermo.
  // Blocca anche lo scroll del body, e forza la mappa a riadattarsi
  // sia all'ingresso che all'uscita (senza resize la canvas WebGL
  // resta della dimensione sbagliata e la mappa appare "rotta").
  const enterCssFullscreen = useCallback((wrapper) => {
    wrapper.classList.add('is-fullscreen');
    document.body.classList.add('bruna-map-fs-lock');
    setIsFullscreen(true);
    setTimeout(() => mapRef.current?.resize(), 50);
    setTimeout(() => mapRef.current?.resize(), 300);
  }, []);

  const exitCssFullscreen = useCallback((wrapper) => {
    wrapper.classList.remove('is-fullscreen');
    document.body.classList.remove('bruna-map-fs-lock');
    setIsFullscreen(false);
    setTimeout(() => mapRef.current?.resize(), 50);
    setTimeout(() => mapRef.current?.resize(), 300);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrapper = mapContainerRef.current?.closest('.bruna-map-wrapper');
    if (!wrapper) return;

    // iPhone/iPad: l'API fullscreen sugli elementi non-video non è affidabile
    // (a volte la funzione esiste ma non fa nulla). Su TUTTO il mobile l'overlay
    // CSS restava comunque intrappolato negli stacking context della pagina →
    // si apre una schermata dedicata (/mappa) con solo mappa e "Torna indietro".
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const preferMapPage = isIOS || window.matchMedia('(max-width: 768px)').matches;

    if (preferMapPage) {
      navigate('/mappa');
      return;
    }

    const nativeRequest = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen;

    if (!isFullscreen) {
      if (nativeRequest) {
        try {
          const result = nativeRequest.call(wrapper);
          if (result?.catch) {
            result.catch(() => enterCssFullscreen(wrapper));
          }
          // Se dopo un attimo il browser non è davvero in fullscreen
          // (richiesta ignorata in silenzio), ripieghiamo sul CSS.
          setTimeout(() => {
            const isNativeFs = document.fullscreenElement || document.webkitFullscreenElement;
            if (!isNativeFs && !wrapper.classList.contains('is-fullscreen')) {
              enterCssFullscreen(wrapper);
            }
          }, 350);
        } catch {
          enterCssFullscreen(wrapper);
        }
      } else {
        enterCssFullscreen(wrapper);
      }
    } else {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen?.bind(document);
        exit?.call(document);
      } else {
        exitCssFullscreen(wrapper);
      }
    }
  }, [isFullscreen, enterCssFullscreen, exitCssFullscreen, navigate]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      const wrapper = mapContainerRef.current?.closest('.bruna-map-wrapper');
      if (wrapper) {
        if (isFs) wrapper.classList.add('is-fullscreen');
        else wrapper.classList.remove('is-fullscreen');
      }
      // Forza resize della mappa
      setTimeout(() => mapRef.current?.resize(), 100);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      // Se si smonta mentre il fallback CSS è attivo, sblocca la pagina
      document.body.classList.remove('bruna-map-fs-lock');
    };
  }, []);

  // Tornando dalla scheda attività dell'HUD (chiusura → navigate('/', { scrollToMap })),
  // riportiamo la vista sulla mappa invece di restare in cima alla home.
  // Eseguito UNA volta al montaggio. Lo state viene rimosso dalla history così un refresh
  // della home non riporta più alla mappa da solo.
  useEffect(() => {
    if (!wantMapScrollRef.current) return;
    // Consuma il flag di rientro da /mappa → un reload non riattiva lo scroll.
    try { sessionStorage.removeItem(RETURN_TO_MAP_KEY); } catch { /* ignora */ }
    // Rimuove scrollToMap dalla history (replace) → un reload non riattiva lo scroll.
    navigate(location.pathname, { replace: true });

    const wrapper = mapContainerRef.current?.closest('.bruna-map-wrapper');
    if (!wrapper) return;

    // L'utente può interrompere il "pinning" appena scrolla a mano.
    let userInterrupted = false;
    const onUserScroll = () => { userInterrupted = true; };
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });

    const keepInView = (behavior) => {
      if (userInterrupted) return;
      wrapper.scrollIntoView({ behavior, block: 'center' });
    };

    // Primo arrivo fluido sulla mappa.
    keepInView('smooth');

    // La chat (KnightChat) sta SOPRA la mappa e popola i suoi messaggi ~1s dopo il
    // montaggio, allungando il contenuto e spingendo la mappa in basso → senza correzione
    // la vista "scatta verso l'alto". Ri-ancoriamo istantaneamente ad ogni cambio di
    // layout, ignorando la prima callback (dimensione iniziale) e solo per ~2.5s.
    let firstObserve = true;
    const ro = new ResizeObserver(() => {
      if (firstObserve) { firstObserve = false; return; }
      keepInView('auto');
    });
    ro.observe(document.body);

    const stop = setTimeout(() => {
      ro.disconnect();
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    }, 2500);

    return () => {
      clearTimeout(stop);
      ro.disconnect();
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagine a tutto schermo (/mappa e /geolocalizzati): blocca lo scroll
  // della pagina sotto finché la mappa è aperta.
  useEffect(() => {
    if (!fullscreenPage && !geoPage) return undefined;
    document.body.classList.add('bruna-map-fs-lock');
    return () => document.body.classList.remove('bruna-map-fs-lock');
  }, [fullscreenPage, geoPage]);

  // Esce dalla schermata mappa: torna alla pagina di provenienza
  // (o alla home se /mappa è stata aperta direttamente da un link).
  // Il flag fa riatterrare l'utente sulla mappa anche se c'è la pergamena.
  const goBack = () => {
    try { sessionStorage.setItem(RETURN_TO_MAP_KEY, '1'); } catch { /* ignora */ }
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const toggle3D = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (is3D) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1500 }); // Torna Piatto
    } else {
      map.easeTo({ pitch: 55, bearing: -17.6, duration: 1500 }); // Reclina in 3D
    }
    setIs3D(!is3D);
  };

  const triggerGeolocate = async () => {
    // 1. Controllo se i permessi sono stati definitivamente negati in passato
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          alert("⚠️ Hai in precedenza negato l'accesso alla tua posizione!\n\nPer poterti geolocalizzare ed usare la Mappa in 3D, devi riabilitarlo manualmente nell'icona del lucchetto in alto vicino l'indirizzo del sito.");
          return;
        }
      } catch (e) {
        console.warn("Permissions API locale non supportata", e);
      }
    }

    // 2. SCORRIMENTO ISTANTANEO: portiamo subito l'utente sulla mappa (feedback visivo istantaneo) 
    // ancor prima che il sensore GPS finisca di fare i suoi lenti e passivi calcoli satellitari
    const wrapper = mapContainerRef.current?.closest('.bruna-map-wrapper');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 3. Acquisiamo silenziosamente la posizione in background
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const materaLat = 40.6669;
        const materaLon = 16.6093;

        // Formula di Haversine per calcolare la distanza in km
        const R = 6371; 
        const dLat = (userLat - materaLat) * Math.PI / 180;
        const dLon = (userLon - materaLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(materaLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        if (distance > 11) {
          // Se sei troppo lontano il bottone si ferma qui in modo silenzioso (non vola, nessun avviso).
          return;
        }

        // 4. Se sei entro i 12km... inneschiamo finalmente l'effetto visivo 3D di Mapbox e il pallino blu!
        if (geolocateControlRef.current) {
          isManualGeolocateRef.current = true; // Autorizziamo lo strappo alla camera 1 sola volta
          geolocateControlRef.current.trigger();
        }
      },
      (error) => {
        // Errori GPS silenziosi: non disturbare l'utente con alert automatici.
        // Solo in caso di permesso negato, il blocco 1 in alto gestisce gia' la cosa.
        console.warn('GPS non disponibile:', error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Rendiamo la mappa solo se non esiste già l'istanza
    if (!mapContainerRef.current) return;

    // Detect if mobile to zoom out the initial view
    const isMobile = window.innerWidth <= 768;

    let usingFallbackStyle = !mapboxgl.accessToken;
    let eventMarkers = [];

    const clearEventMarkers = () => {
      eventMarkers.forEach((marker) => marker.remove());
      eventMarkers = [];
    };

    const switchToFallbackStyle = () => {
      if (usingFallbackStyle || !mapRef.current) return;
      usingFallbackStyle = true;
      clearEventMarkers();
      map.setStyle(createStreetFallbackStyle());
      setTimeout(() => mapRef.current?.resize(), 100);
    };

    const addTerrain = () => {
      if (usingFallbackStyle || !mapboxgl.accessToken || map.getSource('mapbox-dem')) return;

      try {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      } catch (err) {
        console.warn('Mapbox terrain unavailable:', err);
      }
    };

    // Su /geolocalizzati i marker non aprono il popup di Mapbox ma la barra in basso.
    const onSelect = geoPage ? setSelected : null;

    const renderEventMarkers = () => {
      clearEventMarkers();
      addTerrain();
      eventMarkers = [
        ...createEventMarkers(map, onSelect),
        ...createActivityMarkers(map, navigateRef, onSelect)
      ];
    };

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: usingFallbackStyle ? createStreetFallbackStyle() : MAPBOX_SATELLITE_STYLE, // Stile fotorealistico Standard Satellite (3D vero)
      center: [16.6093, 40.6669], // Centro di Matera
      zoom: isMobile ? 13.5 : 14.5,
      pitch: 45, // Un 3D visibile ma non troppo estremo
      bearing: -17.6,
      antialias: true // Per bordi più morbidi sui palazzi
    });

    const map = mapRef.current;

    // Aggiungi controlli (zoom/rotazione)
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    // Geolocalizzazione utente
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: false, // Rimuove la freccia direzionale dal pallino blu
      fitBoundsOptions: {
        pitch: 45, // Mantiene l'inclinazione 3D iniziale
        bearing: -17.6, // Mantiene la rotazione iniziale
        maxZoom: 16 // Zoom più ravvicinato per vedere le strade, ma non appiccicato al tetto
      }
    });
    
    geolocateControlRef.current = geolocate;
    map.addControl(geolocate, 'bottom-right');

    map.on('load', () => {
      // Forza un resize: la mappa può essere inizializzata mentre il contenitore
      // è ancora in animazione/layout, lasciando la canvas WebGL di dimensione errata.
      map.resize();
      // Attiva automaticamente la geolocalizzazione appena la mappa è caricata.
      // MA non quando si torna dalla scheda attività: il GeolocateControl prende fuoco
      // e fa scrollare la pagina da solo, "litigando" col nostro scrollIntoView (scatto).
      if (!wantMapScrollRef.current) {
        geolocate.trigger();
      }
    });

    map.on('error', (event) => {
      if (shouldUseFallbackStyle(event)) switchToFallbackStyle();
    });
    map.on('style.load', renderEventMarkers);

    // Toccando la mappa (fuori dai marker) si chiude la barra in basso.
    if (geoPage) map.on('click', () => setSelected(null));

    // Ascoltiamo i movimenti "manuali" o "gesture" dell'utente sulla mappa (trackpad o due dita su mobile)
    map.on('pitch', () => {
      // Se l'utente inclina la mappa manualmente sotto i 20 gradi la consideriamo 2D
      if (map.getPitch() < 20) {
        setIs3D(false);
      } else {
        setIs3D(true);
      }
    });

    // Se l'utente usa l'iconina minuscola sulla mappa invece del Pulsante Magico, 
    // abilitiamo il volo personalizzato!
    geolocate.on('trackuserlocationstart', () => {
      isManualGeolocateRef.current = true;
    });

    // Intercettiamo l'evento del sensore GPS per assicurarci che la camera
    // voli al punto desiderato SOLO quando viene premuto il bottone, ignorando
    // i microscopici aggiornamenti passivi del GPS ("effetto rimbalzo/elastico")
    geolocate.on('geolocate', (e) => {
      // Se è un aggiornamento passivo mentre l'utente guarda altrove, skippiamo!
      if (!isManualGeolocateRef.current) return;
      isManualGeolocateRef.current = false; // Resettiamo la sicura

      const userLat = e.coords.latitude;
      const userLon = e.coords.longitude;
      const materaLat = 40.6669;
      const materaLon = 16.6093;

      // Formula di Haversine per calcolare la distanza in km
      const R = 6371; 
      const dLat = (userLat - materaLat) * Math.PI / 180;
      const dLon = (userLon - materaLon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(materaLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      if (distance > 11) {
        // L'utente è troppo lontano! Interrompiamo il volo a Milano e torniamo a Matera in modo silenzioso
        setTimeout(() => {
          map.flyTo({
            center: [materaLon, materaLat],
            zoom: 14.5,
            pitch: 45,
            bearing: -17.6,
            essential: true
          });
        }, 100);
      } else {
        // Sei a Matera: annulliamo il comportamento predefinito del browser che
        // causa blocchi a metà strada e gestiamo noi il volo con i parametri perfetti.
        map.flyTo({
          center: [userLon, userLat],
          zoom: 15.5,
          pitch: 45,
          bearing: -17.6,
          essential: true,
          duration: 3000 // Volo fluido di 3 secondi garantito
        });
      }
    });

    // Gestione permessi negati o errori della geolocalizzazione
    geolocate.on('error', (error) => {
      // Evitiamo di mostrare un avviso immediato se l'utente clicca "Blocca" la prima volta.
      // (error.code === 1 ignorato). L'avviso uscirà se l'utente ri-clicca il bottone.
      if (error.code === 2) {
        alert("Non è stato possibile calcolare la tua posizione attuale col segnale GPS. Sei forse in galleria o in un luogo chiuso?");
      } else if (error.code !== 1) {
        console.warn("Errore geolocalizzazione mapbox: ", error);
      }
    });

    return () => {
      clearEventMarkers();
      map.remove();
      mapRef.current = null;
      geolocateControlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagina /geolocalizzati: mappa a tutto schermo (sotto la navbar, senza footer)
  // con la stessa logica della home: punti rossi, 3D, "Geolocalizzati in 3D".
  if (geoPage) {
    return (
      <main className="bruna-geo-page" aria-label="Mappa geolocalizzata a tutto schermo">
        <div ref={mapContainerRef} className="bruna-map-container" />

        {/* Tasto Home in alto */}
        <button className="bruna-geo-home-btn" onClick={() => navigate('/')} aria-label="Torna alla Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3 3 11h2v9h5v-6h4v6h5v-9h2L12 3z" />
          </svg>
        </button>

        {/* Toggle 2D/3D in alto a destra */}
        <button className={`toggle-3d-btn bruna-geo-3d-btn ${is3D ? 'active' : ''}`} onClick={toggle3D}>
          {is3D ? 'Vista 2D' : 'Vista 3D'}
        </button>

        {/* Box introduttivo in sovraimpressione all'ingresso nella pagina */}
        {showGeoIntro && (
          <div className="bruna-geo-intro-overlay" role="dialog" aria-modal="true" aria-labelledby="geo-intro-title">
            <div className="bruna-geo-intro-card">
              <button
                className="bruna-geo-intro-close"
                onClick={() => setShowGeoIntro(false)}
                aria-label="Chiudi"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
              <img className="bruna-geo-intro-icon" src="/logo geolocalizzati.png" alt="" aria-hidden="true" />
              <h2 className="bruna-geo-intro-title" id="geo-intro-title">Cosa accade attorno a te</h2>
              <p className="bruna-geo-intro-text">
                Geolocalizzati per vedere in <strong>tempo reale</strong> gli eventi
                che accadono a Matera attorno a te.
              </p>
              <button
                className="magic-geolocate-btn bruna-geo-intro-cta"
                onClick={() => { setShowGeoIntro(false); triggerGeolocate(); }}
              >
                Geolocalizzati
                <span className="btn-glow"></span>
              </button>
            </div>
          </div>
        )}

        {/* La geolocalizzazione si avvia solo dal box introduttivo: nessun CTA
            fisso sulla mappa (se l'utente chiude il box o rifiuta, resta la mappa). */}

        {/* Barra in basso con i dettagli dell'evento/attività selezionato */}
        {selected && (() => {
          const [lng, lat] = selected.coordinates;
          // Apriamo direttamente le APP native (non i siti web):
          // - Apple Maps: schema maps:// (sempre presente su iPhone)
          // - Google Maps: schema comgooglemaps:// con fallback al web se l'app non c'è.
          const openAppleMaps = () => { window.location.href = `maps://?daddr=${lat},${lng}`; };
          const openGoogleMaps = () => {
            const appUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=walking`;
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            const start = Date.now();
            window.location.href = appUrl;
            // Se l'app non si apre (siamo ancora qui dopo ~1.2s), usiamo il web.
            setTimeout(() => {
              if (!document.hidden && Date.now() - start < 1600) window.location.href = webUrl;
            }, 1200);
          };
          // Coppia di pulsanti Google Maps / Apple Maps (per gli eventi e per
          // l'attività dopo aver premuto "Indicazioni").
          const mapsButtons = (
            <>
              <button type="button" className="geo-sheet-btn google" onClick={openGoogleMaps}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                Google Maps
              </button>
              <button type="button" className="geo-sheet-btn apple" onClick={openAppleMaps}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.78.87-2.05 1.54-3.1 1.46-.13-1.1.45-2.27 1.1-3 .73-.82 2.02-1.43 3.12-1.44zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.12 3.54-1.54.01-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.02-3.05-1.78-4.04-3.35C1.5 16.45 1.18 11.13 3.92 8.5c.97-.95 2.24-1.5 3.58-1.5 1.36 0 2.22.74 3.34.74 1.09 0 1.75-.74 3.33-.74 1.19 0 2.45.65 3.35 1.77-2.94 1.61-2.46 5.81.98 7.13z" /></svg>
                Apple Maps
              </button>
            </>
          );
          const backVisible = selected.kind === 'activity' && directionsOpen;
          return (
          <div className={`geo-sheet${backVisible ? ' has-back' : ''}`} role="dialog" aria-label={selected.title} ref={geoSheetRef}>
            <span
              className="geo-sheet-handle"
              onPointerDown={onSheetDragStart}
              onPointerMove={onSheetDragMove}
              onPointerUp={onSheetDragEnd}
              onPointerCancel={onSheetDragEnd}
            />
            {/* Freccia per tornare ai pulsanti Indicazioni / Scopri di più (solo attività) */}
            {backVisible && (
              <button className="geo-sheet-back" onClick={() => setDirectionsOpen(false)} aria-label="Indietro">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5 L8 12 L15 19" />
                </svg>
              </button>
            )}
            <button className="geo-sheet-close" onClick={() => setSelected(null)} aria-label="Chiudi">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>

            <div className="geo-sheet-main">
              <span className={`geo-sheet-icon ${selected.kind}`} aria-hidden="true">
                {selected.kind === 'activity' ? '✦' : '📍'}
              </span>
              <div className="geo-sheet-info">
                <h3 className="geo-sheet-title">{selected.title}</h3>
                {selected.category && <span className="geo-sheet-cat">{selected.category}</span>}
                {selected.meta && <p className="geo-sheet-meta">{selected.meta}</p>}
                {selected.place && <p className="geo-sheet-place">📍 {selected.place}</p>}
              </div>
            </div>

            <div className="geo-sheet-actions">
              {selected.kind !== 'activity' ? (
                // Eventi (Lo Strazzo, 3 Giri): direttamente Apple Maps + Google Maps.
                mapsButtons
              ) : directionsOpen ? (
                // Attività dopo "Indicazioni": Apple Maps + Google Maps al loro posto.
                mapsButtons
              ) : (
                <>
                  <button className="geo-sheet-btn ghost" onClick={() => setDirectionsOpen(true)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2 4.5 20.3l.8.8L12 18l6.7 3.1.8-.8z" /></svg>
                    Indicazioni
                  </button>
                  <button
                    className="geo-sheet-btn primary"
                    onClick={() => navigate(`/prova?activity=${selected.index}`, { state: { fromGeo: true } })}
                  >
                    Scopri di più →
                  </button>
                </>
              )}
            </div>
          </div>
          );
        })()}
      </main>
    );
  }

  // Schermata dedicata (/mappa): solo la mappa a tutto schermo e il tasto per tornare indietro.
  if (fullscreenPage) {
    return (
      <main className="bruna-map-page" aria-label="Mappa degli eventi a tutto schermo">
        <div ref={mapContainerRef} className="bruna-map-container" />
        <button className="bruna-map-exit-fs" onClick={goBack}>
          ← Torna indietro
        </button>
      </main>
    );
  }

  return (
    <section className="bruna-map-section" aria-labelledby="bruna-map-heading">
      <div className="bruna-map-section-inner">
        <div className="bruna-map-intro">
          <h2 className="bruna-map-section-title" id="bruna-map-heading">
            <span className="sparkle">✦</span>
            <span className="bruna-map-title-copy">
              Scopri subito cosa<span className="bruna-map-mobile-break"><br /></span> <span className="bruna-map-second-line">accade attorno a te</span>
            </span>
          </h2>
          <button className="magic-geolocate-btn" onClick={triggerGeolocate}>
            Geolocalizzati in 3D
            <span className="btn-glow"></span>
          </button>
        </div>
        <div className="bruna-map-wrapper">
          <div className="bruna-map-header">
            <div className="bruna-map-title">
              <span className="sparkle">✦</span> Mappa degli Eventi
            </div>
            <div className="bruna-map-header-buttons">
              <button className={`toggle-3d-btn ${is3D ? 'active' : ''}`} onClick={toggle3D}>
                {is3D ? "Vista 2D" : "Vista 3D"}
              </button>
              <button className={`toggle-3d-btn fullscreen-toggle-btn ${isFullscreen ? 'active' : ''}`} onClick={toggleFullscreen} title="Tutto Schermo">
                {isFullscreen
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                }
              </button>
            </div>
          </div>
          <div ref={mapContainerRef} className="bruna-map-container" />
          {isFullscreen && (
            <button className="bruna-map-exit-fs" onClick={toggleFullscreen}>
              ← Torna indietro
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function createEventMarkers(map, onSelect) {
  return markersData.map((event) => {
    const el = document.createElement('div');
    el.className = 'bruna-map-marker';
    // Il pin visivo va su un figlio interno: Mapbox usa il `transform` dell'elemento
    // radice per posizionare il marker ad ogni frame, quindi qualsiasi transizione o
    // scala applicata alla radice lo fa "scivolare". Tenendo la grafica nel figlio,
    // il punto resta fermo sulle coordinate anche in 3D.
    const pin = document.createElement('div');
    pin.className = 'bruna-map-marker-pin';
    el.appendChild(pin);

    // Pagina /geolocalizzati: niente popup, apre la barra in basso.
    if (onSelect) {
      // Stesso ancoraggio del pin rosso: sostituiamo l'immagine con un segnaposto
      // dorato casuale e ingrandiamo il marker (anchor bottom invariato).
      const geoPinUrl = randomGeoPin();
      el.classList.add('geo-photo-marker');
      // Questo segnaposto ha più margine trasparente → reso un po' più grande per pareggiarlo agli altri.
      if (geoPinUrl.includes('AD982487')) el.classList.add('geo-photo-marker-lg');
      pin.classList.add('geo-photo-pin');
      pin.style.backgroundImage = `url("${geoPinUrl}")`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect({
          kind: 'event',
          title: event.title,
          category: event.type,
          meta: event.time,
          place: event.place,
          coordinates: event.coordinates,
        });
      });
      return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(event.coordinates)
        .addTo(map);
    }

    const [lng, lat] = event.coordinates;
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(event.title)}`;

    const popupHTML = `
       <div class="popup-header">
         <h3 class="popup-title">${event.title}</h3>
         <button class="popup-close-btn">&times;</button>
       </div>
       ${event.place ? `<p class="popup-place">📍 ${event.place}</p>` : ''}
       <p class="popup-time"><strong>Quando:</strong> ${event.time}</p>
       <p class="popup-type"><strong>Tipo:</strong> ${event.type}</p>
       <p class="popup-info">${event.info}</p>
       <div class="popup-maps-links">
         <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-map-btn google-btn">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
           Google Maps
         </a>
         <a href="${appleMapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-map-btn apple-btn">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
           Apple Maps
         </a>
       </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'bruna-map-popup' })
      .setHTML(popupHTML);

    popup.on('open', () => {
      document.querySelector('.popup-close-btn')?.addEventListener('click', () => popup.remove());
    });

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(event.coordinates)
      .setPopup(popup)
      .addTo(map);
  });
}

function createActivityMarkers(map, navigateRef, onSelect) {
  return activitiesData.map((activity) => {
    const el = document.createElement('div');
    el.className = 'bruna-map-marker';
    // Grafica nel figlio: la radice resta gestita da Mapbox → segnaposto fermo anche in 3D.
    const pin = document.createElement('div');
    pin.className = 'bruna-map-marker-pin';
    el.appendChild(pin);

    // Pagina /geolocalizzati: niente popup, apre la barra in basso.
    if (onSelect) {
      // Stesso ancoraggio del pin rosso: sostituiamo l'immagine con un segnaposto
      // dorato casuale e ingrandiamo il marker (anchor bottom invariato).
      const geoPinUrl = randomGeoPin();
      el.classList.add('geo-photo-marker');
      // Questo segnaposto ha più margine trasparente → reso un po' più grande per pareggiarlo agli altri.
      if (geoPinUrl.includes('AD982487')) el.classList.add('geo-photo-marker-lg');
      pin.classList.add('geo-photo-pin');
      pin.style.backgroundImage = `url("${geoPinUrl}")`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect({
          kind: 'activity',
          title: activity.title,
          category: activity.category,
          meta: `⏱ ${activity.duration}  ·  ★ ${activity.rating}  ·  ${activity.price}`,
          place: activity.place,
          index: activity.index,
          coordinates: activity.coordinates,
        });
      });
      return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(activity.coordinates)
        .addTo(map);
    }

    const popupHTML = `
       <div class="popup-header">
         <h3 class="popup-title">${activity.title}</h3>
         <button class="popup-close-btn">&times;</button>
       </div>
       <span class="popup-category">${activity.category}</span>
       ${activity.place ? `<p class="popup-place">📍 ${activity.place}</p>` : ''}
       <p class="popup-meta">⏱ ${activity.duration} &nbsp;·&nbsp; ★ ${activity.rating} &nbsp;·&nbsp; <strong>${activity.price}</strong></p>
       <button class="popup-activity-btn" type="button">Scopri di più ➔</button>
    `;

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'bruna-map-popup' })
      .setHTML(popupHTML);

    popup.on('open', () => {
      const root = popup.getElement();
      root?.querySelector('.popup-close-btn')?.addEventListener('click', () => popup.remove());
      root?.querySelector('.popup-activity-btn')?.addEventListener('click', () => {
        navigateRef.current(`/prova?activity=${activity.index}`);
        popup.remove();
      });
    });

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(activity.coordinates)
      .setPopup(popup)
      .addTo(map);
  });
}
