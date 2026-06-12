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

export function readReturnToMapFlag() {
  try { return sessionStorage.getItem(RETURN_TO_MAP_KEY) === '1'; } catch { return false; }
}

export default function BrunaMap({ fullscreenPage = false }) {
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

  // Pagina /mappa: blocca lo scroll della pagina sotto finché la mappa è aperta.
  useEffect(() => {
    if (!fullscreenPage) return undefined;
    document.body.classList.add('bruna-map-fs-lock');
    return () => document.body.classList.remove('bruna-map-fs-lock');
  }, [fullscreenPage]);

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
          // Se sei troppo lontano, IL BOTTONE SI FERMA QUI e manda un avviso (non vola)
          alert("📍 Sei troppo lontano da Matera!\n\nQuesta funzione 3D si attiva solo se ti trovi nel raggio di 11km dagli eventi della Festa della Bruna.");
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

    const renderEventMarkers = () => {
      clearEventMarkers();
      addTerrain();
      eventMarkers = [
        ...createEventMarkers(map),
        ...createActivityMarkers(map, navigateRef)
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
        // Sei a Matera: Annulliamo il comportamento predefinito del browser che
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
  }, []);

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

function createEventMarkers(map) {
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

function createActivityMarkers(map, navigateRef) {
  return activitiesData.map((activity) => {
    const el = document.createElement('div');
    el.className = 'bruna-map-marker';
    // Grafica nel figlio: la radice resta gestita da Mapbox → segnaposto fermo anche in 3D.
    const pin = document.createElement('div');
    pin.className = 'bruna-map-marker-pin';
    el.appendChild(pin);

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
