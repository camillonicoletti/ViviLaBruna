# Esplora Attività Semplice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere una seconda pagina mobile-first su `/esplora-attivita-nuova` che renda immediati confronto, preferiti, telefono e indicazioni delle sei attività, senza modificare `/prova` o il menu.

**Architecture:** La nuova feature vive in `src/pages/ActivitiesRedesign/` ed è isolata dalla pagina HUD esistente. Dati e logica di filtro/URL/storage sono moduli puri testabili con `node:test`; React gestisce soltanto stato e rendering, mentre una card dedicata espone azioni native `tel:` e Google Maps.

**Tech Stack:** React 18, React Router 7, CSS responsive scoped, `node:test`, Vite 5.

## Global Constraints

- La route nuova è esattamente `/esplora-attivita-nuova`.
- `/prova`, `/attivita` e la voce menu “Esplora Attività” non devono cambiare.
- Non aggiungere dipendenze, API, wizard AI, itinerario, sidebar, carosello o mappa incorporata.
- Ogni card mostra senza click aggiuntivi cosa si fa, durata/prezzo, luogo e telefono.
- Breakpoint griglia: 1 colonna fino a `639px`, 2 da `640px`, 3 da `1024px`.
- Colore accento principale: `#E8C96D`.
- Storage preferiti: chiave `materaFavoriteActivities`, valore JSON con ID numerici.
- Preservare tutte le modifiche non correlate già presenti nel worktree.

---

## File Structure

- `src/pages/ActivitiesRedesign/activitiesData.js`: fonte immutabile delle sei attività e categorie filtro.
- `src/pages/ActivitiesRedesign/activityExplorerUtils.js`: filtro, normalizzazione, parsing preferiti e URL nativi.
- `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`: regressioni automatiche della logica pura.
- `src/pages/ActivitiesRedesign/ActivityCard.jsx`: presentazione e azioni di una singola attività.
- `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`: stato di pagina, ricerca, filtri e preferiti.
- `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`: layout e stile scoped responsive.
- `src/App.jsx`: import e registrazione della sola route nuova.

---

### Task 1: Dati e logica pura dell’esploratore

**Files:**
- Create: `src/pages/ActivitiesRedesign/activitiesData.js`
- Create: `src/pages/ActivitiesRedesign/activityExplorerUtils.js`
- Test: `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

**Interfaces:**
- Produces: `ACTIVITY_CATEGORIES`, `ACTIVITIES`, `normalizeSearchText(value)`, `filterActivities(activities, options)`, `parseFavoriteIds(rawValue, validIds)`, `buildTelephoneHref(phone)`, `buildDirectionsUrl(coords)`.
- Consumes: nessun file della pagina `/prova`; usa soltanto JavaScript standard.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES } from './activitiesData.js';
import {
  buildDirectionsUrl,
  buildTelephoneHref,
  filterActivities,
  normalizeSearchText,
  parseFavoriteIds
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
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `activitiesData.js` or `activityExplorerUtils.js`.

- [ ] **Step 3: Add the six activities**

Create `src/pages/ActivitiesRedesign/activitiesData.js`:

```js
export const ACTIVITY_CATEGORIES = [
  { value: 'all', label: 'Tutte' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'sapori', label: 'Sapori' },
  { value: 'natura', label: 'Natura' },
  { value: 'sport', label: 'Sport' },
  { value: 'speciali', label: 'Speciali' }
];

