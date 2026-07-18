# Procedura per i possibili recettori idrici dei depuratori

## Stato attuale: solo screening di prossimità

Il layer DBGT dei corsi d'acqua disponibile nel repository contiene geometrie e nomi, ma non una rete topologica completa, una direzione di deflusso o un recapito autorizzato. Per questo motivo la distanza geometrica da un corso d'acqua **non prova** che un impianto scarichi in quel corso, né consente di affermare dove l'effluente finisca.

`scripts/build_hydrologic_receiver_prototype.py` crea un campione iniziale di 20 impianti urbani attivi, ordinati prima per abitanti serviti e poi per distanza dal corso nominato più vicino. L'output `reports/hydrologic_receiver_prototype_20.tsv` usa volutamente i campi `authorised_receiver = not_assessed` e `downstream_path = not_assessed`.

## Validazione richiesta prima di qualunque pubblicazione interpretativa

Per ogni impianto del prototipo servono, in ordine:

1. il recapito autorizzato da atto/SIRA/gestore, oppure una fonte tecnica equivalente;
2. il punto di scarico, se pubblicabile;
3. un DTM ufficiale regionale e una rete idrografica topologica per la direzione e la connettività;
4. un controllo manuale con ortofoto e cartografia ufficiale;
5. una classe di confidenza (`documented`, `modelled_high`, `modelled_low`, `not_assessed`) e la data del controllo.

## Pubblicazione e privacy

La mappa pubblica può mostrare solo il recettore documentato o modellato, il bacino a valle, il metodo e la confidenza. Non deve esporre coordinate private di scarico, aziende conferenti, allacciamenti o inferenze su singoli soggetti. L'attribuzione di Comuni o aziende a un depuratore richiede una fonte amministrativa esplicita, non una deduzione geografica.
## Fonte altimetrica candidata, verificata il 2026-07-18

Il Geoportale della Regione Sardegna rende disponibile il DTM 10 m regionale tramite WMS. Il servizio verificato è:

```text
https://webgis.regione.sardegna.it/geoserverraster/wms?service=WMS&request=GetCapabilities
```

Nel documento GetCapabilities è presente il layer `raster:DTM_10M_ALTIMETRIA_REV01`. Prima di usare valori di quota in un modello, il team deve scaricare o ottenere un raster analizzabile con licenza e sistema di riferimento documentati: un WMS di visualizzazione non sostituisce un DTM locale per calcoli riproducibili. La Regione indica che il DTM 10 m copre l'intero territorio regionale; i DTM 1 m sono invece disponibili soltanto in aree specifiche.