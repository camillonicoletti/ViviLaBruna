import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_SATELLITE_STYLE, createStreetFallbackStyle, shouldUseFallbackStyle } from '../mapStyleFallback';
import { setRouteMapGestures } from './routeMapGesturePolicy';
import './RouteMapbox.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Coppie chiaro/scuro per il gradiente dei pin numerati
const STEP_COLORS = [
  { light: '#81c784', dark: '#2e7d32' },
  { light: '#ffd54f', dark: '#f57f17' },
  { light: '#ffb74d', dark: '#e65100' },
  { light: '#e57373', dark: '#b71c1c' },
  { light: '#ba68c8', dark: '#6a1b9a' },
  { light: '#64b5f6', dark: '#0d47a1' }
];

const stepColor = (idx) => STEP_COLORS[Math.min(idx, STEP_COLORS.length - 1)];

// Helper: estrae [lng, lat] da qualunque forma di waypoint (array o oggetto con chiavi 0/1)
function toLngLat(wp) {
  return [Number(wp[0]), Number(wp[1])];
}

// Pin numerato "premium": goccia con gradiente, ombra morbida e
// badge bianco col numero della tappa (id univoci per gradiente/filtro).
function createPinElement(index, colors) {
  const el = document.createElement('div');
  el.className = 'route-pin';
  el.style.cssText = 'width:38px;height:52px;cursor:pointer;user-select:none;display:block;line-height:0;';
  const uid = 'route-pin-' + index + '-' + Math.random().toString(36).slice(2, 7);
  el.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="52" viewBox="0 0 38 52" style="display:block;overflow:visible;">' +
      '<defs>' +
        '<linearGradient id="' + uid + '-g" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + colors.light + '"/>' +
          '<stop offset="100%" stop-color="' + colors.dark + '"/>' +
        '</linearGradient>' +
        '<filter id="' + uid + '-s" x="-40%" y="-20%" width="180%" height="150%">' +
          '<feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#000" flood-opacity="0.4"/>' +
        '</filter>' +
      '</defs>' +
      '<g filter="url(#' + uid + '-s)">' +
        '<path d="M19 2C10.7 2 4 8.7 4 17c0 10.8 15 31 15 31s15-20.2 15-31C34 8.7 27.3 2 19 2z"' +
        ' fill="url(#' + uid + '-g)" stroke="#fff" stroke-width="2"/>' +
        '<circle cx="19" cy="17" r="10" fill="#fff"/>' +
        '<circle cx="19" cy="17" r="10" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.8"/>' +
        '<text x="19" y="17.5" text-anchor="middle" dominant-baseline="central"' +
        ' fill="' + colors.dark + '" font-weight="800" font-size="12.5" font-family="Inter,Arial,sans-serif">' + (index + 1) + '</text>' +
      '</g>' +
    '</svg>';
  return el;
}

function buildGoogleMapsUrl(waypoints) {
  if (!waypoints || waypoints.length < 2) return '#';
  const first = toLngLat(waypoints[0]);
  const last  = toLngLat(waypoints[waypoints.length - 1]);
  const origin = first[1] + ',' + first[0];
  const dest   = last[1]  + ',' + last[0];
  const middle = waypoints.slice(1, -1).map(function(w) {
    var ll = toLngLat(w); return ll[1] + ',' + ll[0];
  }).join('|');
  var url = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + dest + '&travelmode=walking';
  if (middle) url += '&waypoints=' + encodeURIComponent(middle);
  return url;
}

function buildAppleMapsUrl(waypoints) {
  if (!waypoints || waypoints.length < 2) return '#';
  const first = toLngLat(waypoints[0]);
  const last  = toLngLat(waypoints[waypoints.length - 1]);
  return 'https://maps.apple.com/?saddr=' + first[1] + ',' + first[0] +
         '&daddr=' + last[1] + ',' + last[0] + '&dirflg=w';
}

function buildRouteGeometry(coordinates) {
  return { type: 'LineString', coordinates };
}

function addRouteGeometry(map, geometry) {
  ['route-line', 'route-glow'].forEach(function(layerId) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource('route')) map.removeSource('route');

  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: geometry }
  });
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#00aaff', 'line-width': 20, 'line-opacity': 0.15, 'line-blur': 12 } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#00bfff', 'line-width': 5, 'line-opacity': 0.95 } });
}

