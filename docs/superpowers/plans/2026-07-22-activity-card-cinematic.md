# Cinematic Activity Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current cards on `/esplora-attivita-nuova` with cinematic media cards and an accessible responsive detail overlay.

**Architecture:** `ActivitiesRedesign` owns the active preview and selected activity. Focused components handle media playback/fallback (`ActivityMedia`), compact presentation (`ActivityCard`), and the responsive modal/bottom sheet (`ActivityDetailDialog`). Pure media-source selection remains in `activityExplorerUtils` so it can be covered with the existing Node test suite.

**Tech Stack:** React 18, CSS, Node `node:test`, Vite 5, existing activity data and URL helpers.

## Global Constraints

- Keep search, category filters, saved favorites, phone links, and directions working unchanged.
- Do not add a new dependency or remote service.
- Use existing images with cinematic motion because current activities have no dedicated video files.
- Support optional `video` and `videoPoster` fields without requiring them.
- Allow only one active preview at a time.
- Keep automatic video muted and respect `prefers-reduced-motion`.
- Preserve the current route and scroll/filter state when details open and close.

---

## File Map

- Create `src/pages/ActivitiesRedesign/ActivityMedia.jsx`: render optional video, image fallback, and playback state.
- Create `src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx`: accessible desktop dialog/mobile bottom sheet.
- Modify `src/pages/ActivitiesRedesign/activityExplorerUtils.js`: resolve valid media sources.
- Modify `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`: cover video, poster, and image fallback decisions.
- Modify `src/pages/ActivitiesRedesign/ActivityCard.jsx`: compact cinematic card and `Scopri` trigger.
- Modify `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`: active preview, selected activity, focus return.
- Modify `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`: card, motion, dialog, sheet, responsive and reduced-motion styles.

### Task 1: Media source contract

**Files:**
- Modify: `src/pages/ActivitiesRedesign/activityExplorerUtils.js`
- Test: `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

**Interfaces:**
- Produces: `resolveActivityMedia(activity) -> { image: string, video: string, poster: string }`
- Consumes: activity objects with optional `image`, `video`, and `videoPoster` strings.

- [ ] **Step 1: Write the failing media resolution test**

Add imports and assertions:

```js
import { resolveActivityMedia } from './activityExplorerUtils.js';

