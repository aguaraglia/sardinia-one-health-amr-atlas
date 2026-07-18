# Richiesta di evidenza corrente sui recapiti dei depuratori

## Obiettivo

Aggiornare il solo archivio **privato** dell'Atlante con evidenze documentali che permettano di distinguere:

- un corpo recettore riportato in un controllo storico;
- un percorso modellato sulla rete idrografica;
- un recapito autorizzato e attualmente valido.

La richiesta non deve includere coordinate di scarico, nominativi di utenze, aziende conferenti o reti fognarie dettagliate se tali informazioni non sono pubblicabili.

## Destinatari e ordine consigliato

1. Ufficio competente dell'ente che ha rilasciato o detiene l'autorizzazione allo scarico (Provincia/Città Metropolitana/Comune, secondo competenza).
2. Regione Sardegna - settore sistemi informativi ambientali/SIRA, chiedendo un estratto istituzionale del sistema **DeSAC** (Depuratori, Scarichi, Autorizzazioni, Controlli). DeSAC è il canale regionale che riunisce i dati tecnico-amministrativi su impianti, scarichi, autorizzazioni e controlli.
3. ARPAS, per la documentazione di controllo e l'eventuale informazione ambientale detenuta; non sostituisce l'atto autorizzativo ma può rendere verificabile il contesto di controllo.
4. Gestore del servizio idrico (Abbanoa) o EGAS, solo per confermare configurazione e collettamenti, non per sostituire l'atto autorizzativo.

## Canale di accesso raccomandato

La richiesta deve essere **mirata a un elenco di campi**, non a una copia indiscriminata delle banche dati. Se il dato non è disponibile nell'ordinario canale SIRA/DeSAC, si può usare l'accesso all'informazione ambientale o l'accesso civico generalizzato verso l'ufficio che detiene il dato. La Regione dichiara che l'informazione ambientale detenuta è accessibile a chiunque senza dover dimostrare un interesse; per l'accesso civico generalizzato indica l'URP competente per materia o direttamente l'ufficio detentore. ARPAS pubblica un canale analogo per accesso civico e informazione ambientale.

Non inviare richieste separate a tutti gli enti in parallelo: partire da SIRA/DeSAC per l'elenco regionale e usare Province, Città Metropolitana o Comuni soltanto per i record senza atto o validità verificabile. Questo riduce duplicazioni e permette di registrare un esito per ogni ID SIRA.

## Dati minimi richiesti per ogni impianto

- identificativo ufficiale dell'impianto (preferibilmente ID SIRA), denominazione e Comune;
- numero, data ed ente dell'atto autorizzativo vigente oppure identificativo dell'estratto SIRA ufficiale;
- stato di validità alla data di estrazione;
- tipologia del recapito: corso d'acqua, mare, suolo, riuso, collettamento a impianto consortile o altro;
- nome del corpo recettore/destinazione, se pubblicabile;
- data di aggiornamento e riferimento al documento o al servizio istituzionale;
- eventuale indicazione che i dati spaziali puntuali sono riservati.

## Testo riusabile della richiesta

> Oggetto: richiesta di evidenza documentale corrente su autorizzazioni allo scarico di impianti di depurazione in Sardegna
>
> Nell'ambito del Sardinia One Health AMR Atlas, progetto pubblico che utilizza esclusivamente dati aggregati e non pubblica punti di scarico o reti fognarie riservate, chiediamo la disponibilità di un estratto/documentazione relativa agli impianti di depurazione di competenza, preferibilmente dal sistema SIRA/DeSAC ove disponibile. Per ciascun impianto sarebbero utili ID ufficiale, denominazione, Comune, riferimento e validità dell'autorizzazione, tipologia e nome del recapito o della destinazione, data di aggiornamento e fonte. Non sono richieste coordinate di scarico, dati di utenza o informazioni non pubblicabili. I dati saranno conservati e sottoposti a verifica in ambiente privato; qualsiasi eventuale rappresentazione pubblica avverrà solo previo controllo di licenza, validità e livello di dettaglio.

## Riferimenti istituzionali verificati

- Regione Sardegna, SIRA II: <https://www.regione.sardegna.it/servizi/accesso-ai-servizi-on-line/indice-dei-servizi/sistema-informativo-regionale-ambientale-della-sardegna-secondo-stralcio-funzionale-sira-ii>
- Regione Sardegna, diritto di accesso: <https://www.regione.sardegna.it/regione/amministrazione-trasparente/altri-contenuti/diritto-di-accesso>
- ARPAS, scarichi idrici: <https://www.sardegnaambiente.it/index.php?c=4583&idsito=21&s=335624&v=2&xsl=612>
- ARPAS, diritto di accesso: <https://www.sardegnaambiente.it/index.php?c=4504&httphst=www.sardegnaambiente.it&idsito=21&s=418800&v=2&xsl=612>

## Regola di importazione

Un record può essere classificato `documented_current` solo se contiene una fonte istituzionale identificabile e una validità esplicita o verificabile. Un rapporto storico di controllo, un articolo, una descrizione tecnica o un percorso GIS possono essere conservati come evidenza di contesto, ma non promossi a recapito corrente.
## Allegato privato già predisposto

Per evitare una richiesta generica, rigenerare prima l’elenco minimale degli impianti urbani attivi:

```text
python scripts/build_authorisation_request_scope.py
```

Il file risultante `private/hydrology/desac_authorisation_request_scope_active_urban.tsv` contiene 560 ID SIRA, Comune, Provincia, denominazione e campi vuoti da restituire o completare dall’ente. Non contiene coordinate, gestori, reti fognarie, punti di scarico né recapiti dedotti; ogni riga è inizialmente `private_only` e `pending_source_response`. Può essere allegato alla richiesta a SIRA/DeSAC o usato come registro di avanzamento interno.
