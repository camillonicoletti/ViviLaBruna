import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_SATELLITE_STYLE, createStreetFallbackStyle, shouldUseFallbackStyle } from '../../components/mapStyleFallback';
import './Viability.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const BUS_LINES = [
  {
    code: 'B1',
    name: 'Linea Centro Festa',
    tone: 'gold',
    color: '#C9A84C',
    route: 'Parcheggio Serra Rifusa - Stazione Centrale - Via Lucana - Piazza Matteotti',
    frequency: 'Ogni 8 min',
    service: '07:00 - 02:00',
    bestFor: 'Arrivo rapido in centro',
    coordinates: [16.5897, 40.6818],
    routeCoordinates: [
      [16.5897, 40.6818],
      [16.6048, 40.6711],
      [16.6098, 40.6673],
      [16.6127, 40.6658],
    ],
    stops: ['Serra Rifusa', 'Stazione', 'Via Lucana', 'Matteotti'],
  },
  {
    code: 'B2',
    name: 'Navetta Sassi',
    tone: 'crimson',
    color: '#A52A2A',
    route: 'Parco Macamarda - Villa Longo - Via Ridola - Belvedere Guerricchio',
    frequency: 'Ogni 12 min',
    service: '09:00 - 01:00',
    bestFor: 'Accesso ai Sassi',
    coordinates: [16.6068, 40.6717],
    routeCoordinates: [
      [16.6068, 40.6717],
      [16.6124, 40.6704],
      [16.6156, 40.6662],
      [16.6118, 40.6651],
    ],
    stops: ['Macamarda', 'Villa Longo', 'Ridola', 'Guerricchio'],
  },
  {
    code: 'B3',
    name: 'Navetta Citta',
    tone: 'stone',
    color: '#A79A7E',
    route: 'Villa Comunale - Via Roma - Piazza Vittorio Veneto',
    frequency: 'Ogni 20 min',
    service: '08:30 - 23:30',
    bestFor: 'Spostamenti in centro citta',
    coordinates: [16.602, 40.6695],
    routeCoordinates: [
      [16.602, 40.6695],
      [16.608, 40.6668],
      [16.6066, 40.6655],
    ],
    stops: ['Villa Comunale', 'Via Roma', 'Vittorio Veneto'],
  },
];

const PARKING_AREAS = [
  {
    name: 'Serra Rifusa',
    type: 'Auto + camper',
    payment: 'Gratuito',
    note: 'In periferia, vicino a una navetta.',
    coordinates: [16.5897, 40.6818],
  },
  {
    name: 'Parco Macamarda',
    type: 'Auto',
    payment: 'A pagamento',
    note: 'Vicino al centro.',
    coordinates: [16.6068, 40.6717],
  },
  {
    name: 'Zona Industriale Paip',
    type: 'Auto + bus',
    payment: 'Gratuito',
    note: 'In periferia, vicino a una navetta.',
    coordinates: [16.5789, 40.6546],
  },
  {
    name: 'Via Saragat',
    type: 'Auto',
    payment: 'A pagamento',
    note: 'Vicino al centro.',
    coordinates: [16.6001, 40.6628],
  },
];

const CAMPER_AREAS = [
  {
    name: 'Area Camper Murgia Bruna',
    services: 'Carico acqua, scarico acque grigie e nere, corrente 6A',
    access: 'Periferia, vicino a una navetta',
    shuttle: 'B3 ogni 20 min',
  },
  {
    name: 'Area Camper La Gravina',
    services: 'Carico e scarico, bagni, sorveglianza, info point',
    access: 'Periferia, vicino a una navetta',
    shuttle: 'B2 da Via Ridola',
  },
];

const ORDINANCES = [
  {
    id: 'ORD-24/BR',
    title: 'ZTL Festa della Bruna',
    date: '1 luglio, 18:00 - 3 luglio, 06:00',
    body: 'Accesso limitato a residenti autorizzati, mezzi di soccorso, forze dell ordine e navette comunali.',
  },
  {
    id: 'ORD-25/BR',
    title: 'Divieto di sosta percorso Carro',
    date: '2 luglio, 05:00 - fine servizio',
    body: 'Rimozione forzata in Via Lucana, Piazza Vittorio Veneto, Via del Corso, Via Ridola e aree adiacenti.',
  },
  {
    id: 'ORD-26/BR',
    title: 'Presidio pedonale Sassi',
    date: '2 luglio, 16:00 - 24:00',
    body: 'Flussi pedonali separati tra entrata e uscita nelle aree Caveoso, Barisano e Belvedere Guerricchio.',
  },
];

