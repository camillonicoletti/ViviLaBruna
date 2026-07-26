export function canFullscreenActivityVideo(video) {
  return Boolean(video && (
    typeof video.requestFullscreen === 'function'
    || typeof video.webkitEnterFullscreen === 'function'
  ));
}

export async function enterActivityVideoFullscreen(video) {
  if (!canFullscreenActivityVideo(video)) return false;

  try {
    if (typeof video.requestFullscreen === 'function') {
      await video.requestFullscreen();
    } else {
      video.webkitEnterFullscreen();
    }
    return true;
  } catch {
    return false;
  }
}
