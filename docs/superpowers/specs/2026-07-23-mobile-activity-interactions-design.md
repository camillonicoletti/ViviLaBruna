# Interazioni mobile per Esplora Attività

## Obiettivo

Rendere più immediata l’apertura delle esperienze e garantire che i controlli essenziali del video siano sempre riconoscibili e utilizzabili su iPhone.

La modifica riguarda soltanto la visualizzazione mobile fino a 760 px. Il comportamento desktop resta invariato.

## Card apribile

- Un tap su qualsiasi area libera della card apre lo stesso dettaglio del pulsante “Scopri l’esperienza”.
- Il cuore continua esclusivamente ad aggiungere o rimuovere l’attività dai preferiti.
- Il numero di telefono continua ad aprire la chiamata e non deve aprire il dettaglio.
- Il pulsante “Scopri l’esperienza” resta visibile e mantiene il comportamento attuale.
- La card mostra un cursore coerente con un elemento interattivo soltanto nella vista mobile.

## Controlli video mobile

- Nel dettaglio mobile i controlli nativi del browser vengono disabilitati.
- Una barra personalizzata resta sempre visibile nella parte inferiore del video.
- La barra contiene tre azioni: Play/Pausa, Audio attivo/Disattivato e Tutto schermo.
- Le azioni usano pulsanti circolari con superficie scura trasparente, bordo e icone oro.
- Il controllo audio alterna `muted` perché su iPhone il livello del volume è gestito dal dispositivo.
- Il controllo Tutto schermo usa `requestFullscreen` quando disponibile e `webkitEnterFullscreen` come fallback Safari iOS.
- Il video torna a occupare l’intera altezza del contenitore, senza la fascia superiore da 64 px.
- Su desktop il video conserva i controlli nativi e il layout attuale.
- L’etichetta “Video esperienza” viene rimossa dal dettaglio.

## Pulsante di chiusura

- Il carattere tipografico `×` viene sostituito da un’icona SVG composta da due linee perfettamente centrate.
- Il pulsante usa fondo scuro, bordo oro e icona oro, con contrasto elevato e area tattile di 48 px.
- Rimane fisso in alto a destra durante lo scorrimento del dettaglio, separato dalla barra dei controlli posizionata in basso.
- Su mobile non riceve automaticamente il focus all’apertura, evitando l’anello bianco persistente visto su iPhone; su desktop mantiene il focus iniziale per l’accessibilità da tastiera.

## Gestione degli errori

- Un eventuale rifiuto dell’avvio del video non deve trasformare un’interruzione temporanea in un errore permanente.
- Se l’avvio o la pausa non sono disponibili, il pulsante conserva uno stato coerente con l’evento reale del video.
- Se nessuna API fullscreen è disponibile, il relativo pulsante viene disabilitato.

## Verifica

- Test unitari per distinguere il tap sulla superficie della card dai tap su pulsanti e link.
- Test unitari per scegliere l’API fullscreen standard o il fallback Safari.
- Verifica reale a 390 × 844 px:
  - tap sul corpo della card apre il dettaglio;
  - cuore e telefono mantengono la propria azione;
  - i controlli nativi non sono presenti;
  - Play/Pausa, Audio e Tutto schermo sono visibili in basso nel video;
  - i pulsanti aggiornano lo stato visivo dopo l’interazione;
  - l’etichetta “Video esperienza” non è presente;
  - la X è centrata e resta fissa durante lo scroll;
  - il desktop conserva layout e comportamento attuali.
- Esecuzione dei test della pagina, lint mirato e build di produzione.
