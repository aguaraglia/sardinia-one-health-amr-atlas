# Procedura Istat — Censimento agricoltura 2020

## Stato

La fonte è stata individuata e registrata in `metadata/SOURCES.tsv` come contesto agricolo e zootecnico comunale. Non viene ancora pubblicato alcun valore: il catalogo SDMX non ha risposto entro il timeout di 60 secondi durante il tentativo automatico del 15 luglio 2026.

## Procedura ripetibile

1. Aprire la pagina ufficiale dei risultati del 7° Censimento generale dell’agricoltura: https://www.istat.it/statistiche-per-temi/censimenti/agricoltura/7-censimento-generale/risultati/
2. Selezionare il dataset/tavola con livello territoriale **comunale** e periodo 2020.
3. Esportare CSV o Excel dal data browser Istat; conservare il file originale in `raw/sources/istat/` senza modificarlo.
4. Verificare codice Istat del comune, unità di misura, universo statistico e soppressioni/zero prima di una conversione GeoJSON.
5. Trasformare solo le variabili documentate in una tabella derivata sotto `public/data/`, senza coordinate puntuali di aziende o allevamenti.
6. Calcolare eventuali indicatori solo con denominatori espliciti; questi dati sono contesto agricolo/zootecnico e non prevalenze AMR.

## Endpoint tecnico provato

`https://esploradati.istat.it/SDMXWS/rest/dataflow?format=jsonstructure`

L’endpoint è ufficiale ma ha superato il timeout nella sessione corrente. Va riprovato quando il servizio è disponibile; non si deve inventare un codice dataflow. La documentazione ufficiale SDMX è disponibile a https://www.istat.it/classificazioni-e-strumenti/web-services-sdmx/.

## Vincoli privacy

Pubblicare esclusivamente aggregati comunali o regionali. Eventuali dati aziendali, di allevamento o coordinate puntuali restano in `private/`/`raw/` e non entrano nella release GitHub Pages.