const getDistanceKm = ([lngA, latA], [lngB, latB]) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(latB - latA);
  const deltaLng = toRad(lngB - lngA);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getNearestBusLineIndex = (userPosition) => (
  BUS_LINES.reduce((bestIndex, line, index) => {
    const currentDistance = Math.min(
      ...line.routeCoordinates.map((point) => getDistanceKm(userPosition, point))
    );
    const bestDistance = Math.min(
      ...BUS_LINES[bestIndex].routeCoordinates.map((point) => getDistanceKm(userPosition, point))
    );
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0)
);

// Trova la fermata (e quindi la linea) piu vicina alla posizione utente.
const getNearestStop = (userPosition, lines) => {
  let best = null;
  lines.forEach((line) => {
    line.routeCoordinates.forEach((coordinate, stopIndex) => {
      const distance = getDistanceKm(userPosition, coordinate);
      if (!best || distance < best.distance) {
        best = {
          line,
          stopName: line.stops[stopIndex] || `Fermata ${stopIndex + 1}`,
          coordinate,
          distance,
        };
      }
    });
  });
  return best;
};

const buildStopGoogleUrl = (coordinate, userPosition) => {
  if (!coordinate) return '#';
  let url = `https://www.google.com/maps/dir/?api=1&destination=${coordinate[1]},${coordinate[0]}&travelmode=walking`;
  if (userPosition) url += `&origin=${userPosition[1]},${userPosition[0]}`;
  return url;
};

const buildStopAppleUrl = (coordinate, userPosition) => {
  if (!coordinate) return '#';
  let url = `https://maps.apple.com/?daddr=${coordinate[1]},${coordinate[0]}&dirflg=w`;
  if (userPosition) url += `&saddr=${userPosition[1]},${userPosition[0]}`;
  return url;
};

function BusLinesMap({ lines, userPosition, nearestStop, status }) {
  const wrapperRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const boundsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nearestLine = nearestStop ? nearestStop.line : null;
  const googleUrl = useMemo(
    () => (nearestStop ? buildStopGoogleUrl(nearestStop.coordinate, userPosition) : '#'),
    [nearestStop, userPosition]
  );
  const appleUrl = useMemo(
    () => (nearestStop ? buildStopAppleUrl(nearestStop.coordinate, userPosition) : '#'),
    [nearestStop, userPosition]
  );

  // Fullscreen via CSS: su mobile (iOS Safari) requestFullscreen sui <div> non e affidabile,
  // quindi usiamo una "schermata" fissa a tutto schermo gestita con una classe.
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) document.body.classList.add('bus-map-fullscreen-active');
      else document.body.classList.remove('bus-map-fullscreen-active');

      // La canvas WebGL va ridimensionata dopo che il layout fullscreen e applicato.
      setTimeout(() => {
        const map = mapRef.current;
        if (!map) return;
        map.resize();
        if (boundsRef.current) {
          map.fitBounds(boundsRef.current, {
            padding: next ? 64 : 48,
            pitch: 38,
            bearing: -16,
            duration: 600,
          });
        }
      }, 60);
      setTimeout(() => mapRef.current?.resize(), 320);
      return next;
    });
  }, []);

  useEffect(() => () => {
    document.body.classList.remove('bus-map-fullscreen-active');
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxgl.accessToken) return undefined;

    let usingFallbackStyle = !mapboxgl.accessToken;
    let markers = [];
    let userMarker = null;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: usingFallbackStyle ? createStreetFallbackStyle() : MAPBOX_SATELLITE_STYLE,
      center: [16.612, 40.667],
      zoom: 12.2,
      pitch: 38,
      bearing: -16,
      antialias: true,
    });
    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();
    lines.forEach((line) => {
      line.routeCoordinates.forEach((coordinate) => bounds.extend(coordinate));
    });
    if (userPosition) bounds.extend(userPosition);
    boundsRef.current = bounds;

    const clearMarkers = () => {
      markers.forEach((marker) => marker.remove());
      markers = [];
      userMarker?.remove();
      userMarker = null;
    };

    const switchToFallbackStyle = () => {
      if (usingFallbackStyle || !mapRef.current) return;
      usingFallbackStyle = true;
      map.setStyle(createStreetFallbackStyle());
      setTimeout(() => mapRef.current?.resize(), 100);
    };

    const renderBusLines = () => {
      map.resize();
      clearMarkers();

      if (!map.getSource('bus-lines')) {
        map.addSource('bus-lines', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: lines.map((line) => ({
              type: 'Feature',
              properties: { code: line.code, color: line.color },
              geometry: { type: 'LineString', coordinates: line.routeCoordinates },
            })),
          },
        });
      }

      if (!map.getLayer('bus-lines-glow')) {
        map.addLayer({
          id: 'bus-lines-glow',
          type: 'line',
          source: 'bus-lines',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': ['get', 'color'], 'line-width': 11, 'line-opacity': 0.22, 'line-blur': 3 },
        });
      }

      if (!map.getLayer('bus-lines-main')) {
        map.addLayer({
          id: 'bus-lines-main',
          type: 'line',
          source: 'bus-lines',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': ['get', 'color'], 'line-width': 4.5, 'line-opacity': 0.95 },
        });
      }

      lines.forEach((line) => {
        // Badge della linea sul capolinea
        const badge = document.createElement('span');
        badge.className = `bus-line-map-marker bus-line-map-marker--${line.tone}`;
        badge.textContent = line.code;
        markers.push(
          new mapboxgl.Marker({ element: badge, anchor: 'center' })
            .setLngLat(line.routeCoordinates[0])
            .addTo(map)
        );

        // Pallini delle fermate: cliccabili, mostrano il nome della fermata.
        // Il capolinea (indice 0) ha gia il badge grande con il codice linea,
        // quindi saltiamo il pallino piccolo per non sovrapporlo.
        line.routeCoordinates.forEach((coordinate, stopIndex) => {
          if (stopIndex === 0) return;
          const stopName = line.stops[stopIndex] || `Fermata ${stopIndex + 1}`;
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = `bus-stop-dot bus-stop-dot--${line.tone}`;
          dot.setAttribute('aria-label', `Fermata ${stopName}`);

          const popup = new mapboxgl.Popup({
            offset: 14,
            closeButton: false,
            className: 'bus-stop-popup',
          }).setHTML(`<strong>${stopName}</strong><span>${line.code} · ${line.name}</span>`);

          markers.push(
            new mapboxgl.Marker({ element: dot, anchor: 'center' })
              .setLngLat(coordinate)
              .setPopup(popup)
              .addTo(map)
          );
        });
      });

      if (userPosition) {
        const el = document.createElement('span');
        el.className = 'bus-line-user-marker';
        userMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(userPosition)
          .addTo(map);
      }

      map.fitBounds(bounds, { padding: 48, pitch: 38, bearing: -16, duration: 900 });
    };

    map.on('error', (event) => {
      if (shouldUseFallbackStyle(event)) switchToFallbackStyle();
    });
    map.on('style.load', renderBusLines);

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [lines, userPosition]);

  return (
    <div
      className={`bus-lines-map-panel${isFullscreen ? ' is-fullscreen' : ''}`}
      ref={wrapperRef}
      aria-label="Mappa delle linee bus"
    >
      <div className="bus-lines-map-stage">
        <div className="bus-lines-map-fallback" aria-hidden="true">
          {lines.map((line, index) => (
            <span className={`bus-lines-fallback-path bus-lines-fallback-path--${line.tone}`} key={line.code} style={{ '--line-index': index }} />
          ))}
        </div>
        <div ref={mapContainerRef} className="bus-lines-map-canvas" />

        {isFullscreen ? (
          <button
            type="button"
            className="bus-map-back-btn"
            onClick={toggleFullscreen}
            aria-label="Torna alla viabilita"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            Indietro
          </button>
        ) : (
          <button
            type="button"
            className="bus-map-fullscreen-btn"
            onClick={toggleFullscreen}
            title="Tutto schermo"
            aria-label="Apri la mappa a tutto schermo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
          </button>
        )}

        {!isFullscreen && (
          <div className="bus-lines-map-status">
            {nearestLine
              ? `Linea piu vicina a te: ${nearestLine.code} · ${nearestLine.name}`
              : status}
          </div>
        )}
      </div>

      {isFullscreen && (
        <div className="bus-map-fs-footer">
          <span className="bus-map-fs-kicker">Linea piu vicina a te</span>
          {nearestStop ? (
            <>
              <strong className="bus-map-fs-line">{nearestStop.line.code} · {nearestStop.line.name}</strong>
              <span className="bus-map-fs-stop">Fermata piu vicina: {nearestStop.stopName}</span>
              <div className="bus-map-fs-actions">
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="bus-map-fs-btn google">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                  Google Maps
                </a>
                <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="bus-map-fs-btn apple">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  Apple Maps
                </a>
              </div>
            </>
          ) : (
            <strong className="bus-map-fs-line">{status}</strong>
          )}
        </div>
      )}
    </div>
  );
}

