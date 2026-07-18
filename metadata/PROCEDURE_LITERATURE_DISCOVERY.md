# Ricerca riproducibile della letteratura AMR in Sardegna

Questo progetto separa nettamente **scoperta bibliografica** e **inclusione nell'Atlante**. Una pubblicazione individuata automaticamente non diventa un'evidenza cartografica né un dato quantitativo finché non è stata verificata manualmente.

## Ricerca di aggiornamento

Dal repository, eseguire:

```powershell
./scripts/discover_pubmed_sardinia_amr.ps1
```

Lo script interroga PubMed tramite le E-utilities NCBI con una query conservativa su Sardegna/Sardinia/Sardinian e AMR, resistenza agli antibiotici, suscettibilità antimicrobica, resistoma, carbapenemasi e multidrug resistance. Produce `reports/pubmed_sardinia_amr_candidates.tsv`.

Il file prodotto è un **registro di triage**, non un dataset scientifico né una fonte da mostrare in mappa. Per ciascun PMID confronta automaticamente il risultato con `metadata/LITERATURE_CURATED.tsv` e assegna uno stato iniziale:

- `already_curated`: il record è già nel registro curato;
- `needs_manual_review`: candidato da sottoporre a revisione;
- `included`: da assegnare solo dopo revisione e aggiornamento del registro curato;
- `excluded`: da assegnare solo con una ragione documentata.

## Criteri di inclusione

Un record può essere incluso solo quando sono verificati tutti i requisiti applicabili:

1. contiene un risultato relativo a AMR/AMU o a un determinante di resistenza, non solo un riferimento generico;
2. è specifico per la Sardegna oppure riporta una stratificazione recuperabile per Sardegna;
3. consente di dichiarare senza inferenze il dominio One Health, la matrice e la scala geografica;
4. DOI/PMID e citazione sono controllati sulla fonte primaria;
5. la rappresentazione pubblica rispetta `PUBLIC_RESTRICTED_POLICY.md`: nessun punto sensibile, paziente, allevamento o azienda viene pubblicato.

I casi fuori ambito, solo metodologici, non localizzabili o privi di un risultato AMR esplicito restano nel registro di triage con motivazione, ma non entrano nel layer pubblico.

## Frequenza e tracciabilità

Eseguire la ricerca almeno prima di ogni release pubblica e annotare data, query, revisore e decisione nel registro di letteratura. Le fonti curate pubbliche restano versionate in `public/data/literature_curated_sardinia.json`; il conteggio della mappa non deve essere presentato come numero di fonti indipendenti quando aggrega unità territoriali o siti.