function fitRouteBounds(map, coordinates) {
  if (!coordinates.length) return;

  const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
  coordinates.forEach(function(coord) { bounds.extend(coord); });
  map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, pitch: 45, bearing: -17.6, duration: 1200 });
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
}

export default function RouteMapbox({ waypoints, draw }) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const wrapperRef      = useRef(null);
  const mapRef          = useRef(null);
  // Coordinate del percorso attuale: servono a re-inquadrare il centro quando
  // si entra/esce dal fullscreen (la mappa non deve restare dove l'hai lasciata).
  const routeCoordsRef  = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Pin selezionato: apre la scheda scura stile "Esplora Attività"
  // al posto dei bottoni Google/Apple Maps (✕ per tornare ai bottoni).
  const [selectedStep, setSelectedStep] = useState(null);
  // Dentro la scheda: "Indicazioni" mostra i bottoni Google/Apple per la tappa,
  // "Scopri di più" espande la descrizione (o apre l'attività se collegata).
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const googleUrl = useMemo(function() { return buildGoogleMapsUrl(waypoints); }, [waypoints]);
  const appleUrl  = useMemo(function() { return buildAppleMapsUrl(waypoints);  }, [waypoints]);

  const handleStepClick = useCallback(function(idx) { setSelectedStep(idx); }, []);

  useEffect(function() { setSelectedStep(null); }, [waypoints, draw]);
  useEffect(function() { setDirectionsOpen(false); setMoreOpen(false); }, [selectedStep]);

  // Logica fullscreen identica a BrunaMap
  const toggleFullscreen = useCallback(function() {
    var wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (!isFullscreen) {
      var req = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen;
      if (req) {
        req.call(wrapper).catch(function(e) { console.warn(e); });
      } else {
        wrapper.classList.add('is-fullscreen');
        document.body.classList.add('route-map-fullscreen-active');
        setIsFullscreen(true);
        setTimeout(function() { if (mapRef.current) mapRef.current.resize(); }, 100);
      }
    } else {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      } else {
        wrapper.classList.remove('is-fullscreen');
        document.body.classList.remove('route-map-fullscreen-active');
        setIsFullscreen(false);
        setTimeout(function() { if (mapRef.current) mapRef.current.resize(); }, 100);
      }
    }
  }, [isFullscreen]);

  useEffect(function() {
    function onFsChange() {
      var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) document.body.classList.add('route-map-fullscreen-active');
      else document.body.classList.remove('route-map-fullscreen-active');
      setTimeout(function() { if (mapRef.current) mapRef.current.resize(); }, 100);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return function() {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.body.classList.remove('route-map-fullscreen-active');
    };
  }, []);

  // Entrando/uscendo dal fullscreen: in formato compatto blocca solo il pan
  // (lo zoom resta disponibile) e riporta
  // sempre l'inquadratura al centro del percorso (non dove l'utente si era spostato).
  useEffect(function() {
    var map = mapRef.current;
    if (!map) return;
    setRouteMapGestures(map, !isMobileViewport() || isFullscreen);
    var coords = routeCoordsRef.current;
    var timer = setTimeout(function() {
      if (!mapRef.current) return;
      mapRef.current.resize();
      if (coords && coords.length) fitRouteBounds(mapRef.current, coords);
    }, 260);
    return function() { clearTimeout(timer); };
  }, [isFullscreen]);

  useEffect(function() {
    if (!draw || !waypoints || waypoints.length < 2) return;
    if (mapRef.current) return;

    const lngLats = waypoints.map(toLngLat);
    const centerLng = lngLats.reduce(function(s, w) { return s + w[0]; }, 0) / lngLats.length;
    const centerLat = lngLats.reduce(function(s, w) { return s + w[1]; }, 0) / lngLats.length;

    let usingFallbackStyle = !mapboxgl.accessToken;
    let routeMarkers = [];
    let drawRequestId = 0;
    // La mappa viene ricreata quando cambiano i waypoints (es. cambio giorno):
    // le fetch delle Directions ancora in volo non devono disegnare sulla
    // mappa rimossa (map.getLayer su stile undefined → TypeError in console).
    let disposed = false;

    function clearRouteMarkers() {
      routeMarkers.forEach(function(marker) { marker.remove(); });
      routeMarkers = [];
    }

    function switchToFallbackStyle() {
      if (usingFallbackStyle || !mapRef.current) return;
      usingFallbackStyle = true;
      drawRequestId += 1;
      clearRouteMarkers();
      map.setStyle(createStreetFallbackStyle());
      setTimeout(function() { if (mapRef.current) mapRef.current.resize(); }, 100);
    }

    function addTerrain() {
      if (usingFallbackStyle || !mapboxgl.accessToken || map.getSource('mapbox-dem')) return;

      try {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512, maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      } catch (err) {
        console.warn('Mapbox terrain unavailable:', err);
      }
    }

    function renderFallbackRoute(currentRequestId) {
      if (disposed || currentRequestId !== drawRequestId || !mapRef.current) return;

      addRouteGeometry(map, buildRouteGeometry(lngLats));
      routeCoordsRef.current = lngLats;
      fitRouteBounds(map, lngLats);
      routeMarkers = addMarkers(map, waypoints, lngLats, null, handleStepClick);
    }

    function renderRouteForCurrentStyle() {
      const currentRequestId = ++drawRequestId;
      // La pergamena si apre con un'animazione: forziamo il resize così la canvas
      // WebGL non resta bloccata su dimensioni transitorie (mappa bianca/vuota).
      map.resize();
      clearRouteMarkers();
      addTerrain();

      if (!mapboxgl.accessToken) {
        renderFallbackRoute(currentRequestId);
        return;
      }

      const coordsString = lngLats.map(function(w) { return w[0] + ',' + w[1]; }).join(';');
      const apiUrl = 'https://api.mapbox.com/directions/v5/mapbox/walking/' + coordsString +
                     '?geometries=geojson&access_token=' + mapboxgl.accessToken;

      fetch(apiUrl)
        .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('Directions status ' + r.status)); })
        .then(function(data) {
          if (disposed || currentRequestId !== drawRequestId || !mapRef.current) return;

          if (!data.routes || !data.routes[0]) {
            renderFallbackRoute(currentRequestId);
            return;
          }

          const geometry = data.routes[0].geometry;
          const snapped  = data.waypoints || [];

          addRouteGeometry(map, geometry);
          routeCoordsRef.current = geometry.coordinates;
          fitRouteBounds(map, geometry.coordinates);
          routeMarkers = addMarkers(map, waypoints, lngLats, snapped, handleStepClick);
        })
        .catch(function(err) {
          if (disposed) return;
          console.error('Directions error:', err);
          renderFallbackRoute(currentRequestId);
        });
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: usingFallbackStyle ? createStreetFallbackStyle() : MAPBOX_SATELLITE_STYLE,
      center: [centerLng, centerLat],
      zoom: 14.5,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: true
    });
    mapRef.current = map;

    // Stato iniziale dei gesti: su mobile la mappa compatta non si trascina,
    // ma pinch, doppio tap e controlli di zoom restano disponibili.
    setRouteMapGestures(map, !isMobileViewport() || isFullscreen);

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', function(event) {
      if (shouldUseFallbackStyle(event)) switchToFallbackStyle();
    });
    map.on('style.load', renderRouteForCurrentStyle);

    return function() {
      disposed = true;
      clearRouteMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [draw, waypoints, handleStepClick]);

  return (
    <div className="route-mapbox-wrapper" ref={wrapperRef}>
      {/* Mappa + bottone fullscreen sovrapposto */}
      <div className="route-mapbox-container">
        <div ref={mapContainerRef} className="route-mapbox" />

        {/* Bottone fullscreen dorato identico a BrunaMap */}
        {draw && (
          <button className={'route-fullscreen-btn' + (isFullscreen ? ' active' : '')} onClick={toggleFullscreen} title="Tutto Schermo">
            {isFullscreen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            }
          </button>
        )}
      </div>
      {/* Scheda scura della tappa selezionata (stesso stile di Esplora Attività),
          con ✕ per tornare ai bottoni Google/Apple Maps del percorso completo */}
      {draw && selectedStep !== null && waypoints && waypoints[selectedStep] && (() => {
        const wp = waypoints[selectedStep];
        const [lng, lat] = toLngLat(wp);
        const colors = stepColor(selectedStep);
        // App native prima (come la mappa geolocalizzati): maps:// su iPhone,
        // comgooglemaps:// con fallback web per Google.
        const openAppleMaps = () => { window.location.href = `maps://?daddr=${lat},${lng}`; };
        const openGoogleMaps = () => {
          const appUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=walking`;
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
          const start = Date.now();
          window.location.href = appUrl;
          setTimeout(() => {
            if (!document.hidden && Date.now() - start < 1600) window.location.href = webUrl;
          }, 1200);
        };
        const onDiscover = () => {
          if (wp.expId) {
            navigate(`/prova?activity=${wp.expId - 1}`);
            return;
          }
          setMoreOpen((open) => !open);
        };
        return (
          <div className="route-sheet" role="dialog" aria-label={wp.title || `Tappa ${selectedStep + 1}`}>
            {directionsOpen && (
              <button className="route-sheet-back" onClick={() => setDirectionsOpen(false)} aria-label="Indietro">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5 L8 12 L15 19" />
                </svg>
              </button>
            )}
            <button className="route-sheet-close" onClick={() => setSelectedStep(null)} aria-label="Chiudi">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>

            <div className="route-sheet-main">
              <span
                className="route-sheet-icon"
                style={{ background: `linear-gradient(160deg, ${colors.light}, ${colors.dark})` }}
                aria-hidden="true"
              >
                {selectedStep + 1}
              </span>
              <div className="route-sheet-info">
                <h3 className="route-sheet-title">{wp.title || `Tappa ${selectedStep + 1}`}</h3>
                <span className="route-sheet-cat">Tappa {selectedStep + 1}{wp.time ? ` · ore ${wp.time}` : ''}</span>
                {wp.place && <p className="route-sheet-place">📍 {wp.place}</p>}
                {wp.desc && (
                  <p className={`route-sheet-meta ${moreOpen ? 'is-open' : ''}`}>{wp.desc}</p>
                )}
              </div>
            </div>

            <div className="route-sheet-actions">
              {directionsOpen ? (
                <>
                  <button type="button" className="route-sheet-btn ghost" onClick={openGoogleMaps}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                    Google Maps
                  </button>
                  <button type="button" className="route-sheet-btn primary" onClick={openAppleMaps}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.78.87-2.05 1.54-3.1 1.46-.13-1.1.45-2.27 1.1-3 .73-.82 2.02-1.43 3.12-1.44zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.12 3.54-1.54.01-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.02-3.05-1.78-4.04-3.35C1.5 16.45 1.18 11.13 3.92 8.5c.97-.95 2.24-1.5 3.58-1.5 1.36 0 2.22.74 3.34.74 1.09 0 1.75-.74 3.33-.74 1.19 0 2.45.65 3.35 1.77-2.94 1.61-2.46 5.81.98 7.13z" /></svg>
                    Apple Maps
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="route-sheet-btn ghost" onClick={() => setDirectionsOpen(true)}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2 4.5 20.3l.8.8L12 18l6.7 3.1.8-.8z" /></svg>
                    Indicazioni
                  </button>
                  <button type="button" className="route-sheet-btn primary" onClick={onDiscover}>
                    {wp.expId ? 'Scopri di più →' : (moreOpen ? 'Mostra meno' : 'Scopri di più →')}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}
      {draw && selectedStep === null && (
        <div className="route-map-actions">
          <span className="route-map-actions-label">Vedi il percorso su</span>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="route-ext-btn google">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Google Maps
          </a>
          <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="route-ext-btn apple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Maps
          </a>
        </div>
      )}
    </div>
  );
}

// ── Funzione separata: aggiunge marker sulla mappa ──
// Niente popup sulla mappa: il click sul pallino apre la descrizione
// nel box in basso (onStepClick → pannello sotto la mappa).
function addMarkers(map, waypoints, lngLats, snappedList, onStepClick) {
  return waypoints.map(function(wp, idx) {
    const color = STEP_COLORS[Math.min(idx, STEP_COLORS.length - 1)];
    const el    = createPinElement(idx, color);

    // Usa coord snappata se disponibile, altrimenti quella grezza
    const pos = (snappedList && snappedList[idx] && snappedList[idx].location)
      ? snappedList[idx].location
      : lngLats[idx];

    el.addEventListener('click', function(event) {
      event.stopPropagation();
      if (onStepClick) onStepClick(idx);
    });

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(pos)
      .addTo(map);
  });
}
