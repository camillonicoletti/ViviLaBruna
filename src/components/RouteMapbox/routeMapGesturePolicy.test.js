import test from 'node:test';
import assert from 'node:assert/strict';
import { setRouteMapGestures } from './routeMapGesturePolicy.js';

const ENABLED_COMPACT_GESTURES = [
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate',
  'touchPitch'
];
const ALL_GESTURES = [...ENABLED_COMPACT_GESTURES, 'dragPan'];

function createMapHandlers() {
  const calls = {};
  const map = {};

  ALL_GESTURES.forEach((name) => {
    calls[name] = [];
    map[name] = {
      enable() { calls[name].push('enable'); },
      disable() { calls[name].push('disable'); }
    };
  });

  return { map, calls };
}

test('la mappa compatta permette lo zoom ma blocca il trascinamento', () => {
  const { map, calls } = createMapHandlers();

  setRouteMapGestures(map, false);

  ENABLED_COMPACT_GESTURES.forEach((name) => assert.deepEqual(calls[name], ['enable']));
  assert.deepEqual(calls.dragPan, ['disable']);
});

test('la mappa fullscreen abilita tutti i gesti', () => {
  const { map, calls } = createMapHandlers();

  setRouteMapGestures(map, true);

  ALL_GESTURES.forEach((name) => {
    assert.deepEqual(calls[name], ['enable']);
  });
});
