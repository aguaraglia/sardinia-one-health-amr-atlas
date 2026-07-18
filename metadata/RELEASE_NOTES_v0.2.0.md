# Sardinia One Health AMR Atlas v0.2.0

Release date: 2026-07-18

## What changed

- The curated AMR literature register is now generated reproducibly from its TSV source and contains 36 studies (2000–2026).
- The public dashboard distinguishes mapped evidence units from independent sources and labels compatible map layers correctly.
- Italian and English public routes were added, including public evidence records, About and Outreach pages.
- The public identity and 12-module outreach plan were added without presenting planned material as completed audiovisual content.
- A 20-plant wastewater screening prototype now samples the official RAS DTM 10 m through WCS to orient the nearest DBGT segment locally.
- Hydrologic outputs explicitly retain `authorised_receiver = not_assessed` and `downstream_path = not_assessed`; they are not evidence of a discharge destination.

## Known limits

- The regional WCS currently supports small DTM extracts but rejected regional-scale requests during preparation with a server-side storage error. A complete topological downstream model is therefore not in this release.
- English dynamic labels are localised for evidence records; further dashboard copy can be translated in subsequent releases.
- This release has no DOI yet. `.zenodo.json` is release metadata only; publishing a Zenodo record requires an explicit final review and confirmation.
