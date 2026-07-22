import { useEffect, useState } from 'react';
import ActivityCard from './ActivityCard';
import { ACTIVITIES, ACTIVITY_CATEGORIES } from './activitiesData';
import { filterActivities, parseFavoriteIds } from './activityExplorerUtils';
import './ActivitiesRedesign.css';

const FAVORITES_STORAGE_KEY = 'materaFavoriteActivities';
const VALID_ACTIVITY_IDS = ACTIVITIES.map((activity) => activity.id);

function readFavorites() {
  try {
    return parseFavoriteIds(localStorage.getItem(FAVORITES_STORAGE_KEY), VALID_ACTIVITY_IDS);
  } catch {
    return [];
  }
}

export default function ActivitiesRedesign() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState(readFavorites);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visibleActivities = filterActivities(ACTIVITIES, {
    query,
    category,
    favoriteIds,
    favoritesOnly
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // I preferiti restano validi in memoria per la sessione corrente.
    }
  }, [favoriteIds]);

  const toggleFavorite = (id) => {
    setFavoriteIds((current) => (
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id]
    ));
  };

  const resetView = () => {
    setQuery('');
    setCategory('all');
    setFavoritesOnly(false);
  };

  const emptyFavorites = favoritesOnly && favoriteIds.length === 0;

  return (
    <main className="activity-redesign-page">
      <section className="activity-redesign-hero" aria-labelledby="activity-redesign-title">
        <div className="activity-redesign-hero-copy">
          <span className="activity-redesign-kicker">Esperienze autentiche</span>
          <h1 id="activity-redesign-title">Cosa vuoi vivere a Matera?</h1>
          <p>Trova subito cosa farai, dove andare e chi chiamare. Senza passaggi inutili.</p>
        </div>
        <button
          type="button"
          className={`activity-redesign-saved${favoritesOnly ? ' is-active' : ''}`}
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((current) => !current)}
        >
          <span aria-hidden="true">{favoritesOnly ? '♥' : '♡'}</span>
          {favoriteIds.length} {favoriteIds.length === 1 ? 'salvata' : 'salvate'}
        </button>
      </section>

      <section className="activity-redesign-browser" aria-label="Cerca e filtra le attività">
        <label className="activity-redesign-search">
          <span className="sr-only">Cerca un’attività o un luogo</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca un’attività o un luogo"
          />
        </label>

        <div className="activity-redesign-filters" role="group" aria-label="Categorie">
          {ACTIVITY_CATEGORIES.map((filter) => (
            <button
              type="button"
              key={filter.value}
              aria-pressed={category === filter.value}
              className={category === filter.value ? 'is-active' : ''}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="activity-redesign-results" aria-live="polite">
        <div className="activity-redesign-result-count">
          <span>{visibleActivities.length} {visibleActivities.length === 1 ? 'esperienza' : 'esperienze'}</span>
          {(query || category !== 'all' || favoritesOnly) && (
            <button type="button" onClick={resetView}>Azzera filtri</button>
          )}
        </div>

        {visibleActivities.length > 0 ? (
          <div className="activity-redesign-grid">
            {visibleActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isFavorite={favoriteIds.includes(activity.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="activity-redesign-empty">
            <span aria-hidden="true">✦</span>
            <h2>{emptyFavorites ? 'Non hai ancora salvato attività' : 'Nessuna attività trovata'}</h2>
            <p>{emptyFavorites ? 'Torna alla raccolta e usa il cuore per creare la tua selezione.' : 'Prova una ricerca diversa o azzera i filtri.'}</p>
            <button type="button" onClick={resetView}>Mostra tutte le attività</button>
          </div>
        )}
      </section>
    </main>
  );
}