test('risolve video opzionale e fallback immagine', () => {
  assert.deepEqual(resolveActivityMedia({
    image: '/image.jpg', video: '/clip.mp4', videoPoster: '/poster.jpg'
  }), {
    image: '/image.jpg', video: '/clip.mp4', poster: '/poster.jpg'
  });
  assert.deepEqual(resolveActivityMedia({ image: '/image.jpg' }), {
    image: '/image.jpg', video: '', poster: '/image.jpg'
  });
  assert.deepEqual(resolveActivityMedia({ image: '/image.jpg', video: '  ' }), {
    image: '/image.jpg', video: '', poster: '/image.jpg'
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

Expected: FAIL because `resolveActivityMedia` is not exported.

- [ ] **Step 3: Implement the pure resolver**

```js
export function resolveActivityMedia(activity = {}) {
  const image = typeof activity.image === 'string' ? activity.image.trim() : '';
  const video = typeof activity.video === 'string' ? activity.video.trim() : '';
  const suppliedPoster = typeof activity.videoPoster === 'string'
    ? activity.videoPoster.trim()
    : '';
  return { image, video, poster: suppliedPoster || image };
}
```

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

Expected: 7 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ActivitiesRedesign/activityExplorerUtils.js src/pages/ActivitiesRedesign/activityExplorerUtils.test.js
git commit -m "test: define cinematic activity media fallback"
```

### Task 2: Cinematic card and reusable media

**Files:**
- Create: `src/pages/ActivitiesRedesign/ActivityMedia.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivityCard.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`

**Interfaces:**
- Consumes: `resolveActivityMedia(activity)` from Task 1.
- Produces: `ActivityMedia({ activity, active, className, controls = false })` and `ActivityCard({ activity, isFavorite, previewActive, onPreviewChange, onOpen, onToggleFavorite })`.

- [ ] **Step 1: Create `ActivityMedia` with video/image fallback**

Implement a component that:

```jsx
const media = resolveActivityMedia(activity);
const [videoFailed, setVideoFailed] = useState(false);
const [imageFailed, setImageFailed] = useState(false);
const videoRef = useRef(null);
const showVideo = Boolean(media.video) && !videoFailed;

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  if (active) video.play().catch(() => setVideoFailed(true));
  else { video.pause(); video.currentTime = 0; }
}, [active, showVideo]);
```

Render a muted looping `video` with `preload="metadata"`, `playsInline`, and the resolved poster when available. Expose native controls only when the `controls` prop is true, so audio can be enabled voluntarily in the expanded detail. Render the current image when no video is available or playback fails. Preserve the text fallback when the image also fails.

- [ ] **Step 2: Replace compact card presentation**

Use `ActivityMedia` inside `ActivityCard`, call `onPreviewChange(activity.id)` on pointer/focus entry and `onPreviewChange(null)` on exit, and render a `Scopri` button that calls:

```jsx
onOpen(activity, event.currentTarget)
```

Keep the favorite button independent with `event.stopPropagation()`. Keep category, title, summary, duration, rating, price, and location visible; move phone and directions into the expanded detail.

- [ ] **Step 3: Add cinematic card styles**

Update the card CSS to provide:

```css
.activity-redesign-media img,
.activity-redesign-media video { width:100%; height:100%; object-fit:cover; }
.activity-redesign-card:hover .activity-redesign-media img,
.activity-redesign-card:focus-within .activity-redesign-media img {
  transform:scale(1.075) translate3d(1.2%,-1%,0);
}
.activity-redesign-discover { min-height:46px; border-radius:12px; background:var(--activity-gold); }
@media (prefers-reduced-motion: reduce) {
  .activity-redesign-media img,
  .activity-redesign-media video { animation:none; transition:none; }
}
```

Also add visible media badges, a subtle play indicator, and responsive touch-safe controls.

- [ ] **Step 4: Verify component lint and build**

Run: `npx eslint src/pages/ActivitiesRedesign/ActivityMedia.jsx src/pages/ActivitiesRedesign/ActivityCard.jsx`

Expected: exit 0.

Run: `npm run build`

Expected: Vite build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ActivitiesRedesign/ActivityMedia.jsx src/pages/ActivitiesRedesign/ActivityCard.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.css
git commit -m "feat: add cinematic activity cards"
```

### Task 3: Responsive accessible activity detail

**Files:**
- Create: `src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`

**Interfaces:**
- Consumes: `ActivityMedia`, `buildDirectionsUrl`, `buildTelephoneHref`.
- Produces: `ActivityDetailDialog({ activity, isFavorite, onClose, onToggleFavorite })`.

- [ ] **Step 1: Build dialog behavior**

Create a portal-free overlay directly under the page component. Apply `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` using the activity ID. On mount, focus the close button, lock only `document.body.style.overflow`, and install an `Escape` listener. Restore the original body overflow and remove the listener on cleanup.

The backdrop closes only when `event.target === event.currentTarget`. The inner panel stops propagation. Render `ActivityMedia` with `active` and `controls`, all approved facts, favorite control, phone, directions, and sticky actions.

- [ ] **Step 2: Integrate selected activity and focus return**

Add state and a ref in `ActivitiesRedesign`:

```jsx
const [activePreviewId, setActivePreviewId] = useState(null);
const [selectedActivity, setSelectedActivity] = useState(null);
const detailTriggerRef = useRef(null);

const openActivity = (activity, trigger) => {
  detailTriggerRef.current = trigger;
  setActivePreviewId(null);
  setSelectedActivity(activity);
};

const closeActivity = () => {
  setSelectedActivity(null);
  requestAnimationFrame(() => detailTriggerRef.current?.focus());
};
```

Pass preview/open props to every card and render one `ActivityDetailDialog` when `selectedActivity` is not null.

- [ ] **Step 3: Add overlay and bottom-sheet CSS**

Desktop uses a centered two-column panel with media left and details right. At `max-width: 760px`, switch to a near-full-screen bottom sheet with media above, scrollable content, and `.activity-detail-actions` sticky at the bottom. Include backdrop blur, safe-area bottom padding, visible focus styles, reduced motion, and a `max-height: calc(100dvh - 24px)` guard.

- [ ] **Step 4: Run complete verification**

Run: `node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js src/components/RouteMapbox/routeMapGesturePolicy.test.js`

Expected: 9 tests pass, 0 fail.

Run: `npx eslint src/pages/ActivitiesRedesign/ActivityMedia.jsx src/pages/ActivitiesRedesign/ActivityCard.jsx src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/pages/ActivitiesRedesign/activityExplorerUtils.js`

Expected: exit 0.

Run: `npm run build`

Expected: Vite build completes successfully.

Use the local browser at 390, 768, and 1440 pixels and verify: card motion, `Scopri`, close button, `Escape`, focus return, favorite persistence, phone link, directions link, and no horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.css
git commit -m "feat: add cinematic activity detail overlay"
```
