import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Viability.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const BUS_LINES = [
  {
    code: 'B1',
    name: 'Linea Centro Festa',
    tone: 'gold',
    route: 'Parcheggio Serra Rifusa - Stazione Centrale - Via Lucana - Piazza Matteotti',
    frequency: 'Ogni 8 min',
    service: '07:00 - 02:00',
    bestFor: 'Arrivo rapido in centro',
    stops: ['Serra Rifusa', 'Stazione', 'Via Lucana', 'Matteotti'],
  },
  {
    code: 'B2',
    name: 'Navetta Sassi',
    tone: 'crimson',
    route: 'Parco Macamarda - Villa Longo - Via Ridola - Belvedere Guerricchio',
    frequency: 'Ogni 12 min',
    service: '09:00 - 01:00',
    bestFor: 'Accesso ai Sassi',
    stops: ['Macamarda', 'Villa Longo', 'Ridola', 'Guerricchio'],
  },
  {
    code: 'B3',
    name: 'Anello Murgia',
    tone: 'stone',
    route: 'Parcheggio Murgia - Jazzo Gattini - Porta Pistola - Ritorno Murgia',
    frequency: 'Ogni 20 min',
    service: '08:30 - 23:30',
    bestFor: 'Belvederi e trekking',
    stops: ['Murgia', 'Jazzo', 'Porta Pistola', 'Murgia'],
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
  return (
    <main className="viability-page">
      <section className="viability-section route-section" id="linee-navetta" aria-labelledby="bus-title">
        <div className="section-heading with-action">
          <div>
            <span className="section-kicker">Pullman e navette</span>
            <h2 id="bus-title">Linee per centro e Sassi</h2>
          </div>
          <a className="all-lines-link" href="#linee-navetta">Vedi tutte le linee</a>
        </div>

        <div className="bus-line-grid">
          {BUS_LINES.map((line) => (
            <article className={`bus-card bus-card--${line.tone}`} key={line.code}>
              <div className="bus-card-header">
                <span className="line-code">{line.code}</span>
                <div>
                  <h3>{line.name}</h3>
                  <p>{line.bestFor}</p>
                </div>
              </div>

              <div className="route-strip" aria-label={line.route}>
                {line.stops.map((stop, index) => (
                  <div className="route-stop" key={stop}>
                    <span className="stop-dot" />
                    <small>{stop}</small>
                    {index < line.stops.length - 1 && <span className="stop-line" aria-hidden="true" />}
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
      </section>

      <section className="viability-section parking-section" aria-labelledby="parking-title">
        <div className="section-heading">
          <h2 id="parking-title">Aree parcheggio</h2>
        </div>

        <div className="parking-layout">
          <ParkingMap areas={PARKING_AREAS} />

          <div className="parking-list">
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
