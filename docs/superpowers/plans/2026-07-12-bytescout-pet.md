# ByteScout Pet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creare, validare e confezionare ByteScout come pet Codex v2 animato, riconoscibile come scout-programmatore.

**Architecture:** Il workflow Hatch Pet prepara prompt e guide, genera una base canonica e strisce di pose tramite Imagegen, quindi usa gli script deterministici della skill per estrazione, registrazione, trasparenza, composizione e validazione. Il risultato viene conservato nel workspace e, dopo tutti i gate QA, installato nella cartella personale dei pet Codex.

**Tech Stack:** Hatch Pet, Imagegen integrato, Python/Pillow del runtime Codex, `jq`, WebP/PNG, manifest JSON Codex v2.

## Global Constraints

- Nome pet: `ByteScout`.
- Stile: 3D toy morbido, proporzioni compatte e silhouette leggibile in celle 192×208.
- Uniforme celeste, pantaloni neri, fazzolettone verde.
- Zaino tecnico e piccolo laptop senza scritte, con il solo simbolo `</>` come dettaglio di programmazione.
- Nessun logo, scenario, ombra, scia, guida visibile o effetto staccato.
- Atlante finale esatto: 1536×2288, 8 colonne × 11 righe, `spriteVersionNumber: 2`.
- Ogni visuale generata usa Imagegen; gli script locali svolgono soltanto elaborazioni deterministiche.
- Cartella di lavoro: `/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet`.

---

### Task 1: Preparazione della run

**Files:**
- Create: `artifacts/bytescout-pet/pet_request.json`
- Create: `artifacts/bytescout-pet/imagegen-jobs.json`
- Create: `artifacts/bytescout-pet/prompts/`
- Create: `artifacts/bytescout-pet/references/layout-guides/`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-12-bytescout-pet-design.md`.
- Produces: manifest dei job con dipendenze, prompt e percorsi di output.

- [ ] **Step 1: Caricare il runtime workspace**

Usare `codex_app__load_workspace_dependencies` e salvare l'eseguibile Python restituito come `PYTHON` per tutti i comandi successivi.

- [ ] **Step 2: Preparare la run**

```bash
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/prepare_pet_run.py" \
  --pet-name "ByteScout" \
  --description "Uno scout-programmatore curioso e affidabile, pronto a esplorare e risolvere problemi." \
  --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet" \
  --pet-notes "Giovane scout umanoide 3D toy: uniforme celeste, pantaloni neri, fazzolettone verde, zaino tecnico aderente e piccolo laptop senza scritte con simbolo </>; palette secondaria color tufo, silhouette compatta." \
  --style-preset 3d-toy \
  --style-notes "Morbido e amichevole, testa leggermente grande, dettagli robusti e leggibili a 192x208; nessun logo, testo, scenario, ombra o effetto staccato." \
  --force
