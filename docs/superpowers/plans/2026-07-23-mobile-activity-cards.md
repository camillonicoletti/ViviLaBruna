# Mobile Activity Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the redesigned activity cards and detail panel behave as a mobile-first video experience below 760 px without changing the desktop layout.

**Architecture:** A pure playback-policy helper decides whether an in-viewport mobile card may autoplay. `ActivityMedia` observes its own visibility and applies that policy, while the existing page/card/dialog components change only their mobile presentation and controls.

**Tech Stack:** React 18, IntersectionObserver, matchMedia, CSS media queries, Node `node:test`, Vite 5.

## Global Constraints

- Apply layout changes only below 760 px.
- Use `/matera_tramonto.mp4` for every card and retain each activity image as fallback.
- Autoplay is muted and stops outside the viewport.
- Keep search, filters, favorites, phone, directions, dialog Escape behavior, and focus return unchanged.
- Add no dependencies.

---

### Task 1: Mobile playback policy and card autoplay

**Files:**
- Create: `src/pages/ActivitiesRedesign/activityMediaPolicy.js`
- Create: `src/pages/ActivitiesRedesign/activityMediaPolicy.test.js`
- Modify: `src/pages/ActivitiesRedesign/ActivityMedia.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivityCard.jsx`

**Interfaces:**
- Produces: `shouldAutoplayActivityMedia({ isMobile, isVisible, reduceMotion }) -> boolean`.
- Produces: `ActivityMedia` prop `autoplayWhenVisible`.

- [ ] **Step 1: Write the failing policy test**

```js
test('autoplay parte soltanto per un video mobile visibile', () => {
  assert.equal(shouldAutoplayActivityMedia({ isMobile: true, isVisible: true, reduceMotion: false }), true);
  assert.equal(shouldAutoplayActivityMedia({ isMobile: true, isVisible: false, reduceMotion: false }), false);
  assert.equal(shouldAutoplayActivityMedia({ isMobile: false, isVisible: true, reduceMotion: false }), false);
  assert.equal(shouldAutoplayActivityMedia({ isMobile: true, isVisible: true, reduceMotion: true }), false);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test src/pages/ActivitiesRedesign/activityMediaPolicy.test.js`

Expected: FAIL because the module/function does not exist.

- [ ] **Step 3: Implement the policy**

```js
export function shouldAutoplayActivityMedia({ isMobile = false, isVisible = false, reduceMotion = false } = {}) {
  return Boolean(isMobile && isVisible && !reduceMotion);
}
```

- [ ] **Step 4: Integrate visibility playback**

`ActivityMedia` reads `(max-width: 760px)` and `(prefers-reduced-motion: reduce)`, observes its wrapper at threshold `0.6`, and combines `active || shouldAutoplayActivityMedia(...)` before calling `video.play()` or `video.pause()`. Card instances pass `autoplayWhenVisible`; dialog instances do not. On mobile autoplay cards, omit the poster so the first video frame replaces the static image immediately.

- [ ] **Step 5: Remove the card video badge and replace contact glyphs**

Delete `.activity-redesign-media-status` markup from `ActivityCard`. Use inline SVG pin and smartphone icons with `aria-hidden="true"` for location and telephone.

- [ ] **Step 6: Run GREEN and commit**

Run: `node --test src/pages/ActivitiesRedesign/activityMediaPolicy.test.js`

Expected: 1 test passes.

Commit:

```bash
git add src/pages/ActivitiesRedesign/activityMediaPolicy.js src/pages/ActivitiesRedesign/activityMediaPolicy.test.js src/pages/ActivitiesRedesign/ActivityMedia.jsx src/pages/ActivitiesRedesign/ActivityCard.jsx
git commit -m "feat: autoplay visible activity videos on mobile"
```

### Task 2: Mobile favorites FAB and scrolling detail

**Files:**
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`

**Interfaces:**
- Consumes: existing `favoriteIds`, `favoritesOnly`, `toggleFavorite`, `ActivityMedia`.
- Preserves: existing desktop DOM behavior through CSS classes and the 760 px breakpoint.

- [ ] **Step 1: Restructure favorite controls**

Split the saved count into icon/count/label spans so CSS can turn it into a mobile circle while preserving the desktop label. Keep the desktop overlay favorite and add a separate mobile-only full-width favorite button inside dialog content.

- [ ] **Step 2: Add scroll hint and move close button**

Render a mobile-only `Scorri` hint with downward arrow inside the media above native controls. Make the close button a direct panel child so mobile CSS can keep it fixed at the upper-right in gold.

- [ ] **Step 3: Make the mobile detail one scrolling flow**

Below 760 px, make `.activity-detail-panel` the scroll container, use a single column, keep `.activity-detail-media` in normal flow, remove nested/sticky scrolling from content/actions, and add bottom safe-area spacing. Keep native video controls inside the media.

- [ ] **Step 4: Style the fixed saved button**

Below 760 px, position `.activity-redesign-saved` fixed at `right: 16px` and `bottom: calc(16px + env(safe-area-inset-bottom))`, size it to 64 px, and show the saved count as a small badge. Add page bottom padding so it cannot cover the final card actions.

- [ ] **Step 5: Verify**

Run:

```bash
node --test src/pages/ActivitiesRedesign/activityMediaPolicy.test.js src/pages/ActivitiesRedesign/activityExplorerUtils.test.js src/components/RouteMapbox/routeMapGesturePolicy.test.js
npx eslint src/pages/ActivitiesRedesign/ActivityMedia.jsx src/pages/ActivitiesRedesign/ActivityCard.jsx src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/pages/ActivitiesRedesign/activityMediaPolicy.js
npm run build
```

Expected: tests, lint, and build exit 0. Browser verification at 390 px confirms autoplay in viewport, pause outside viewport, scrolling video, gold close button, mobile favorite button, scroll hint, and no horizontal overflow. Recheck 1440 px to confirm desktop remains unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ActivitiesRedesign/ActivitiesRedesign.jsx src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx src/pages/ActivitiesRedesign/ActivitiesRedesign.css
git commit -m "feat: refine mobile activity cards and detail"
```