export const ACTIVITIES = [
  {
    id: 1,
    title: 'Tour dei Sassi al Tramonto',
    category: 'cultura',
    categoryLabel: 'Cultura & storia',
    price: 'da 25€',
    rating: '4.9',
    reviews: 1240,
    image: '/hud/matera_sassi_sunset.png',
    duration: '2 ore',
    summary: 'Cammina con una guida tra grotte e vicoli dei Sassi nella luce dorata del tramonto.',
    location: 'Piazza Vittorio Veneto, Matera',
    phone: '+39 333 123 4567',
    coords: [16.6105, 40.6664]
  },
  {
    id: 2,
    title: "Volo in Mongolfiera all'Alba",
    category: 'speciali',
    categoryLabel: 'Esperienza speciale',
    price: 'da 180€',
    rating: '5.0',
    reviews: 312,
    image: '/hud/matera_hot_air_balloon.png',
    duration: '3 ore',
    summary: 'Sorvola i Sassi e la Murgia alle prime luci del giorno con brindisi al rientro.',
    location: 'Contrada Murgia Timone, Matera',
    phone: '+39 340 987 6543',
    coords: [16.621, 40.672]
  },
  {
    id: 3,
    title: 'Laboratorio del Pane IGP',
    category: 'sapori',
    categoryLabel: 'Sapori & tradizioni',
    price: 'da 45€',
    rating: '4.8',
    reviews: 580,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
    duration: '2,5 ore',
    summary: 'Impasta e cuoci il Pane di Matera IGP con un fornaio del centro storico.',
    location: 'Via Santo Stefano, Matera',
    phone: '+39 0835 123 456',
    coords: [16.608, 40.6675]
  },
  {
    id: 4,
    title: 'Trekking Murgia Materana',
    category: 'natura',
    categoryLabel: 'Natura',
    price: 'da 20€',
    rating: '4.7',
    reviews: 890,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop',
    duration: '4 ore',
    summary: 'Attraversa la Gravina e raggiungi chiese rupestri e punti panoramici della Murgia.',
    location: 'Jazzo Gattini, Parco della Murgia',
    phone: '+39 320 112 2334',
    coords: [16.615, 40.66]
  },
  {
    id: 5,
    title: 'E-Bike dalla Cripta',
    category: 'sport',
    categoryLabel: 'Sport & mobilità',
    price: 'da 35€',
    rating: '4.9',
    reviews: 420,
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop',
    duration: 'Mezza giornata',
    summary: 'Pedala senza fatica dai Sassi alla campagna materana con percorso digitale incluso.',
    location: 'Piazzetta Pascoli, Matera',
    phone: '+39 331 445 5667',
    coords: [16.604, 40.665]
  },
  {
    id: 6,
    title: 'Cena Romantica in Grotta',
    category: 'speciali',
    categoryLabel: 'Esperienza speciale',
    price: 'da 90€',
    rating: '4.9',
    reviews: 215,
    image: '/hud/matera_romantic_dinner.png',
    duration: 'Serata intera',
    summary: 'Cena a lume di candela in una grotta di tufo con menu lucano e musica dal vivo.',
    location: 'Sasso Caveoso, Matera',
    phone: '+39 0835 987 654',
    coords: [16.611, 40.664]
  }
];
```

- [ ] **Step 4: Implement the pure helpers**

Create `src/pages/ActivitiesRedesign/activityExplorerUtils.js`:

```js
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
```

- [ ] **Step 5: Run the tests and verify GREEN**

Run:

```bash
node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js
```

Expected: `6` tests, `6` pass, `0` fail.

- [ ] **Step 6: Commit Task 1 only**

```bash
git add src/pages/ActivitiesRedesign/activitiesData.js src/pages/ActivitiesRedesign/activityExplorerUtils.js src/pages/ActivitiesRedesign/activityExplorerUtils.test.js
git commit -m "feat: add activity explorer data model"
```

---

### Task 2: Pagina, card, stile e route isolata

**Files:**
- Create: `src/pages/ActivitiesRedesign/ActivityCard.jsx`
- Create: `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`
- Create: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`
- Modify: `src/App.jsx:9-14,26-29`
- Test: manual RED/GREEN della route, test automatici Task 1, lint mirato e build completa.

**Interfaces:**
- Consumes: `ACTIVITIES`, `ACTIVITY_CATEGORIES`, `filterActivities`, `parseFavoriteIds`, `buildTelephoneHref`, `buildDirectionsUrl` creati nel Task 1.
- Produces: default component `ActivitiesRedesign` montato da `App` su `/esplora-attivita-nuova`.

- [ ] **Step 1: Verify the route is currently missing (RED)**

Run:

```bash
npm run dev
```

Open `http://localhost:5173/esplora-attivita-nuova` at `390x844`.

Expected: the navbar/footer shell renders but no activity explorer exists because `App.jsx` has no matching route.

- [ ] **Step 2: Create the activity card**

Create `src/pages/ActivitiesRedesign/ActivityCard.jsx`:

