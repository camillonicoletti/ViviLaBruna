export function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterActivities(activities, options = {}) {
  const {
    query = '',
    category = 'all',
    favoriteIds = [],
    favoritesOnly = false
  } = options;
  const normalizedQuery = normalizeSearchText(query);
  const favoriteSet = new Set(favoriteIds);

  return activities.filter((activity) => {
    if (category !== 'all' && activity.category !== category) return false;
    if (favoritesOnly && !favoriteSet.has(activity.id)) return false;

    const searchable = normalizeSearchText([
      activity.title,
      activity.categoryLabel,
      activity.summary,
      activity.location
    ].join(' '));

    return !normalizedQuery || searchable.includes(normalizedQuery);
  });
}

export function parseFavoriteIds(rawValue, validIds = []) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    const validSet = new Set(validIds);
    return [...new Set(parsed.map(Number))].filter((id) => (
      Number.isInteger(id) && validSet.has(id)
    ));
  } catch {
    return [];
  }
}

export function buildTelephoneHref(phone = '') {
  return `tel:${String(phone).replace(/[^+\d]/g, '')}`;
}

export function buildDirectionsUrl(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) return '';
  const [lng, lat] = coords;
  const params = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function resolveActivityMedia(activity = {}) {
  const image = typeof activity.image === 'string' ? activity.image.trim() : '';
  const video = typeof activity.video === 'string' ? activity.video.trim() : '';
  const suppliedPoster = typeof activity.videoPoster === 'string'
    ? activity.videoPoster.trim()
    : '';

  return {
    image,
    video,
    poster: suppliedPoster || image
  };
}

export function shouldOpenActivityCard({
  isMobile = false,
  isInteractiveTarget = false
} = {}) {
  return Boolean(isMobile && !isInteractiveTarget);
}
