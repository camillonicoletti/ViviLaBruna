export const MAPBOX_SATELLITE_STYLE = 'mapbox://styles/mapbox/standard-satellite';

const CARTO_TILE_URLS = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
];

export function createStreetFallbackStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [...CARTO_TILE_URLS],
        tileSize: 256,
        attribution: 'CARTO, OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-base',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 22,
        paint: {
          'raster-contrast': 0.08,
          'raster-saturation': -0.12
        }
      }
    ]
  };
}

const MAPBOX_RESOURCE_ERROR = /(401|403|unauthorized|not authorized|forbidden|mapbox|sprite|style|tile|tileset|failed to load|failed to fetch|load failed|network)/i;

export function shouldUseFallbackStyle(event) {
  const error = event?.error || event;
  const status = Number(error?.status || error?.statusCode || 0);
  const message = String(error?.message || error || '');

  return status >= 400 || MAPBOX_RESOURCE_ERROR.test(message);
}