function ParkingMap({ areas }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxgl.accessToken) return undefined;

    const isMobile = window.innerWidth <= 768;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard-satellite',
      center: [16.5994, 40.667],
      zoom: isMobile ? 12.2 : 12.7,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('style.load', () => {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    });

    const bounds = new mapboxgl.LngLatBounds();

    areas.forEach((area) => {
      bounds.extend(area.coordinates);

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'parking-mapbox-marker';
      marker.setAttribute('aria-label', area.name);

      const popup = new mapboxgl.Popup({
        offset: 24,
        closeButton: false,
        className: 'parking-map-popup',
      }).setHTML(`
        <strong>${area.name}</strong>
        <span>${area.type}</span>
        <em>${area.payment}</em>
      `);

      new mapboxgl.Marker({ element: marker, anchor: 'bottom' })
        .setLngLat(area.coordinates)
        .setPopup(popup)
        .addTo(map);
    });

    map.on('load', () => {
      map.fitBounds(bounds, {
        padding: isMobile ? 54 : 78,
        pitch: 45,
        bearing: -17.6,
        duration: 1200,
      });
    });

    return () => {
      map.remove();
    };
  }, [areas]);

  return (
    <div className="parking-map" aria-label="Mappa delle aree parcheggio">
      <div className="parking-map-fallback" aria-hidden="true">
        {areas.map((area, index) => (
          <span className={`parking-map-fallback-pin fallback-pin-${index + 1}`} key={area.name} />
        ))}
      </div>
      <div ref={mapContainerRef} className="parking-map-canvas" />
    </div>
  );
}