```

Expected: `pet_request.json` e `imagegen-jobs.json` esistono e il primo job pronto è `base`.

- [ ] **Step 3: Verificare manifest e prompt**

```bash
jq '.jobs[] | {id, kind, status, depends_on, input_images, output_path}' /Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/imagegen-jobs.json
```

Expected: base, nove righe standard, cardinals e due righe look sono presenti con dipendenze coerenti.

### Task 2: Base canonica e pose standard

**Files:**
- Create: `artifacts/bytescout-pet/decoded/base.png`
- Create: `artifacts/bytescout-pet/references/canonical-base.png`
- Create: `artifacts/bytescout-pet/decoded/{idle,running-right,running-left,waving,jumping,failed,waiting,running,review}.png`
- Create: `artifacts/bytescout-pet/qa/rows/*/review.json`

**Interfaces:**
- Consumes: job pronti in `imagegen-jobs.json`, prompt e guide di layout.
- Produces: base canonica e nove strisce validate, pronte per l'atlante standard.

- [ ] **Step 1: Generare e approvare la base**

Inviare il job `base` a un worker Imagegen isolato. Copiare l'output scelto in `decoded/base.png` e `references/canonical-base.png`, poi segnare il job completo nel manifest.

Expected: un solo ByteScout intero e centrato su chroma uniforme, con identità, colori e accessori conformi.

- [ ] **Step 2: Generare idle e running-right**

Inviare un job per worker, allegando esattamente le immagini elencate nel manifest. Dopo la copia in `decoded/`, eseguire per ogni riga:

```bash
ROW="idle"
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/extract_strip_frames.py" --decoded-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded" --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/frames" --states "$ROW" --method auto
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/inspect_frames.py" --frames-root "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/frames" --json-out "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/review.json" --states "$ROW" --require-components

ROW="running-right"
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/extract_strip_frames.py" --decoded-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded" --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/frames" --states "$ROW" --method auto
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/inspect_frames.py" --frames-root "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/frames" --json-out "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/rows/$ROW/review.json" --states "$ROW" --require-components
```

Expected: nessun errore di estrazione, clipping o componenti staccati.

- [ ] **Step 3: Creare running-left**

Se laptop, zaino, simbolo e illuminazione restano semanticamente corretti dopo il ribaltamento, derivare la riga con:

```bash
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/derive_running_left_from_running_right.py" --run-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet" --confirm-appropriate-mirror --decision-note "Il ribaltamento conserva identità, accessori e cadenza direzionale di ByteScout."
```

Altrimenti generare `running-left` con Imagegen come riga indipendente.

- [ ] **Step 4: Generare e validare le altre sei righe**

Generare `waving`, `jumping`, `failed`, `waiting`, `running` e `review` con worker separati, massimo tre in parallelo, e ripetere estrazione e ispezione incrementale.

Expected: tutte le nove righe sono complete nel manifest e ogni review riga è priva di errori.

- [ ] **Step 5: Assemblare e rivedere l'atlante standard**

```bash
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/extract_strip_frames.py" --decoded-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded" --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/frames" --states all --method auto
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/inspect_frames.py" --frames-root "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/frames" --json-out "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/review.json" --require-components
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/compose_atlas.py" --frames-root "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/frames" --output "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/final/spritesheet.png" --webp-output "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/final/spritesheet.webp"
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/make_contact_sheet.py" "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/final/spritesheet.webp" --output "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/contact-sheet.png"
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/render_animation_previews.py" --frames-root "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/frames" --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/previews"
```

Expected: atlante 8×9 intermedio, contact sheet e GIF coerenti senza salti di scala o identità.

### Task 3: Direzioni dello sguardo

**Files:**
- Create: `artifacts/bytescout-pet/qa/look-mechanics.md`
- Create: `artifacts/bytescout-pet/decoded/look-anchors-approved.png`
- Create: `artifacts/bytescout-pet/decoded/look-row-9.png`
- Create: `artifacts/bytescout-pet/decoded/look-row-10.png`
- Create: `artifacts/bytescout-pet/qa/look-row-9-registration.json`

**Interfaces:**
- Consumes: base canonica e atlante standard approvato.
- Produces: sedici pose direzionali registrate con cardinals inequivocabili.

- [ ] **Step 1: Scrivere la meccanica dello sguardo**

Definire occhi e sopracciglia come guida, testa/collo come seguito contenuto, busto e piedi ancorati, fazzolettone con lieve inerzia e zaino/laptop solidali al corpo con occlusione progressiva. Specificare per 000/090/180/270 quali lati del volto e degli accessori diventano visibili.

- [ ] **Step 2: Generare ed estrarre i quattro cardinals**

Generare `look-cardinals`, quindi eseguire:

```bash
CHROMA_KEY=$(jq -r '.chroma_key.hex' /Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/pet_request.json)
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/extract_cardinal_anchors.py" --strip "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded/look-cardinals.png" --output-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded/look-anchors" --chroma-key "$CHROMA_KEY" --json-out "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/cardinal-anchors.json"
"$PYTHON" "$HOME/.codex/skills/hatch-pet/scripts/compose_cardinal_anchor_strip.py" --anchors-dir "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded/look-anchors" --output "/Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/decoded/look-anchors-approved.png"
```

Expected: 000 su, 090 destra schermo, 180 giù e 270 sinistra schermo sono inequivocabili.

- [ ] **Step 3: Generare e registrare la riga 9**

Generare insieme 000–157.5 usando cardinals e riferimenti approvati, poi registrare con `assemble_extended_atlas.py --look-row-9` e gli output `qa/look-row-9-registered.png` e `qa/look-row-9-registration.json`.

Expected: otto gruppi separati, scala/baseline condivise e nessun errore ai bordi.

- [ ] **Step 4: Generare la riga 10**

Solo dopo il pass della riga 9, generare insieme 180–337.5 usando anche la riga 9 completata come continuità.

Expected: movimento orario continuo, nessuna inversione, salto o cambio di identità.

### Task 4: Atlante v2 e QA indipendente

**Files:**
- Create: `artifacts/bytescout-pet/final/spritesheet-extended.webp`
- Create: `artifacts/bytescout-pet/final/validation-extended.json`
- Create: `artifacts/bytescout-pet/qa/contact-sheet-extended.png`
- Create: `artifacts/bytescout-pet/qa/look-directions.png`
- Create: `artifacts/bytescout-pet/qa/direction-semantics.json`
- Create: `artifacts/bytescout-pet/qa/direction-blind-validation.json`
- Create: `artifacts/bytescout-pet/qa/look-continuity.json`

**Interfaces:**
- Consumes: atlante standard, riga 9 registrata e riga 10 approvata.
- Produces: atlante v2 pulito e pacchetto di prove QA.

- [ ] **Step 1: Assemblare, pulire e validare**

Eseguire `assemble_extended_atlas.py` con la chiave chroma della run, poi una sola esecuzione di `despill_chroma_edges.py`, quindi `validate_atlas.py --require-v2`.

Expected: WebP 1536×2288, despill `ok: true`, validazione v2 `ok: true`.

- [ ] **Step 2: Creare gli artefatti QA**

Generare contact sheet esteso, foglio direzioni etichettato, sfida cieca A/B e misura di continuità con gli script Hatch Pet dedicati.

Expected: tutti i file QA richiesti esistono e contengono sedici direzioni.

- [ ] **Step 3: Eseguire tre revisioni cieche isolate**

Assegnare `qa/direction-blind-pairs.png` a tre worker senza contesto, salvare i verdetti separati, combinarli a maggioranza e validarli contro la chiave nascosta.

Expected: entrambi i confronti cardinali passano; eventuali incertezze intermedie sono documentate come warning.

- [ ] **Step 4: Eseguire il QA visivo finale**

Un worker indipendente controlla contact sheet, sedici direzioni, preview GIF, semantica, continuità e validazione strutturale.

Expected: `visual_qa=pass`, nessuna direzione con verdict `fail`, `qa/review.json` senza errori.

### Task 5: Confezionamento e consegna

**Files:**
- Create outside workspace after approval: `~/.codex/pets/bytescout/pet.json`
- Create outside workspace after approval: `~/.codex/pets/bytescout/spritesheet.webp`
- Create: `artifacts/bytescout-pet/qa/run-summary.json`

**Interfaces:**
- Consumes: atlante v2 e QA finale passati.
- Produces: ByteScout installato e un riepilogo verificabile nel workspace.

- [ ] **Step 1: Installare il pet**

Copiare l'atlante approvato in `~/.codex/pets/bytescout/spritesheet.webp` e creare:

```json
{
  "id": "bytescout",
  "displayName": "ByteScout",
  "description": "Uno scout-programmatore curioso e affidabile, pronto a esplorare e risolvere problemi.",
  "spriteVersionNumber": 2,
  "spritesheetPath": "spritesheet.webp"
}
```

- [ ] **Step 2: Scrivere il riepilogo della run**

Creare `qa/run-summary.json` con `ok: true` e i percorsi di atlante, validazione, despill, contact sheet, direzioni, semantica, blind QA, continuità, review e pacchetto installato.

- [ ] **Step 3: Verificare la consegna**

```bash
jq '.spriteVersionNumber == 2 and .id == "bytescout"' "$HOME/.codex/pets/bytescout/pet.json"
file "$HOME/.codex/pets/bytescout/spritesheet.webp"
jq '.ok' /Users/admin/Desktop/MateraDaVivere/artifacts/bytescout-pet/qa/run-summary.json
```

Expected: i tre controlli restituiscono rispettivamente `true`, un'immagine WebP valida e `true`.
