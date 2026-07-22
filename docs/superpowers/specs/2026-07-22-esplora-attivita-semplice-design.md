# Esplora Attività Semplice — Design

## Obiettivo

Creare una seconda pagina “Esplora Attività” moderna, mobile-first e coerente con lo stile di Matera da Vivere. La pagina deve aiutare il visitatore a capire, confrontare e scegliere le attività senza scroll controllato, wizard AI, programma laterale o passaggi obbligatori.

La nuova pagina sarà disponibile su `/esplora-attivita-nuova`. La pagina attuale `/prova` e il collegamento del menu resteranno invariati durante il confronto.

## Principi di esperienza

Ogni attività deve rispondere direttamente a quattro domande:

1. Cosa farò?
2. Quanto dura e quanto costa?
3. Dove si trova?
4. Quale numero devo chiamare?

L’utente non deve aprire un modal per ottenere queste informazioni. Le azioni principali devono essere disponibili sulla card stessa.

## Direzione visiva approvata

La pagina adotta la direzione “Griglia editoriale — Guida locale immediata”:

- fondo scuro ispirato al tufo, con accenti oro `#E8C96D`;
- titoli editoriali serif e testo operativo sans-serif;
- fotografia ampia, ma subordinata alla chiarezza delle informazioni;
- superfici scure con bordi sottili e contrasto leggibile;
- animazioni brevi e discrete, disattivate quando il sistema richiede movimento ridotto;
- nessuno sfondo video o transizione che intercetti lo scroll.

## Struttura della pagina

### Testata

Sotto la navbar esistente compare una testata compatta con:

- kicker “Esperienze autentiche”;
- titolo “Cosa vuoi vivere a Matera?”;
- sottotitolo che promette informazioni immediate;
- pulsante-contatore `♡ Salvate`, che attiva o disattiva la vista delle sole preferite.

### Ricerca e filtri

La ricerca filtra in tempo reale per titolo, categoria, descrizione breve e luogo. I filtri disponibili sono:

- Tutte;
- Cultura;
- Sapori;
- Natura;
- Sport;
- Speciali.

Ricerca e categoria si combinano. Un comando “Azzera filtri” compare solo nello stato senza risultati.

### Griglia

La griglia usa:

- una colonna fino a `639px`;
- due colonne da `640px` a `1023px`;
- tre colonne da `1024px` in su.

Non è presente alcun carosello orizzontale. La pagina usa lo scroll verticale nativo.

## Card attività

Ogni card mostra sempre:

- immagine e categoria;
- cuore per salvare o rimuovere dai preferiti;
- titolo;
- una frase concreta, orientata all’azione, che spiega cosa si fa;
- durata, valutazione con numero recensioni e prezzo;
- luogo completo;
- numero telefonico leggibile;
- pulsante `Indicazioni`;
- pulsante principale `Chiama ora`.

`Chiama ora` usa un link `tel:` con il numero normalizzato. `Indicazioni` apre Google Maps in una nuova scheda usando le coordinate dell’attività e un URL HTTPS.

Il cuore è un vero `button`, espone uno stato `aria-pressed` e un’etichetta accessibile specifica per l’attività.

## Preferiti

I preferiti sono una selezione semplice, non un itinerario. Sono memorizzati nel browser con la chiave `materaFavoriteActivities` come array di ID numerici.

Il pulsante `♡ Salvate`:

- mostra il conteggio corrente;
- filtra la griglia mostrando solo i preferiti quando attivo;
- torna alla vista completa quando premuto una seconda volta.

Se lo storage del browser non è disponibile, i preferiti continuano a funzionare per la sessione corrente senza mostrare errori all’utente.

## Contenuti

La nuova pagina usa le stesse sei attività della pagina `/prova`:

1. Tour dei Sassi al Tramonto;
2. Volo in Mongolfiera all’Alba;
3. Laboratorio del Pane IGP;
4. Trekking Murgia Materana;
5. E-Bike dalla Cripta;
6. Cena Romantica in Grotta.

