import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './InteractiveMap.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function InteractiveMap({ destination }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || !destination) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: destination,
      zoom: 15,
      pitch: 60,
      bearing: -20,
      interactive: true,
      antialias: true
    });
    
    mapRef.current = map;

    map.on('load', () => {
      // Add 3D buildings layer
      if (!map.getLayer('3d-buildings')) {
        map.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        });
      }

      // Add Destination Marker
      const el = document.createElement('div');
      el.className = 'dest-marker';
      new mapboxgl.Marker(el)
        .setLngLat(destination)
        .addTo(map);

      // Try to get user location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const userLoc = [pos.coords.longitude, pos.coords.latitude];
            
            // Add User Marker
            const userEl = document.createElement('div');
            userEl.className = 'user-marker';
            new mapboxgl.Marker(userEl)
              .setLngLat(userLoc)
              .addTo(map);

            // Fetch Route
            try {
              const query = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${userLoc[0]},${userLoc[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
              );
              const json = await query.json();
              if (json.routes && json.routes.length > 0) {
                const data = json.routes[0];
                const route = data.geometry.coordinates;

                map.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: route
                    }
                  }
                });

                map.addLayer({
                  id: 'route',
                  type: 'line',
                  source: 'route',
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#C9A84C',
                    'line-width': 5,
                    'line-opacity': 0.8
                  }
                });

                // Fit bounds
                const bounds = new mapboxgl.LngLatBounds(userLoc, userLoc);
                bounds.extend(destination);
                route.forEach(coord => bounds.extend(coord));

                map.fitBounds(bounds, { padding: 40, pitch: 50, bearing: 0 });
              }
            } catch (err) {
              console.error('Error fetching route:', err);
            }
          },
          (err) => {
            console.warn('Geolocation error:', err);
            // Default to destination orbit if no geolocation
            map.flyTo({ center: destination, zoom: 16, pitch: 65 });
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    });

    return () => {
      if (map) map.remove();
    };
  }, [destination]);

  return (
    <div className="interactive-map-wrapper">
      <div ref={mapContainer} className="interactive-map-container" />
    </div>
  );
}
