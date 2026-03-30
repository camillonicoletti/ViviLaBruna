# ✦ Festa della Bruna - AI & 3D Interactive Map

Un'esperienza cinematografica e interattiva dedicata alla **Festa della Bruna** di Matera. Questo progetto offre una landing page immersiva dotata di un "Cavaliere AI" che guida l'utente nella creazione di un itinerario personalizzato e una mappa 3D integrata basata su Mapbox.

## ✨ Funzionalità Principali

- **Conversazione AI (Cavaliere della Bruna):** Un'interfaccia chat dinamica e coinvolgente.
- **Generazione Itinerari:** Suggerimenti di viaggio personalizzati in base alle preferenze dell'utente (gruppo, budget, interessi).
- **Mappa 3D Satellitare Interattiva:**
  - Standard Satellite 3D tramite Mapbox.
  - Tracker GPS con controllo della distanza (funziona solo se ci si trova a Matera o nei dintorni).
  - Collegamenti rapidi a Google Maps o Apple Maps per la navigazione.
  - Calcolo del percorso a piedi in tempo reale con API di Mapbox Directions.
- **Animazioni UI Premium:** Effetti glassmorphism, countdown in tempo reale ed overlay a tema.

## 🚀 Requisiti

- **Node.js** (versione 16.x o superiore consigliata)
- Un account [Mapbox](https://www.mapbox.com/) per ottenere un token di accesso (necessario per visualizzare le mappe e i percorsi 3D).

## 🛠️ Installazione e Configurazione

1. Clona il repository o scarica il codice sorgente:
   ```bash
   git clone <il-tuo-repo-url>
   cd ViviLaBruna
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```
   *(oppure potresti usare `yarn` o `pnpm`)*

3. Configura le variabili d'ambiente:
   - Crea un file `.env` copiando il modello di base o semplicemente creandolo alla radice del progetto:
     ```bash
     touch .env
     ```
   - Aggiungi la tua chiave Mapbox al file `.env`:
     ```env
     VITE_MAPBOX_TOKEN=il_tuo_token_qui
     ```
   *Nota: Il file `.env` è già ignorato in `.gitignore` per evitare la diffusione di chiavi private sui repository pubblici.*

## 💻 Esecuzione (Sviluppo Locale)

Per avviare il server in modalità di sviluppo, è stato configurato un plugin SSL di base (`@vitejs/plugin-basic-ssl`) per permettere al GPS di funzionare più facilmente (la geolocalizzazione richiede connessioni HTTPS anche in localhost, nella maggior parte dei browser su cellulare).

Esegui:
```bash
npm run dev
```
Vai all'indirizzo HTTPS generato da Vite (es: `https://localhost:5173/`).
Il tuo browser ti avviserà che il certificato non è verificato: procedi in sicurezza accettando il rischio locale per poter testare l'app in ambiente locale.

## 📦 Produzione

Per compilare la versione ottimizzata per la produzione:
```bash
npm run build
```

Per visualizzare via web server l'anteprima della build appena generata:
```bash
npm run preview
```

## 📜 Licenza
Questo progetto è un mockup tecnico/creativo sviluppato per celebrare la Festa della Bruna ed il suo potenziale digitale. Tutti i diritti sui marchi e i nomi legati alla "Festa della Bruna" appartengono ai rispettivi proprietari.
