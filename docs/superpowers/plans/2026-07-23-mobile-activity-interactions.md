# Mobile Activity Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere apribile l’intera card mobile e sostituire i controlli video Safari con una barra personalizzata, mantenendo etichetta rimossa e chiusura corretta.

**Architecture:** La decisione di apertura della card è isolata in una funzione pura testabile e usata dal componente soltanto sotto i 760 px. `ActivityMedia` resta proprietario del video e dei suoi stati play, mute e fullscreen: su mobile nasconde i controlli nativi e rende una barra personalizzata, mentre su desktop conserva il comportamento HTML5 attuale.

**Tech Stack:** React 18, CSS responsive, HTML5 video, Node test runner, ESLint, Vite.

## Global Constraints

- Le modifiche interattive e di layout delle card devono applicarsi soltanto fino a 760 px.
- I controlli nativi devono essere disabilitati soltanto nel dettaglio mobile.
- La barra mobile deve offrire Play/Pausa, Audio on/off e Tutto schermo.
- Il desktop deve conservare layout e apertura attuali.
- Il cuore e i link non devono aprire il dettaglio della card.

---

### Task 1: Apertura dell’intera card mobile

**Files:**
- Modify: `src/pages/ActivitiesRedesign/activityExplorerUtils.js`
- Modify: `src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`
- Modify: `src/pages/ActivitiesRedesign/ActivityCard.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`

**Interfaces:**
- Produces: `shouldOpenActivityCard({ isMobile: boolean, isInteractiveTarget: boolean }): boolean`
- Consumes: `onOpen(activity, trigger)` già fornita ad `ActivityCard`.

- [ ] **Step 1: Scrivere il test fallente**

```js
test('apre la card soltanto da mobile e fuori da pulsanti o link', () => {
  assert.equal(shouldOpenActivityCard({ isMobile: true, isInteractiveTarget: false }), true);
  assert.equal(shouldOpenActivityCard({ isMobile: true, isInteractiveTarget: true }), false);
  assert.equal(shouldOpenActivityCard({ isMobile: false, isInteractiveTarget: false }), false);
});
```

- [ ] **Step 2: Eseguire il test e verificare RED**

Run: `node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

Expected: FAIL perché `shouldOpenActivityCard` non è esportata.

- [ ] **Step 3: Implementare la policy e collegarla alla card**

```js
export function shouldOpenActivityCard({
  isMobile = false,
  isInteractiveTarget = false
} = {}) {
  return Boolean(isMobile && !isInteractiveTarget);
}
```

Nel click dell’articolo, leggere `matchMedia('(max-width: 760px)')`, ignorare i target dentro `button` o `a`, quindi chiamare `onOpen`. Aggiungere `cursor: pointer` alla card nella media query mobile.

- [ ] **Step 4: Eseguire il test e verificare GREEN**

Run: `node --test src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

Expected: tutti i test PASS.

### Task 2: Barra video mobile personalizzata

**Files:**
- Create: `src/pages/ActivitiesRedesign/activityVideoControls.js`
- Create: `src/pages/ActivitiesRedesign/activityVideoControls.test.js`
- Modify: `src/pages/ActivitiesRedesign/ActivityMedia.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivityDetailDialog.jsx`
- Modify: `src/pages/ActivitiesRedesign/ActivitiesRedesign.css`

**Interfaces:**
- Produces: `canFullscreenActivityVideo(video): boolean`
- Produces: `enterActivityVideoFullscreen(video): Promise<boolean>`
- Produces: prop `customMobileControls: boolean` di `ActivityMedia`.

- [ ] **Step 1: Scrivere il test fallente per fullscreen**

```js
test('preferisce fullscreen standard e usa il fallback Safari', async () => {
  let standardCalls = 0;
  let safariCalls = 0;
  assert.equal(await enterActivityVideoFullscreen({
    requestFullscreen: async () => { standardCalls += 1; },
    webkitEnterFullscreen: () => { safariCalls += 1; }
  }), true);
  assert.equal(standardCalls, 1);
  assert.equal(safariCalls, 0);

  assert.equal(await enterActivityVideoFullscreen({
    webkitEnterFullscreen: () => { safariCalls += 1; }
  }), true);
  assert.equal(safariCalls, 1);
});
```

Run: `node --test src/pages/ActivitiesRedesign/activityVideoControls.test.js`

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 2: Implementare helper fullscreen**

```js
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
```

Run: `node --test src/pages/ActivitiesRedesign/activityVideoControls.test.js`

Expected: PASS.

- [ ] **Step 3: Collegare la barra al video**

In `ActivityMedia`, aggiungere `customMobileControls`, nascondere `controls` quando `isMobile` è vero e sincronizzare i pulsanti con `onPlay`, `onPause` e `onVolumeChange`. La barra usa tre pulsanti SVG con etichette accessibili e richiama `enterActivityVideoFullscreen`.

In `ActivityDetailDialog`, passare `customMobileControls={Boolean(activity.video)}`.

- [ ] **Step 4: Applicare lo stile mobile**

Rimuovere l’offset video da 64 px. Posizionare `.activity-video-controls` in basso al centro con sfondo scuro trasparente, icone oro e `z-index: 5`. Spostare il suggerimento “Scorri” sopra la barra.

- [ ] **Step 5: Verificare staticamente**

Run: `npx eslint src/pages/ActivitiesRedesign`

Expected: exit 0.

### Task 3: Verifica funzionale

**Files:**
- Verify: `src/pages/ActivitiesRedesign/*`

**Interfaces:**
- Consumes: pagina `/esplora-attivita-nuova`.
- Produces: evidenza desktop e mobile del comportamento richiesto.

- [ ] **Step 1: Eseguire test e build**

Run: `node --test src/pages/ActivitiesRedesign/activityMediaPolicy.test.js src/pages/ActivitiesRedesign/activityExplorerUtils.test.js`

Expected: tutti i test PASS.

Run: `node --test src/pages/ActivitiesRedesign/activityVideoControls.test.js`

Expected: tutti i test PASS.

Run: `npm run build`

Expected: build Vite completata con exit 0.

- [ ] **Step 2: Verificare a 390 × 844 px**

Controllare che:

- il tap sul corpo della prima card apra il dialog;
- cuore e telefono restino indipendenti;
- “Video esperienza” non esista nel DOM;
- il video abbia `controls === false`;
- la barra Play/Pausa, Audio e Tutto schermo sia visibile in basso;
- Play/Pausa e Audio aggiornino icona ed etichetta;
- la X SVG sia centrata e rimanga fissa durante lo scroll.

- [ ] **Step 3: Verificare il desktop**

A 1280 × 720 px confermare tre colonne, card non apribile dal corpo e video con controlli nativi.
