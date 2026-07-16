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

## Evidenza comunale veterinaria recuperata

Lo studio su *Streptococcus uberis* associato a mastite ovina (PMID
`35799261`, DOI `10.1186/s12917-022-03341-1`) pubblica nei supplementi il
comune, l'anno, l'antibiogramma verso 14 antimicrobici e i geni di resistenza
per 46 isolati raccolti nel 2011-2016. Gli isolati coprono 36 comuni sardi.
Complessivamente risultano 136 esiti resistenti, 51 intermedi e 457 sensibili
su 644 test; 45 isolati su 46 sono resistenti ad almeno un antimicrobico.

La selezione comprende un isolato per azienda con profilo RFLP distinto e
privilegia i comuni con più focolai. Il risultato è quindi un'evidenza
territoriale documentata, ma non una stima di prevalenza comunale. Lo script
`scripts/fetch_streptococcus_uberis_amr.py` conserva i fogli sorgente e il
dettaglio dell'isolato sotto `private/`, quindi genera soltanto aggregati per
comune nel pubblico. Unendo questa coorte al catalogo storico IZS si ottengono
40 comuni unici con almeno un'evidenza veterinaria AMR; sei comuni compaiono
in entrambe le fonti.

## Piano regionale 2026 e accesso SINVSA/CRAB

La scheda regionale 2026 del monitoraggio armonizzato AMR zoonotica prevede
16 campioni in Sardegna: otto carni di pollo e otto carni di tacchino. Il piano
pubblico ripartisce i campioni tra le otto ASL, ma non contiene risultati di
resistenza. I metadati di campionamento sono registrati in SINVSA; gli esiti di
sensibilità sono registrati in CRAB e richiedono credenziali istituzionali.

La richiesta dati deve specificare:

1. anno e ASL;
2. comune, solo se rilasciabile in forma aggregata;
3. specie, matrice e luogo di campionamento;
4. organismo e antimicrobico;
5. conteggi S, I e R con denominatore;
6. deduplicazione degli isolati secondo il protocollo del piano;
7. soppressione delle celle piccole;
8. esclusione dal pubblico di indirizzi, coordinate, punti vendita, macelli,
   aziende, identificativi di campione e accessioni.

Il prodotto pubblico ammesso è un aggregato per ASL o comune autorizzato. Il
dettaglio di campione, struttura o azienda rimane nella parte privata. La
semplice allocazione dei campioni del piano non deve mai essere rappresentata
come presenza o prevalenza di AMR.

## Nuove evidenze granulari verificate

Tre studi aggiuntivi sono stati controllati contro articolo, supplementi e,
quando disponibile, archivio genomico:

- le tre colture naturali SR30, SR56 e SR63 provengono da due caseifici
  anonimi di Berchidda. La SR56 mostra crescita sopra i cut-off per quattro
  antimicrobici e contiene `tetM`. È pubblicabile come poligono del comune,
  senza localizzare i caseifici, ed è un'evidenza storica della filiera;
- i 17 isolati sardi di *Streptococcus ruminantium* sono resistenti alla
  kanamicina, ma l'articolo indica solo la Sardegna orientale e BioProject
  `PRJNA1009676` non contiene il comune;
- il focolaio da *Enterococcus faecalis* comprende 48 isolati, 45 MDR, ma la
  fonte pubblica indica soltanto un'azienda anonima del Nord Sardegna.

Per gli ultimi due studi non è stato effettuato alcun downscaling comunale.
La sede pubblica di una struttura sanitaria può invece essere mostrata come
punto di struttura, purché il popup dichiari che non rappresenta la residenza
dei pazienti né una coordinata di campione.
