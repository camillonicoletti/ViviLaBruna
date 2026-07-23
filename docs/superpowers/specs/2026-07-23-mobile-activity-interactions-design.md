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

- Nel dettaglio vengono aggiunti due controlli personalizzati sovrapposti al video: volume e schermo intero.
- I controlli sono posizionati sotto l’area superiore riservata alla chiusura, così da non sovrapporsi alla Dynamic Island, alla barra di stato o alla X.
- Il pulsante volume alterna video silenziato e video con audio e comunica lo stato tramite icona e testo accessibile.
- Il pulsante schermo intero usa l’API standard quando disponibile e il fallback `webkitEnterFullscreen` previsto da Safari iOS.
- I controlli nativi del video restano disponibili, mentre quelli personalizzati garantiscono accesso immediato alle due azioni richieste.
- I controlli personalizzati sono nascosti su desktop.

## Pulsante di chiusura

- Il carattere tipografico `×` viene sostituito da un’icona SVG composta da due linee perfettamente centrate.
- Il pulsante usa fondo scuro, bordo oro e icona oro, con contrasto elevato e area tattile di 48 px.
- Rimane fisso in alto a destra durante lo scorrimento del dettaglio.
- Su mobile non riceve automaticamente il focus all’apertura, evitando l’anello bianco persistente visto su iPhone; su desktop mantiene il focus iniziale per l’accessibilità da tastiera.

## Gestione degli errori

- Se nessuna API per lo schermo intero è disponibile, il controllo non genera errori e resta un’azione neutra.
- Un eventuale rifiuto dell’avvio del video non deve trasformare un’interruzione temporanea in un errore permanente.
- Il cambio volume richiede un gesto esplicito dell’utente, compatibile con le restrizioni audio dei browser mobili.

## Verifica

- Test unitari per distinguere il tap sulla superficie della card dai tap su pulsanti e link.
- Test unitari per la selezione tra API fullscreen standard e fallback Safari.
- Verifica reale a 390 × 844 px:
  - tap sul corpo della card apre il dettaglio;
  - cuore e telefono mantengono la propria azione;
  - controlli volume e fullscreen risultano visibili sotto la X;
  - la X è centrata e resta fissa durante lo scroll;
  - il desktop conserva layout e comportamento attuali.
- Esecuzione dei test della pagina, lint mirato e build di produzione.
