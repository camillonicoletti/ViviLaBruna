# ByteScout Pet Design

## Obiettivo

Creare una mascotte Codex v2 chiamata **ByteScout**, ispirata a uno scout che sa programmare. Deve risultare amichevole, curioso, competente e immediatamente leggibile anche nelle celle animate da 192×208 pixel.

## Identità visiva

ByteScout è un giovane scout umanoide in stile **3D toy morbido**, con proporzioni compatte: testa leggermente grande, mani e scarpe ben leggibili, silhouette pulita e dettagli non troppo sottili.

- uniforme celeste;
- pantaloni neri;
- fazzolettone verde;
- piccolo zaino tecnico, aderente al corpo e sempre collegato alla silhouette;
- piccolo laptop senza scritte, tenuto o indossato in modo coerente;
- simbolo `</>` semplice e luminoso sul laptop come dettaglio di programmazione;
- palette secondaria calda, con piccoli richiami al colore del tufo di Matera;
- nessun logo, testo leggibile, scenario, ombra o effetto staccato dal personaggio.

Il volto ha occhi grandi ma non caricaturali, sopracciglia mobili e un sorriso sicuro. Il laptop e lo zaino restano parte stabile dell'identità in tutte le pose.

## Animazioni

La mascotte usa le nove animazioni standard: riposo, corsa a destra, corsa a sinistra, saluto, salto, errore, attesa dell'utente, lavoro attivo e revisione. Il lavoro attivo mostra concentrazione sul laptop senza trasformarsi in una corsa fisica; la revisione usa sguardo, inclinazione della testa e interazione discreta con il laptop.

Le sedici direzioni dello sguardo seguono un movimento naturale: occhi e sopracciglia guidano, testa e collo seguono leggermente, busto e piedi restano stabili. Il fazzolettone accompagna il movimento con una piccola inerzia; zaino e laptop restano saldamente ancorati e cambiano occlusione in modo graduale.

## Produzione e qualità

La base e le strisce animate saranno generate su sfondo cromatico uniforme, poi estratte e assemblate deterministicamente in un atlante 8×11. L'output finale sarà un pet Codex v2 da 1536×2288 pixel con trasparenza, manifest `spriteVersionNumber: 2`, anteprime animate e controlli visivi e strutturali completi.

L'identità, i colori, le proporzioni e gli accessori devono rimanere coerenti in ogni fotogramma. Non sono ammessi elementi ritagliati, pose sovrapposte, guide visibili, effetti fluttuanti, ombre, scie o variazioni sostanziali del volto.

## Criteri di riuscita

- Si riconosce subito come scout e programmatore anche a dimensione pet.
- Uniforme celeste, pantaloni neri e fazzolettone verde restano coerenti.
- Zaino tecnico e laptop sono presenti senza ostacolare la leggibilità delle pose.
- Il simbolo `</>` è l'unico dettaglio grafico sul laptop e non appare come testo dell'interfaccia.
- Tutte le animazioni e le sedici direzioni risultano leggibili, continue e coerenti.
- L'atlante e il pacchetto finale superano la validazione Codex v2.
