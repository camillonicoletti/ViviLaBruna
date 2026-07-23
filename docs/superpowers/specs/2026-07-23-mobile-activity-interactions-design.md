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

- Il dettaglio conserva esclusivamente i controlli nativi del browser; non vengono aggiunti controlli personalizzati.
- Su iPhone i singoli controlli nativi non possono essere riposizionati con CSS. Per renderli visibili, il fotogramma video viene fatto iniziare 64 px più in basso rispetto al bordo superiore del contenitore.
- Lo spazio superiore diventa una fascia scura di sicurezza per la barra di stato e il pulsante di chiusura.
- Altezza e proporzioni complessive del blocco video restano coerenti con l’attuale dettaglio mobile.
- Su desktop il video mantiene posizione e dimensioni attuali.
- L’etichetta “Video esperienza” viene rimossa dal dettaglio.

## Pulsante di chiusura

- Il carattere tipografico `×` viene sostituito da un’icona SVG composta da due linee perfettamente centrate.
- Il pulsante usa fondo scuro, bordo oro e icona oro, con contrasto elevato e area tattile di 48 px.
- Rimane fisso in alto a destra, dentro la fascia di sicurezza, durante lo scorrimento del dettaglio.
- Su mobile non riceve automaticamente il focus all’apertura, evitando l’anello bianco persistente visto su iPhone; su desktop mantiene il focus iniziale per l’accessibilità da tastiera.

## Gestione degli errori

- Un eventuale rifiuto dell’avvio del video non deve trasformare un’interruzione temporanea in un errore permanente.
- Volume e schermo intero restano gestiti dal browser, rispettando automaticamente le restrizioni di Safari iOS.

## Verifica

- Test unitari per distinguere il tap sulla superficie della card dai tap su pulsanti e link.
- Verifica reale a 390 × 844 px:
  - tap sul corpo della card apre il dettaglio;
  - cuore e telefono mantengono la propria azione;
  - i controlli nativi superiori risultano spostati 64 px più in basso;
  - l’etichetta “Video esperienza” non è presente;
  - la X è centrata e resta fissa durante lo scroll;
  - il desktop conserva layout e comportamento attuali.
- Esecuzione dei test della pagina, lint mirato e build di produzione.
