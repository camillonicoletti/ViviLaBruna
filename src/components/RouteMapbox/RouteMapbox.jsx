import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteMapbox.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const STEP_COLORS = ['#4caf50', '#ffd600', '#ff9800', '#f44336', '#9c27b0', '#2196f3'];

// Helper: estrae [lng, lat] da qualunque forma di waypoint (array o oggetto con chiavi 0/1)
function toLngLat(wp) {
  return [Number(wp[0]), Number(wp[1])];
}

function createPinElement(index, color) {
  const el = document.createElement('div');
  el.style.cssText = 'width:32px;height:44px;cursor:pointer;user-select:none;display:block;line-height:0;';
  el.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44" style="display:block;">' +
    '<path d="M16 0C8.268 0 2 6.268 2 14c0 10.56 14 30 14 30S30 24.56 30 14C30 6.268 23.732 0 16 0z"' +
    ' fill="' + color + '" stroke="white" stroke-width="2.5"/>' +
    '<circle cx="16" cy="14" r="6" fill="rgba(255,255,255,0.25)"/>' +
    '<text x="16" y="14" text-anchor="middle" dominant-baseline="central"' +
    ' fill="white" font-weight="800" font-size="13" font-family="Inter,Arial,sans-serif">' + (index + 1) + '</text>' +
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

export default function RouteMapbox({ waypoints, draw }) {
  const mapContainerRef = useRef(null);
  const wrapperRef      = useRef(null);
  const mapRef          = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const googleUrl = useMemo(function() { return buildGoogleMapsUrl(waypoints); }, [waypoints]);
  const appleUrl  = useMemo(function() { return buildAppleMapsUrl(waypoints);  }, [waypoints]);

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

  useEffect(function() {
    if (!draw || !waypoints || waypoints.length < 2) return;
    if (mapRef.current) return;

    const lngLats = waypoints.map(toLngLat);
    const centerLng = lngLats.reduce(function(s, w) { return s + w[0]; }, 0) / lngLats.length;
    const centerLat = lngLats.reduce(function(s, w) { return s + w[1]; }, 0) / lngLats.length;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard-satellite',
      center: [centerLng, centerLat],
      zoom: 14.5,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: true
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('style.load', function() {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512, maxzoom: 14
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      const coordsString = lngLats.map(function(w) { return w[0] + ',' + w[1]; }).join(';');
      const apiUrl = 'https://api.mapbox.com/directions/v5/mapbox/walking/' + coordsString +
                     '?geometries=geojson&access_token=' + mapboxgl.accessToken;

      fetch(apiUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.routes || !data.routes[0]) {
            addMarkers(map, waypoints, lngLats, null);
            return;
          }

          const geometry = data.routes[0].geometry;
          const snapped  = data.waypoints || [];

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

          var bounds = new mapboxgl.LngLatBounds(lngLats[0], lngLats[0]);
          geometry.coordinates.forEach(function(c) { bounds.extend(c); });
          map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, pitch: 45, bearing: -17.6, duration: 2000 });

          addMarkers(map, waypoints, lngLats, snapped);
        })
        .catch(function(err) {
          console.error('Directions error:', err);
          addMarkers(map, waypoints, lngLats, null);
        });
    });

    return function() { map.remove(); mapRef.current = null; };
  }, [draw, waypoints]);

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
      {draw && (
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
function addMarkers(map, waypoints, lngLats, snappedList) {
  waypoints.forEach(function(wp, idx) {
    const color = STEP_COLORS[Math.min(idx, STEP_COLORS.length - 1)];
    const el    = createPinElement(idx, color);

    // Usa coord snappata se disponibile, altrimenti quella grezza
    const pos = (snappedList && snappedList[idx] && snappedList[idx].location)
      ? snappedList[idx].location
      : lngLats[idx];

    const titleStr = wp.title || ('Tappa ' + (idx + 1));
    const placeStr = wp.place ? '<p class="popup-place">\uD83D\uDCCD ' + wp.place + '</p>' : '';
    const timeStr  = wp.time  ? '<p class="popup-time"><strong>Orario:</strong> ' + wp.time + '</p>' : '';
    const descStr  = wp.desc  ? '<p class="popup-info">' + wp.desc + '</p>' : '';

    const html = '<div class="popup-header">'
      + '<h3 class="popup-title">' + titleStr + '</h3>'
      + '<button class="popup-close-btn">&times;</button>'
      + '</div>'
      + placeStr + timeStr + descStr;

    const popup = new mapboxgl.Popup({
      offset: [0, -44],
      closeButton: false,
      className: 'bruna-map-popup',
      maxWidth: '240px'
    }).setHTML(html);

    popup.on('open', function() {
      setTimeout(function() {
        var btn = document.querySelector('.popup-close-btn');
        if (btn) btn.addEventListener('click', function() { popup.remove(); });
      }, 50);
    });

    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(pos)
      .setPopup(popup)
      .addTo(map);
  });
}
