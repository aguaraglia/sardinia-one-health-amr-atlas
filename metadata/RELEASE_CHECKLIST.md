# Checklist per una release citabile

Questa checklist prepara una release GitHub e un deposito Zenodo, ma non autorizza la pubblicazione irreversibile del DOI.

## Prima del tag

- [ ] Eseguire `scripts/check_public_privacy.ps1` e risolvere ogni segnalazione.
- [ ] Rigenerare il registro PubMed e registrare le decisioni per i candidati non curati.
- [ ] Verificare che `CITATION.cff`, `.zenodo.json`, README e pagina pubblica riportino la stessa versione e data.
- [ ] Rieseguire gli script che generano i dataset pubblici e controllare il diff.
- [ ] Testare la home, le pagine delle fonti, i filtri e i link esterni sia su desktop sia su mobile.
- [ ] Verificare che nessun file privato, coordinata sensibile, nome di azienda o credenziale sia incluso nella release.

## GitHub e Zenodo

1. Creare il tag di versione e la GitHub Release dopo l'approvazione del contenuto.
2. Creare un deposito Zenodo come **bozza** usando `.zenodo.json`.
3. Caricare solo l'archivio della release verificato e i checksum.
4. Controllare titolo, autori, licenza, file e pagina di anteprima.
5. Richiedere una conferma esplicita prima di premere **Publish** su Zenodo: la pubblicazione assegna un DOI persistente e non va automatizzata.

## Dopo la pubblicazione

- [ ] Inserire DOI e versione in `CITATION.cff`, README e sito.
- [ ] Verificare anonimemente landing page, DOI resolver e GitHub Pages.
- [ ] Annotare data, commit e checksum nel manifest della release.