```jsx
import { useState } from 'react';
import { buildDirectionsUrl, buildTelephoneHref } from './activityExplorerUtils';

export default function ActivityCard({ activity, isFavorite, onToggleFavorite }) {
  const [imageFailed, setImageFailed] = useState(false);
  const directionsUrl = buildDirectionsUrl(activity.coords);
  const telephoneHref = buildTelephoneHref(activity.phone);

  return (
    <article className="activity-redesign-card">
      <div className={`activity-redesign-media${imageFailed ? ' image-fallback' : ''}`}>
        {!imageFailed && (
          <img
            src={activity.image}
            alt={`${activity.title} a Matera`}
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="activity-redesign-category">{activity.categoryLabel}</span>
        <button
          type="button"
          className={`activity-redesign-favorite${isFavorite ? ' is-active' : ''}`}
          aria-label={`${isFavorite ? 'Rimuovi' : 'Salva'} ${activity.title} ${isFavorite ? 'dai' : 'nei'} preferiti`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(activity.id)}
        >
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </div>

      <div className="activity-redesign-card-body">
        <h2>{activity.title}</h2>
        <p className="activity-redesign-summary">{activity.summary}</p>

        <div className="activity-redesign-facts" aria-label="Informazioni principali">
          <span>◷ {activity.duration}</span>
          <span>★ {activity.rating} ({activity.reviews})</span>
          <strong>{activity.price}</strong>
        </div>

        <div className="activity-redesign-contact">
          <p><span aria-hidden="true">⌖</span><span><small>Dove</small>{activity.location}</span></p>
          <p><span aria-hidden="true">☎</span><span><small>Telefono</small><a href={telephoneHref}>{activity.phone}</a></span></p>
        </div>

        <div className="activity-redesign-actions">
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="activity-redesign-map-link">
              Indicazioni
            </a>
          )}
          <a href={telephoneHref} className="activity-redesign-call-link">Chiama ora</a>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Create the page state and accessible controls**

Create `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
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

  const visibleActivities = useMemo(() => filterActivities(ACTIVITIES, {
    query,
    category,
    favoriteIds,
    favoritesOnly
  }), [query, category, favoriteIds, favoritesOnly]);

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

        <div className="activity-redesign-filters" aria-label="Categorie">
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
```

- [ ] **Step 4: Add the approved responsive visual design**

Create `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`:

```css
.activity-redesign-page {
  --activity-gold: #E8C96D;
  --activity-ink: #080705;
  --activity-stone: #15120e;
  --activity-stone-soft: #211c15;
  min-height: 100vh;
  padding: 150px clamp(18px, 5vw, 76px) 80px;
  color: #fff;
  background:
    radial-gradient(circle at 88% 6%, rgba(116, 84, 35, 0.3), transparent 28%),
    linear-gradient(155deg, #17120c 0%, var(--activity-ink) 58%, #050504 100%);
}

.activity-redesign-page .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.activity-redesign-hero {
  width: min(1240px, 100%);
  margin: 0 auto 34px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.activity-redesign-hero-copy { max-width: 760px; }
.activity-redesign-kicker {
  color: var(--activity-gold);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.activity-redesign-hero h1 {
  margin: 10px 0 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.55rem, 7vw, 5.6rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: -0.045em;
  max-width: 780px;
}
.activity-redesign-hero p {
  max-width: 620px;
  margin: 0;
  color: #c9c0b2;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.6;
}

.activity-redesign-saved,
.activity-redesign-filters button,
.activity-redesign-result-count button,
.activity-redesign-empty button,
.activity-redesign-favorite {
  font: inherit;
  cursor: pointer;
}
.activity-redesign-saved {
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid rgba(232, 201, 109, 0.38);
  border-radius: 999px;
  color: #f4df9d;
  background: rgba(20, 17, 13, 0.78);
  backdrop-filter: blur(12px);
  font-weight: 750;
  white-space: nowrap;
}
.activity-redesign-saved.is-active { color: #191208; background: var(--activity-gold); }

.activity-redesign-browser,
.activity-redesign-results {
  width: min(1240px, 100%);
  margin-inline: auto;
}
.activity-redesign-search {
  min-height: 58px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(232, 201, 109, 0.28);
  border-radius: 999px;
  background: rgba(17, 15, 12, 0.92);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
}
.activity-redesign-search > span:not(.sr-only) { color: var(--activity-gold); font-size: 1.5rem; }
.activity-redesign-search input {
  width: 100%;
  border: 0;
  outline: 0;
  color: #fff;
  background: transparent;
  font: inherit;
  font-size: 1rem;
}
.activity-redesign-search input::placeholder { color: #948b7e; }
.activity-redesign-search:focus-within { border-color: var(--activity-gold); box-shadow: 0 0 0 3px rgba(232, 201, 109, 0.16); }

.activity-redesign-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 14px 0 34px;
}
.activity-redesign-filters button {
  min-height: 42px;
  padding: 0 15px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: #cfc6ba;
  background: rgba(255, 255, 255, 0.035);
}
.activity-redesign-filters button.is-active { border-color: var(--activity-gold); color: #211707; background: var(--activity-gold); font-weight: 800; }

.activity-redesign-result-count {
  min-height: 36px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #a99f91;
  font-size: 0.88rem;
}
.activity-redesign-result-count button {
  border: 0;
  color: var(--activity-gold);
  background: transparent;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.activity-redesign-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
.activity-redesign-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(232, 201, 109, 0.18);
  border-radius: 22px;
  background: linear-gradient(155deg, rgba(30, 26, 20, 0.98), rgba(13, 12, 10, 0.98));
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.22);
  transition: transform 180ms ease, border-color 180ms ease;
}
.activity-redesign-card:hover { transform: translateY(-4px); border-color: rgba(232, 201, 109, 0.48); }
.activity-redesign-media { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: linear-gradient(140deg, #3b2d1c, #12100c); }
.activity-redesign-media::after { content: ''; position: absolute; inset: 42% 0 0; background: linear-gradient(transparent, rgba(21, 18, 14, 0.96)); pointer-events: none; }
.activity-redesign-media img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform 500ms ease; }
.activity-redesign-card:hover .activity-redesign-media img { transform: scale(1.035); }
.activity-redesign-media.image-fallback::before { content: 'Matera da Vivere'; position: absolute; inset: 0; display: grid; place-items: center; color: rgba(232, 201, 109, 0.58); font-family: Georgia, serif; }

.activity-redesign-category { position: absolute; z-index: 2; top: 14px; left: 14px; padding: 7px 10px; border: 1px solid rgba(232, 201, 109, 0.48); border-radius: 999px; color: #f4dfa0; background: rgba(9, 8, 6, 0.76); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; }
.activity-redesign-favorite { position: absolute; z-index: 3; top: 12px; right: 12px; width: 46px; height: 46px; display: grid; place-items: center; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; color: #fff; background: rgba(8, 7, 5, 0.78); font-size: 1.45rem; }
.activity-redesign-favorite.is-active { border-color: var(--activity-gold); color: #241807; background: var(--activity-gold); }

.activity-redesign-card-body { padding: 18px; }
.activity-redesign-card h2 { margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.45rem, 3vw, 1.85rem); font-weight: 500; line-height: 1.08; }
.activity-redesign-summary { min-height: 3.1em; margin: 0 0 16px; color: #c9c0b4; line-height: 1.55; }
.activity-redesign-facts { display: flex; flex-wrap: wrap; gap: 8px 14px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.09); color: #ddd4c7; font-size: 0.85rem; }
.activity-redesign-facts strong { margin-left: auto; color: var(--activity-gold); }

.activity-redesign-contact { display: grid; gap: 12px; padding: 16px 0; }
.activity-redesign-contact p { margin: 0; display: grid; grid-template-columns: 24px 1fr; gap: 8px; color: var(--activity-gold); }
.activity-redesign-contact p > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 2px; color: #eee5d8; line-height: 1.35; }
.activity-redesign-contact small { color: #91887b; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
.activity-redesign-contact a { color: #fff; text-decoration: none; }

.activity-redesign-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.activity-redesign-actions a { min-height: 46px; padding: 0 12px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: 850; text-decoration: none; }
.activity-redesign-map-link { border: 1px solid rgba(232, 201, 109, 0.42); color: #f3dfa1; background: rgba(232, 201, 109, 0.05); }
.activity-redesign-call-link { border: 1px solid var(--activity-gold); color: #201605; background: var(--activity-gold); }

.activity-redesign-empty { padding: 58px 22px; border: 1px dashed rgba(232, 201, 109, 0.3); border-radius: 22px; text-align: center; background: rgba(255, 255, 255, 0.025); }
.activity-redesign-empty > span { color: var(--activity-gold); font-size: 1.5rem; }
.activity-redesign-empty h2 { margin: 12px 0 8px; font-family: Georgia, serif; font-weight: 500; }
.activity-redesign-empty p { margin: 0 auto 20px; max-width: 460px; color: #aaa195; }
.activity-redesign-empty button { min-height: 44px; padding: 0 18px; border: 1px solid var(--activity-gold); border-radius: 999px; color: #201605; background: var(--activity-gold); font-weight: 800; }

.activity-redesign-page :is(button, a, input):focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

@media (min-width: 640px) {
  .activity-redesign-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .activity-redesign-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .activity-redesign-page { padding: 126px 16px 58px; }
  .activity-redesign-hero { align-items: flex-start; flex-direction: column; margin-bottom: 24px; }
  .activity-redesign-hero h1 { font-size: clamp(2.75rem, 15vw, 4.25rem); }
  .activity-redesign-saved { align-self: flex-start; }
  .activity-redesign-filters { flex-wrap: nowrap; margin-inline: -16px; padding-inline: 16px; overflow-x: auto; scrollbar-width: none; }
  .activity-redesign-filters::-webkit-scrollbar { display: none; }
  .activity-redesign-filters button { flex: 0 0 auto; min-height: 44px; }
  .activity-redesign-card-body { padding: 18px 16px 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .activity-redesign-card,
  .activity-redesign-media img { transition: none; }
}
```

- [ ] **Step 5: Register only the new route**

In `src/App.jsx`, add the import immediately after `Activities`:

```jsx
import ActivitiesRedesign from './pages/ActivitiesRedesign/ActivitiesRedesign';
```

Add this route immediately after `/attivita` and before `/prova`:

```jsx
<Route path="/esplora-attivita-nuova" element={<ActivitiesRedesign />} />
```

Do not edit `Navbar.jsx`, the `/prova` route, or the existing `Activities` import.

- [ ] **Step 6: Verify GREEN in the browser**

With `npm run dev` running, open `http://localhost:5173/esplora-attivita-nuova` and verify:

- at `390x844`: one card per row, no horizontal page overflow, phone/location visible, buttons at least `44px`;
- at `768x1024`: two cards per row;
- at `1440x900`: three cards per row;
- search `Jazzo Gattini` leaves only Trekking Murgia Materana;
- filter `Sapori` leaves only Laboratorio del Pane IGP;
- heart updates the counter and survives reload;
- `Salvate` filters correctly, including the empty state;
- `Indicazioni` contains `destination=lat,lng` and opens HTTPS Google Maps;
- `Chiama ora` has a normalized `tel:` href;
- `/prova` still renders the existing HUD unchanged.

- [ ] **Step 7: Run automated verification**

Run:

```bash
node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js
npx eslint src/pages/ActivitiesRedesign/activitiesData.js src/pages/ActivitiesRedesign/activityExplorerUtils.js src/pages/ActivitiesRedesign/activityExplorerUtils.test.js src/pages/ActivitiesRedesign/ActivityCard.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/App.jsx
npm run build
git diff --check
```

Expected:

- `6` tests pass and `0` fail;
- targeted ESLint exits `0` with no new errors;
- Vite build exits `0`;
- `git diff --check` prints nothing.

- [ ] **Step 8: Commit Task 2 only**

```bash
git add src/pages/ActivitiesRedesign/ActivityCard.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.css src/App.jsx
git commit -m "feat: add simple activity explorer page"
```

---

## Final Verification Checklist

- [ ] Read `docs/superpowers/specs/2026-07-22-esplora-attivita-semplice-design.md` and confirm every acceptance criterion is covered.
- [ ] Run the complete commands from Task 2 Step 7 with fresh output.
- [ ] Inspect `git status --short` and confirm unrelated `package-lock.json` and RouteMapbox changes were not staged or altered.
- [ ] Confirm the current menu still points “Esplora Attività” to `/prova`.
- [ ] Report the new comparison URL `/esplora-attivita-nuova` to the user.
