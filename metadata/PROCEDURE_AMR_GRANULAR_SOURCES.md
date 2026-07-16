# Recupero di dati AMR più granulari in Sardegna

## Risultato verificato il 16 luglio 2026

La fonte pubblica più granulare individuata è il progetto ENA/NCBI
`PRJNA1411669`, associato allo studio sul Lago Bidighinzu e sulla Laguna di
Cabras (PMID `42019335`, DOI `10.1016/j.jenvman.2026.129718`). Il progetto
contiene 106 BioSample e 229 run: 171 amplicon e 58 shotgun WGS. Dieci run WGS
sono campioni di campo attribuiti ai due corpi idrici; gli altri 48 sono
campioni sperimentali indicati come Sassari e non devono essere rappresentati
come punti ambientali di campo.

L'articolo completo, pubblicato con licenza CC BY 4.0, riporta 287 ARG in 41
classi. Le classi più abbondanti sono multiresistenza, fluorochinoloni e
beta-lattamici. Nell'analisi assembly-based sono presenti 422 contig con almeno
un ARG: 176 nel Bidighinzu e 246 a Cabras. Gli ARG co-occorrono con elementi
genetici mobili in 32/176 contig nel Bidighinzu e 11/246 a Cabras. Questi
aggregati possono essere pubblicati; le abbondanze per singolo campione
richiedono ancora le tabelle supplementari.

Il volume grezzo dei 58 run WGS è circa 445 GiB. Per questo l'ordine operativo
corretto è:

1. acquisire prima le tabelle supplementari dello studio dagli autori, perché
   il repository istituzionale le indica sotto embargo fino al 5 maggio 2028;
2. se le tabelle non sono disponibili, elaborare soltanto i 10 run WGS di
   campo di Bidighinzu e Cabras;
3. usare i 48 run sperimentali solo in un'analisi separata e mai come punti
   territoriali;
4. normalizzare le abbondanze ARG rispetto a lunghezza del gene, profondità di
   sequenziamento e, se disponibile, copie di `rrs_16S`;
5. conservare database, versione, soglie di identità/copertura e pipeline;
6. pubblicare l'aggregato per corpo idrico, mantenendo coordinate, Sample ID e
   accessioni puntuali sotto `private/`.

## Canali con maggiore rendimento atteso

### Dati umani

AR-ISS resta regionale e non può produrre valori comunali. La granularità
utile deve arrivare dai sistemi informativi dei laboratori di microbiologia
regionali. La richiesta deve chiedere un export anonimizzato per anno,
laboratorio o struttura, specie, antibiotico, risultato S/I/R e denominatore,
con deduplicazione del primo isolato per paziente e soppressione delle celle
piccole. Il comune di residenza può essere richiesto solo come aggregato e
solo se il titolare del dato applica una soglia di sicurezza.

### Dati veterinari e alimentari

L'IZS Sardegna ha documentato un progetto 2025 per implementare la
sorveglianza AMR nei batteri veterinari, in particolare zoonotici. Va chiesto
un report o export per ASL, specie, matrice, organismo, antibiotico e anno. I
dati aziendali e i campioni restano riservati.

### Archivi genomici

ENA contiene almeno 95 BioSample di `E. coli` suini del progetto
`PRJNA1171362` e 60 `Escherichia` da cinghiale del progetto `PRJNA1086262`,
entrambi con metadato Sardegna. Sono granulari a livello di isolato, ma non a
livello comunale: aziende e macelli sono anonimizzati oppure la località non è
depositata. Possono alimentare profili AMR di studio o di filiera, non una
prevalenza comunale.

## Riproducibilità e privacy

Lo script `scripts/fetch_ena_prjna1411669_metadata.ps1` aggiorna soltanto i
metadati WGS e scrive il dettaglio sotto `private/`. Non scarica i FASTQ. Il
file pubblico `public/data/environmental_amr_water_bodies_2024.json` contiene
solo risultati esplicitamente riportati dalla pubblicazione e aggregati per
corpo idrico.
