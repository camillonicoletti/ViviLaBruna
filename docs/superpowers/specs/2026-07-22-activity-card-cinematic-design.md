# Card attività “Cinematic Reveal” — Design

## Obiettivo

Rendere le card della pagina `/esplora-attivita-nuova` più moderne e coinvolgenti senza perdere la semplicità della pagina: l’utente deve continuare a capire subito cosa farà, dove si trova l’attività, quanto costa, come salvarla e quale numero chiamare.

La direzione approvata è **A — Cinematic Reveal**: anteprima in movimento nella card e scheda dettagliata sovrapposta alla griglia.

## Card compatta

Ogni card mantiene sempre visibili:

- categoria e pulsante preferito;
- titolo dell’attività;
- durata, valutazione e prezzo;
- luogo;
- pulsante principale `Scopri`.

Il media usa due modalità equivalenti:

1. Se l’attività ha un video, la card mostra prima il poster e riproduce il video senza audio durante hover/focus su desktop o quando la card è sufficientemente visibile su dispositivi touch.
2. Se il video non è disponibile o non si carica, l’immagine esistente usa un movimento lento di zoom e traslazione.

Tutte le attività usano inizialmente il video condiviso `/matera_tramonto.mp4`, già presente in `public` e già impiegato nella precedente pagina Esplora Attività. L’immagine specifica di ogni attività resta il poster iniziale e il fallback in caso di errore. In futuro ogni attività potrà sostituire il video condiviso con un file dedicato senza modificare la card.

Un solo video può essere attivo per volta. Il media si ferma quando la card esce dall’area visibile, perde hover/focus o quando viene aperta un’altra attività. Con `prefers-reduced-motion` non parte alcun movimento automatico.

## Apertura dei dettagli

Il pulsante `Scopri` apre un layer sopra la pagina senza cambiare route. Ricerca, filtri, preferiti e posizione di scorrimento rimangono invariati.

### Desktop e tablet orizzontale

- Dialog centrato con larghezza massima controllata.
- Media grande a sinistra e dettagli a destra.
- Pulsante di chiusura immediatamente riconoscibile.
- Azioni `Indicazioni` e `Chiama ora` sempre visibili nella parte inferiore dei dettagli.

### Mobile e tablet verticale

- Bottom sheet quasi a tutto schermo che sale dal basso.
- Media nella parte superiore e contenuto scorrevole sotto.
- Azioni `Indicazioni` e `Chiama ora` fissate in basso.
- Chiusura tramite pulsante; nessuna gesture obbligatoria.

Il dialog si chiude anche con `Escape` su tastiera o clic sullo sfondo. Alla chiusura, il focus torna al pulsante `Scopri` che lo aveva aperto.

## Contenuto della scheda espansa

La scheda contiene solo informazioni utili alla decisione:

- video o immagine in movimento;
- categoria, titolo e descrizione;
- durata, valutazione, recensioni e prezzo;
- luogo completo;
- numero telefonico cliccabile;
- indicazioni stradali;
- salvataggio nei preferiti;
- `Chiama ora` come azione primaria.

Non vengono aggiunti caroselli, prenotazioni, recensioni complete o altri passaggi in questa iterazione.

## Componenti e responsabilità

- `ActivityCard`: presenta la versione compatta e comunica quale anteprima attivare o quale attività aprire.
- `ActivityMedia`: gestisce poster, video opzionale, fallback immagine, stato di caricamento e movimento ridotto.
- `ActivityDetailDialog`: presenta i dettagli in dialog desktop o bottom sheet mobile, gestisce chiusura e focus.
- `ActivitiesRedesign`: conserva anteprima attiva, attività selezionata, filtri e preferiti e garantisce che sia attivo un solo media alla volta.
- Dati attività: aggiungono campi video opzionali (`video`, `videoPoster`) senza rendere obbligatorio un asset video.

Le funzioni esistenti per telefono e indicazioni continuano a generare i link. Nessun nuovo servizio remoto è necessario.

## Stati ed errori

- Video assente: usa l’immagine con movimento cinematografico.
- Video fallito: torna automaticamente all’immagine senza mostrare errori tecnici.
- Immagine fallita: conserva l’attuale fallback grafico “Matera da Vivere”.
- Link telefono o indicazioni non valido: l’azione non viene mostrata.
- JavaScript lento o media non ancora pronto: testo e azioni rimangono comunque disponibili.

## Accessibilità e prestazioni

- Il dettaglio usa semantica `dialog`, nome accessibile e gestione corretta del focus.
- Tutti i controlli rimangono utilizzabili da tastiera.
- Il video è sempre muto nell’anteprima; l’audio può essere attivato solo volontariamente nel dettaglio.
- Video con `preload="metadata"` e poster, senza scaricare in anticipo tutti i file completi.
- `prefers-reduced-motion` disabilita autoplay, zoom e transizioni non essenziali.
- Il blocco dello scroll riguarda soltanto la pagina dietro al dialog; il contenuto del dialog resta scorrevole.

## Verifica

- Test unitari per scelta video/fallback e stato del dettaglio.
- Test del dialog: apertura, chiusura, `Escape`, ritorno del focus e azioni telefono/mappe.
- Verifica browser a 390, 768 e 1440 pixel.
- Controllo manuale con mouse, tastiera e dispositivo touch.
- Verifica che ricerca, filtri e preferiti restino invariati dopo apertura e chiusura.
- Build e lint completi prima della consegna.

## Criteri di accettazione

1. La card è più moderna e mostra movimento senza richiedere un video per ogni attività.
2. L’utente riconosce subito titolo, prezzo, luogo e preferito.
3. `Scopri` apre il dettaglio senza perdere ricerca, filtri o posizione.
4. Su mobile, chiamata e indicazioni sono sempre raggiungibili in basso.
5. Un errore media non impedisce mai di leggere o contattare l’attività.
6. Movimento automatico e autoplay rispettano le preferenze di accessibilità.
