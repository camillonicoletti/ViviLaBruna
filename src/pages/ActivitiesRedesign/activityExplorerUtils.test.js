import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES } from './activitiesData.js';
import {
  buildDirectionsUrl,
  buildTelephoneHref,
  filterActivities,
  normalizeSearchText,
  parseFavoriteIds,
  resolveActivityMedia
} from './activityExplorerUtils.js';

test('normalizza maiuscole e accenti nella ricerca', () => {
  assert.equal(normalizeSearchText('MÙRGIA Materàna'), 'murgia materana');
});

test('filtra insieme query e categoria', () => {
  const visible = filterActivities(ACTIVITIES, {
    query: 'pane',
    category: 'sapori',
    favoriteIds: [],
    favoritesOnly: false
  });

  assert.deepEqual(visible.map((activity) => activity.id), [3]);
});

test('la ricerca include anche il luogo', () => {
  const visible = filterActivities(ACTIVITIES, {
    query: 'jazzo gattini',
    category: 'all',
    favoriteIds: [],
    favoritesOnly: false
  });

  assert.deepEqual(visible.map((activity) => activity.id), [4]);
});

test('mostra soltanto gli ID preferiti validi', () => {
  const visible = filterActivities(ACTIVITIES, {
    query: '',
    category: 'all',
    favoriteIds: [2, 6],
    favoritesOnly: true
  });

  assert.deepEqual(visible.map((activity) => activity.id), [2, 6]);
});

test('recupera soltanto ID numerici, validi e unici dallo storage', () => {
  const validIds = ACTIVITIES.map((activity) => activity.id);

  assert.deepEqual(parseFavoriteIds('[1,"2",2,99,1]', validIds), [1, 2]);
  assert.deepEqual(parseFavoriteIds('json rotto', validIds), []);
  assert.deepEqual(parseFavoriteIds(null, validIds), []);
});

test('costruisce link telefonico e indicazioni validi', () => {
  assert.equal(buildTelephoneHref('+39 333 123 4567'), 'tel:+393331234567');
  assert.equal(
    buildDirectionsUrl([16.6105, 40.6664]),
    'https://www.google.com/maps/dir/?api=1&destination=40.6664%2C16.6105'
  );
});

test('risolve video opzionale e fallback immagine', () => {
  assert.deepEqual(resolveActivityMedia({
    image: '/image.jpg',
    video: '/clip.mp4',
    videoPoster: '/poster.jpg'
  }), {
    image: '/image.jpg',
    video: '/clip.mp4',
    poster: '/poster.jpg'
  });

  assert.deepEqual(resolveActivityMedia({ image: '/image.jpg' }), {
    image: '/image.jpg',
    video: '',
    poster: '/image.jpg'
  });

  assert.deepEqual(resolveActivityMedia({ image: '/image.jpg', video: '  ' }), {
    image: '/image.jpg',
    video: '',
    poster: '/image.jpg'
  });
});
