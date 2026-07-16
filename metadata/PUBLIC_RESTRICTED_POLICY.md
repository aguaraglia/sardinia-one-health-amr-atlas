# Contratto `public` / `private`

## Regola vincolante

Le coordinate puntuali di aziende, isolati, campioni o altri soggetti
sensibili possono esistere soltanto sotto `private/`. Non devono comparire in
`public/`, `web/`, `metadata/`, `releases/` o nella cronologia GitHub.

La parte pubblica usa esclusivamente:

- geometrie amministrative e ambientali pubbliche;
- aggregati comunali o di bacino;
- geometrie generalizzate quando l'aggregazione non è sufficiente;
- metadati, accessioni e risultati autorizzati.

## Dati genomici

`arborea_italy_comparative` e `goat_nas` restano puntuali e riservati sotto
`private/`. La pubblicazione può contenere soltanto aggregati o viste
generalizzate, dopo revisione e autorizzazione.

## Controllo prima del push

Prima di ogni pubblicazione verificare che i file tracciati non contengano
nomi o percorsi riconducibili a coordinate, aziende, campioni, genomi o dati
clinici. Le esclusioni Git sono una cintura di sicurezza, non sostituiscono
la revisione del contenuto.

## Campioni ambientali PNCAR

I risultati ambientali possono essere pubblici solo come aggregati o geometrie
generalizzate. I punti di campionamento, gli identificativi operativi e le
coordinate precise restano `restricted` fino a revisione esplicita.

`intI1` e `rrs_16S` non sono classi AMR: `intI1` e' un marker di mobilita,
mentre `rrs_16S` e' un normalizzatore.