export default function Viability() {
  const [selectedBusLine, setSelectedBusLine] = useState(0);
  const [selectedParkingIndex, setSelectedParkingIndex] = useState(0);
  const [lineFinderStatus, setLineFinderStatus] = useState('Sto cercando la linea piu vicina a te...');
  const [userPosition, setUserPosition] = useState(null);
  const [nearestStop, setNearestStop] = useState(null);
  const geolocationRequestedRef = useRef(false);

  const moveBusLine = (direction) => {
    setSelectedBusLine((prev) => (prev + direction + BUS_LINES.length) % BUS_LINES.length);
  };

  const moveParking = (direction) => {
    setSelectedParkingIndex((prev) => (prev + direction + PARKING_AREAS.length) % PARKING_AREAS.length);
  };

  useEffect(() => {
    if (geolocationRequestedRef.current) return;
    geolocationRequestedRef.current = true;

    if (!navigator.geolocation) {
      setLineFinderStatus('Geolocalizzazione non disponibile su questo dispositivo.');
      return undefined;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.longitude, coords.latitude];
        const nearestIndex = getNearestBusLineIndex(position);
        const stop = getNearestStop(position, BUS_LINES);

        setUserPosition(position);
        setSelectedBusLine(nearestIndex);
        setNearestStop(stop);
        setLineFinderStatus(`Linea piu vicina a te: ${stop.line.code} · ${stop.line.name}`);
      },
      () => {
        setLineFinderStatus('Attiva la posizione per vedere la linea piu vicina a te.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return undefined;
  }, []);

  return (
    <main className="viability-page">
      <section className="viability-section route-section" id="linee-navetta" aria-labelledby="bus-title">
        <div className="section-heading with-action">
          <div>
            <span className="section-kicker">Pullman e navette</span>
            <h2 id="bus-title">Linee per centro e Sassi</h2>
          </div>
          <a className="all-lines-link" href="#linee-navetta">Esplora tutte le linee</a>
        </div>

        <BusLinesMap
          lines={BUS_LINES}
          userPosition={userPosition}
          nearestStop={userPosition ? nearestStop : null}
          status={lineFinderStatus}
        />

        <div className="mobile-bus-carousel">
          <button
            type="button"
            className="viability-carousel-arrow viability-carousel-arrow--prev"
            onClick={() => moveBusLine(-1)}
            aria-label="Linea precedente"
          >
            ‹
          </button>

          <div className="bus-line-grid">
            {BUS_LINES.map((line, index) => (
              <article
                className={`bus-card bus-card--${line.tone} ${selectedBusLine === index ? 'is-mobile-active' : ''}`}
                key={line.code}
              >
                <div className="bus-card-header">
                  <span className="line-code">{line.code}</span>
                  <div>
                    <h3>{line.name}</h3>
                    <p>{line.bestFor}</p>
                  </div>
                </div>

                <div
                  className="route-strip"
                  aria-label={line.route}
                  style={{ gridTemplateColumns: `repeat(${line.stops.length}, minmax(0, 1fr))` }}
                >
                  {line.stops.map((stop, stopIndex) => (
                    <div className="route-stop" key={`${line.code}-${stop}-${stopIndex}`}>
                      <span className="stop-dot" />
                      <small>{stop}</small>
                      {stopIndex < line.stops.length - 1 && <span className="stop-line" aria-hidden="true" />}
                    </div>
                  ))}
                </div>

                <p className="line-route">{line.route}</p>
                <dl className="line-meta">
                  <div>
                    <dt>Frequenza</dt>
                    <dd>{line.frequency}</dd>
                  </div>
                  <div>
                    <dt>Servizio</dt>
                    <dd>{line.service}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="viability-carousel-arrow viability-carousel-arrow--next"
            onClick={() => moveBusLine(1)}
            aria-label="Linea successiva"
          >
            ›
          </button>
        </div>

      </section>

      <section className="viability-section parking-section" aria-labelledby="parking-title">
        <div className="section-heading">
          <h2 id="parking-title">Aree parcheggio</h2>
        </div>

        <div className="parking-layout">
          <ParkingMap areas={PARKING_AREAS} />

          <div className="mobile-parking-carousel">
            <button
              type="button"
              className="viability-carousel-arrow viability-carousel-arrow--prev"
              onClick={() => moveParking(-1)}
              aria-label="Parcheggio precedente"
            >
              ‹
            </button>

            <div className="parking-list">
              {PARKING_AREAS.map((area, index) => (
                <article
                  className={`parking-card ${selectedParkingIndex === index ? 'is-mobile-active' : ''}`}
                  key={area.name}
                >
                  <div className="parking-card-top">
                    <div>
                      <span>Tipologia</span>
                      <h3>{area.name}</h3>
                    </div>
                    <strong className={`parking-status ${area.payment === 'Gratuito' ? 'is-free' : 'is-busy'}`}>
                      {area.payment}
                    </strong>
                  </div>
                  <div className="parking-type-box">{area.type}</div>
                  <p>{area.note}</p>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="viability-carousel-arrow viability-carousel-arrow--next"
              onClick={() => moveParking(1)}
              aria-label="Parcheggio successivo"
            >
              ›
            </button>
          </div>

          <Link className="parking-map-link" to="/viabilita/parcheggi">
            Vedi la mappa dei parcheggi
          </Link>
        </div>
      </section>

      <section className="viability-section split-section" aria-label="Camper e ordinanze">
        <div className="camper-panel">
          <div className="section-heading compact">
            <span className="section-kicker">Carico e scarico</span>
            <h2>Aree camper</h2>
          </div>
          <div className="camper-list">
            {CAMPER_AREAS.map((area) => (
              <article className="camper-card" key={area.name}>
                <h3>{area.name}</h3>
                <p>{area.services}</p>
                <div className="camper-meta">
                  <span>{area.access}</span>
                  <span>{area.shuttle}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ordinance-panel">
          <div className="section-heading compact">
            <span className="section-kicker">Avvisi comunali</span>
            <h2>Ordinanze e chiusure</h2>
          </div>
          <div className="ordinance-list">
            {ORDINANCES.map((item) => (
              <article className="ordinance-card" key={item.id}>
                <span>{item.id}</span>
                <h3>{item.title}</h3>
                <time>{item.date}</time>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

export function ParkingMapPage() {
  return (
    <main className="viability-page parking-map-page">
      <section className="viability-section parking-map-page-section" aria-labelledby="parking-map-title">
        <div className="section-heading with-action">
          <div>
            <span className="section-kicker">Parcheggi Festa</span>
            <h2 id="parking-map-title">Mappa parcheggi</h2>
          </div>
          <Link className="all-lines-link" to="/viabilita">Torna alla viabilita</Link>
        </div>

        <ParkingMap areas={PARKING_AREAS} />

        <div className="parking-list parking-map-page-list">
          {PARKING_AREAS.map((area) => (
            <article className="parking-card" key={area.name}>
              <div className="parking-card-top">
                <div>
                  <span>Tipologia</span>
                  <h3>{area.name}</h3>
                </div>
                <strong className={`parking-status ${area.payment === 'Gratuito' ? 'is-free' : 'is-busy'}`}>
                  {area.payment}
                </strong>
              </div>
              <div className="parking-type-box">{area.type}</div>
              <p>{area.note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
