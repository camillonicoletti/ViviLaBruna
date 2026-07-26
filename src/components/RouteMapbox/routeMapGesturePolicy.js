const MAP_GESTURES = [
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate',
  'touchPitch'
];

export function setRouteMapGestures(map, fullyInteractive) {
  MAP_GESTURES.forEach((handler) => {
    if (handler === 'dragPan' && !fullyInteractive) {
      map[handler]?.disable();
    } else {
      map[handler]?.enable();
    }
  });
}