I dati saranno definiti in un file dedicato e includeranno ID stabile, titolo, categoria normalizzata, etichetta categoria, prezzo, valutazione, recensioni, immagine, durata, descrizione breve, luogo, telefono e coordinate.

## Componenti e responsabilità

### `activitiesData.js`

Contiene esclusivamente i dati delle sei attività. Non contiene stato o logica React.

### `activityExplorerUtils.js`

Contiene funzioni pure per:

- normalizzare il testo di ricerca;
- filtrare attività per query, categoria e vista preferiti;
- leggere e validare gli ID dei preferiti;
- costruire gli URL `tel:` e Google Maps.

### `ActivitiesRedesign.jsx`

Gestisce query, categoria, preferiti, modalità “solo salvate” e rendering. Legge i preferiti una volta al montaggio e li persiste a ogni modifica successiva.

### `ActivityCard.jsx`

Renderizza una singola attività e comunica al genitore soltanto il toggle del preferito. Telefono e indicazioni restano link nativi.

### `ActivitiesRedesign.css`

Definisce lo stile scoped della nuova pagina, i breakpoint e gli stati hover/focus/reduced-motion. Non modifica gli stili globali della pagina `/prova`.

## Flusso dei dati

1. `ActivitiesRedesign` importa la lista immutabile delle attività.
2. Lo stato locale contiene query, categoria, ID preferiti e flag “solo salvate”.
3. Una funzione pura calcola la lista visibile a ogni cambiamento.
4. `ActivityCard` riceve attività, stato preferito e callback di toggle.
5. Il toggle aggiorna lo stato; un effect sincronizza il nuovo array nello storage.

Non sono previste chiamate API, caricamenti asincroni o dipendenze aggiuntive.

## Stati speciali ed errori

- Nessun risultato: messaggio chiaro, filtri correnti riassunti e pulsante “Azzera filtri”.
- Nessun preferito: messaggio “Non hai ancora salvato attività” e pulsante per tornare a tutte.
- Immagine non disponibile: sfondo in gradiente tufo con il nome dell’attività ancora visibile e leggibile.
- Storage non disponibile o corrotto: array vuoto e funzionamento in memoria.
- Dati telefonici o coordinate mancanti: la relativa azione non viene renderizzata; le sei attività iniziali includono entrambi.

## Accessibilità

- heading in ordine gerarchico;
- ricerca con label accessibile;
- filtri come pulsanti con `aria-pressed`;
- focus visibile per cuore, filtri e link;
- contrasto AA per testo operativo;
- immagini con alt descrittivo;
- nessuna informazione affidata soltanto al colore;
- target interattivi di almeno `44px` su smartphone.

## Test e verifica

Test automatici con `node:test` copriranno le funzioni pure:

- ricerca senza distinzione tra maiuscole e accenti;
- combinazione ricerca/categoria;
- vista delle sole attività preferite;
- validazione dello storage corrotto;
- generazione URL telefonico e Google Maps.

La verifica UI comprende:

- filtro, ricerca e toggle preferiti su viewport mobile e desktop;
- persistenza dei preferiti dopo reload;
- apertura corretta dei link `tel:` e Maps;
- assenza di overflow orizzontale a `320px`;
- build Vite e lint mirato sui nuovi file.

## Criteri di accettazione

La funzionalità è completa quando:

- `/esplora-attivita-nuova` è raggiungibile direttamente;
- `/prova` mantiene il comportamento attuale;
- tutte e sei le attività sono confrontabili con scroll verticale nativo;
- ogni card spiega cosa si fa e mostra luogo e telefono senza ulteriori click;
- ricerca, categorie e vista preferiti funzionano insieme;
- i preferiti persistono quando lo storage è disponibile;
- `Chiama ora` e `Indicazioni` usano link validi;
- il layout resta leggibile da `320px` fino al desktop;
- i test automatici e la build terminano senza errori.

## Fuori ambito

- sostituzione della voce di menu esistente;
- wizard del Cavaliere AI;
- generazione itinerario;
- prenotazione o pagamento online;
- backend o sincronizzazione preferiti tra dispositivi;
- mappa incorporata;
- modifica della pagina `/prova`.
