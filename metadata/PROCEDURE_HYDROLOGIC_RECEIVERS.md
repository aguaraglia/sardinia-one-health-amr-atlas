# Procedura per i possibili recettori idrici dei depuratori

## Stato attuale: solo screening di prossimità

Il layer DBGT storico disponibile nel repository contiene geometrie e nomi, ma non una rete topologica completa, una direzione di deflusso o un recapito autorizzato. Per questo motivo la distanza geometrica da un corso d'acqua **non prova** che un impianto scarichi in quel corso, né consente di affermare dove l'effluente finisca.

`scripts/build_hydrologic_receiver_prototype.py` crea un campione iniziale di 20 impianti urbani attivi, ordinati per distanza dal corso nominato più vicino. Il campo sorgente `ABITANTI_SERVITI` non viene usato per la priorità: nel GeoJSON SIRA contiene in molti record valori binari non interpretabili (ad esempio numeri dell'ordine di `1e-320`) e non può sostenere un'inferenza pubblica. L'output `reports/hydrologic_receiver_prototype_20.tsv` usa volutamente i campi `authorised_receiver = not_assessed` e `downstream_path = not_assessed`.

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

## Orientamento locale del prototipo

`scripts/enrich_hydrologic_prototype_with_dtm.py` abbina ciascuno dei 20 impianti del campione al segmento DBGT geometricamente più vicino e usa il coverage WCS `raster__DTM_10M_ALTIMETRIA_REV01` per campionare quota agli estremi del segmento. L’output può indicare soltanto un orientamento locale del segmento (`nearest_segment_start_to_end`, `nearest_segment_end_to_start` o `uncertain_flat_or_below_dtm_resolution`).

Questo passaggio **non** stabilisce un recapito autorizzato, una connessione idrologica tra segmenti o il corpo idrico finale. Per una traccia a valle restano indispensabili topologia, snapping controllato, gestione di confluenze e validazione amministrativa.

## Disponibilità WCS e limite operativo verificato il 2026-07-18

Il coverage WCS ufficiale è stato interrogato con successo su piccoli riquadri (campionamento agli estremi dei segmenti del prototipo). I tentativi di ottenere l'intera Sardegna, anche a risoluzione degradata, non sono invece riproducibili: il server ha restituito timeout e, per una richiesta parziale, `java.io.IOException: No space left on device`. È un limite del servizio remoto, non un risultato idrologico.

Finché non sarà disponibile un download regionale stabile o una rete idrografica topologica ufficiale, l'atlante non deve mostrare predizioni di recapito a valle. Il prototipo rimane un controllo tecnico locale, conservato nel report, con classe `not_assessed` per recapito e percorso a valle.

## Rete regionale orientata: validazione privata iniziale

Il WFS del Geoportale regionale espone ora il layer `dbu:elemento_idrico_strahler` del DBGT10K v05, interrogabile all'indirizzo:

```text
https://webgis.regione.sardegna.it/geoserver/dbu/wfs
```

La descrizione ufficiale definisce il reticolo naturale come connesso, orientato e ordinato. Il layer Strahler scaricato il 2026-07-18 contiene 229.290 segmenti, 7 sottobacini e geometrie con ordine dei vertici. Un controllo locale delle estremità, arrotondate a 7 decimali, ha collegato 224.878 segmenti al successivo (98,1%); 4.412 estremità restano terminali e devono essere interpretate come possibili foci, discontinuità o limiti di copertura, non come mare o recapito certo.

Il verso è stato confrontato con il DTM regionale 10 m su 12 segmenti casuali: 7 mostrano una discesa superiore a 1 m dal primo all'ultimo vertice, 5 risultano piatti entro la risoluzione e nessuno risulta chiaramente in salita. È un controllo di coerenza, non una validazione assoluta del verso di ogni tratto.

`scripts/fetch_regional_hydrograph.py` salva il WFS esclusivamente in `private/hydrology/`. `scripts/build_hydrograph_candidate.py` crea, sempre in area privata, un campione di 20 impianti con segmento più vicino, eventuale cammino candidato, diramazioni ambigue e terminali non classificati. L'associazione iniziale resta di prossimità: non identifica il punto di scarico, il recapito autorizzato né un corpo idrico finale da rendere pubblico.
## Evidenza storica ARPAS su corpi recettori

Il rapporto ARPAS *Rapporto sulle attività espletate e sullo stato dei depuratori fognari controllati - Anno 2015* documenta, per Cagliari e Medio Campidano, una matrice Comune/impianto, bacino e corpo recettore (pagine 22-26). Sono stati trascritti 32 record in `metadata/HYDROLOGIC_RECEIVER_EVIDENCE.tsv`; il catalogo fonte è `arpas_depuratori_controllati_2015`.

Questi record sono etichettati `historical_2015_matrix` e `source_extracted_needs_sira_match`: attestano ciò che ARPAS riportava e controllava nel 2015, non una autorizzazione vigente né la configurazione attuale dell'impianto. `scripts/match_hydrologic_receiver_evidence.py` crea solo nell'area privata una lista di candidati SIRA per Comune. Un singolo candidato comunale richiede comunque controllo di denominazione, stato operativo, atto autorizzativo e, se necessario, del gestore.

Nessun corpo recettore storico o collegamento verso un consortile viene visualizzato automaticamente nella mappa pubblica. Le coordinate dei punti di scarico e le reti fognarie restano private.
## Acquisizione di autorizzazioni correnti

Per acquisire un recapito corrente senza deduzioni, usare `metadata/REQUEST_CURRENT_DISCHARGE_AUTHORIZATIONS.md` e importare gli estratti ricevuti in `private/hydrology/receiver_authorizations.tsv`, basato su `metadata/HYDROLOGIC_RECEIVER_AUTHORIZATION_TEMPLATE.tsv`. Il validatore `scripts/validate_receiver_authorizations.py` ammette come potenzialmente `documented_current` soltanto atti autorizzativi, estratti SIRA ufficiali o conferme tecniche del gestore con stato `valid`; non pubblica nomi dei recettori, riferimenti privati o coordinate.

La sequenza operativa preferita è: estratto SIRA/DeSAC regionale, validazione degli ID e della validità, quindi richiesta agli enti territorialmente competenti soltanto per le lacune. ARPAS è una fonte di controllo e informazione ambientale, non una sostituzione dell'atto autorizzativo. Il percorso dettagliato e i riferimenti istituzionali sono mantenuti in metadata/REQUEST_CURRENT_DISCHARGE_AUTHORIZATIONS.md.
## Screening regionale privato (560 impianti urbani attivi)

Dal 2026-07-18 lo script accetta `--limit`: il valore `0` elabora tutti gli impianti urbani attivi, mantenendo il risultato esclusivamente in `private/hydrology/`. Il comando riproducibile è:

```text
python scripts/build_hydrograph_candidate.py --limit 0 --output private/hydrology/hydrograph_candidate_active_urban_560.tsv --summary private/hydrology/hydrograph_candidate_active_urban_560_summary.json
```

Lo screening ha elaborato 560 impianti: 316 percorsi hanno una `branch_ambiguous`, 244 raggiungono un `network_terminal_unclassified`. Tali stati descrivono il comportamento della rete e le sue ambiguità, **non** un fiume recettore, il mare, un punto di scarico o un destino finale. Ogni riga conserva `authorised_receiver = not_assessed`; i file non sono pubblicati né indicizzati dal sito.
