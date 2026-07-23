# Card attività mobile — Design

## Ambito

La modifica riguarda soltanto la pagina `/esplora-attivita-nuova` sotto i 760 px. Il layout desktop resta invariato fino alla sua revisione dedicata.

## Preferiti

Il pulsante con il conteggio delle attività salvate viene rimosso dal flusso superiore su mobile e diventa un pulsante circolare fisso in basso a destra. Mostra un cuore e il numero salvato, resta sopra i contenuti e rispetta la safe area del dispositivo. Il tap conserva il comportamento esistente: attiva o disattiva la vista delle sole attività preferite.

## Card mobile

- Ogni card usa `/matera_tramonto.mp4` come video condiviso.
- L’immagine dell’attività resta poster e fallback, ma il video parte automaticamente, muto e in loop, quando la card entra nell’area visibile.
- Quando la card esce dall’area visibile il video si ferma, evitando di riprodurre contemporaneamente tutti i video fuori schermo.
- L’etichetta testuale `Video` e il relativo simbolo vengono rimossi dalla card.
- Il luogo usa un’icona pin in stile mappa.
- Il telefono usa un’icona smartphone moderna al posto del simbolo telefonico classico.
- Titolo, descrizione, durata, valutazione, prezzo, luogo, numero e pulsante `Scopri l’esperienza` restano immediatamente leggibili.

## Dettaglio mobile

Il dettaglio diventa un unico pannello verticale scorrevole. Video, testo, preferiti e azioni appartengono allo stesso flusso: scorrendo, il video sale e scompare insieme al resto del contenuto invece di rimanere ancorato.

- Il video resta in cima al pannello e i controlli nativi, inclusi volume e tutto schermo, rimangono dentro i suoi limiti.
- Il pulsante di chiusura è circolare, dorato e ben visibile in alto a destra.
- Il cuore sovrapposto al video viene rimosso.
- Sotto le informazioni compare un pulsante largo `Aggiungi ai preferiti` / `Rimuovi dai preferiti`.
- Sul fondo del video compare un suggerimento `Scorri` con freccia verso il basso, animato in modo discreto.
- `Indicazioni` e `Chiama ora` restano nel contenuto dopo i dettagli.

## Accessibilità e fallback

- L’autoplay rimane sempre muto.
- `prefers-reduced-motion` disabilita l’animazione della freccia, ma non impedisce all’utente di avviare il video.
- Se il video fallisce, viene mostrata l’immagine specifica dell’attività.
- Chiusura con `Escape`, focus di ritorno, link telefono e indicazioni restano invariati.
- Il pulsante fisso dei preferiti non deve coprire le azioni finali: la pagina riceve spazio inferiore aggiuntivo su mobile.

## Verifica

- Test unitario del criterio di autoplay mobile e del video condiviso.
- Verifica browser a 390 px: autoplay in viewport, pausa fuori viewport, nessun overflow orizzontale.
- Verifica del dettaglio: controlli dentro il video, video non sticky, X oro, pulsante preferiti e suggerimento di scorrimento.
- Test, lint e build completi.
