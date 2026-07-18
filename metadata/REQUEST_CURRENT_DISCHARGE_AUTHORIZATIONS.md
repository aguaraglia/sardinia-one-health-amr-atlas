# Richiesta di evidenza corrente sui recapiti dei depuratori

## Obiettivo

Aggiornare il solo archivio **privato** dell'Atlante con evidenze documentali che permettano di distinguere:

- un corpo recettore riportato in un controllo storico;
- un percorso modellato sulla rete idrografica;
- un recapito autorizzato e attualmente valido.

La richiesta non deve includere coordinate di scarico, nominativi di utenze, aziende conferenti o reti fognarie dettagliate se tali informazioni non sono pubblicabili.

## Destinatari e ordine consigliato

1. Ufficio competente dell'ente che ha rilasciato o detiene l'autorizzazione allo scarico (Provincia/Città Metropolitana/Comune, secondo competenza).
2. Regione Sardegna - titolare/gestore del dato SIRA, per un eventuale estratto istituzionale.
3. Gestore del servizio idrico (Abbanoa) o EGAS, solo per confermare configurazione e collettamenti, non per sostituire l'atto autorizzativo.

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
> Nell'ambito del Sardinia One Health AMR Atlas, progetto pubblico che utilizza esclusivamente dati aggregati e non pubblica punti di scarico o reti fognarie riservate, chiediamo la disponibilità di un estratto/documentazione relativa agli impianti di depurazione di competenza. Per ciascun impianto sarebbero utili ID ufficiale, denominazione, Comune, riferimento e validità dell'autorizzazione, tipologia e nome del recapito o della destinazione, data di aggiornamento e fonte. Non sono richieste coordinate di scarico, dati di utenza o informazioni non pubblicabili. I dati saranno conservati e sottoposti a verifica in ambiente privato; qualsiasi eventuale rappresentazione pubblica avverrà solo previo controllo di licenza, validità e livello di dettaglio.

## Regola di importazione

Un record può essere classificato `documented_current` solo se contiene una fonte istituzionale identificabile e una validità esplicita o verificabile. Un rapporto storico di controllo, un articolo, una descrizione tecnica o un percorso GIS possono essere conservati come evidenza di contesto, ma non promossi a recapito corrente.