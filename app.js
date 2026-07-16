const map = L.map('map', { zoomControl: true }).setView([40.12, 9.05], 8);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri'
});

const layers = {};
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
const amrTargets = [
  ['AMR_ANY', 'Tutte le classi'], ['AMR_BETA_LACTAM', 'Beta-lattamici'],
  ['AMR_CARBAPENEM', 'Carbapenemi'], ['AMR_CEPHALOSPORIN', 'Cefalosporine di terza generazione'],
  ['AMR_FLUOROQUINOLONE', 'Fluorochinoloni'], ['AMR_AMINOGLYCOSIDE', 'Aminoglicosidi'],
  ['AMR_TETRACYCLINE', 'Tetracicline'], ['AMR_MACROLIDE', 'Macrolidi'],
  ['AMR_GLYCOPEPTIDE', 'Glicopeptidi'], ['AMR_COLISTIN', 'Colistina'], ['AMR_MDR', 'Multiresistenza']
];
const targetSelect = document.getElementById('amr-target');
amrTargets.slice(1).forEach(([value, label]) => targetSelect.add(new Option(label, value)));
targetSelect.addEventListener('change', event => {
  applyAmrFilter(event.target.value);
});

const amrKeywords = {
  AMR_BETA_LACTAM: ['penicillin','penicillina','ampicillin','ampicillina','amoxicillin','amoxicillina','beta-lactam','bla','kpc','oxa','ndm','carbapenem','cephalosporin','cefazolin','cefotaxime','ceftazidime','ceftriaxone'],
  AMR_CARBAPENEM: ['carbapenem','kpc','oxa-48','oxa48','ndm','imipenem','meropenem','crkp','crec','crpa','cras'],
  AMR_CEPHALOSPORIN: ['cephalosporin','cefazolin','cefotaxime','ceftazidime','ceftriaxone','cefoxitin'],
  AMR_FLUOROQUINOLONE: ['fluoroquinolone','ciprofloxacin','levofloxacin','nalidixic','qnr'],
  AMR_AMINOGLYCOSIDE: ['aminoglycoside','amikacin','gentamicin','kanamycin','streptomycin','tobramycin','aac(','aad','aph('],
  AMR_TETRACYCLINE: ['tetracycline','tetraciclina','oxytetracycline','oxitetraciclina','doxycycline','minocycline','tet'],
  AMR_MACROLIDE: ['macrolide','azithromycin','clarithromycin','erythromycin','macrolidi','mph','mef'],
  AMR_GLYCOPEPTIDE: ['glycopeptide','vancomycin','vanb','vanc','vre'],
  AMR_COLISTIN: ['colistin','colistina','mcr'],
  AMR_MDR: ['multidrug','multiresist','mdr','xdr','resistenti ad almeno']
};
const filterableKeys = new Set(['veterinaryMunicipal','humanFacilityEvidence','foodChainMunicipal','arissSites']);
function featureMatchesAmr(feature, value) {
  if (value === 'AMR_ANY') return true;
  const haystack = JSON.stringify(feature?.properties || {}).toLowerCase();
  const keywords = amrKeywords[value] || value.toLowerCase().replace(/^amr[_-]?/, '').split(/[_-]+/).filter(Boolean);
  return keywords.some(keyword => haystack.includes(keyword));
}
function applyAmrFilter(value) {
  const label = targetSelect.selectedOptions[0]?.textContent || 'target selezionato';
  let visible = 0;
  filterableKeys.forEach(key => {
    const layer = layers[key];
    if (!layer) return;
    layer.eachLayer(item => {
      const show = featureMatchesAmr(item.feature, value);
      if (show) visible += 1;
      if (item.setStyle) item.setStyle({ opacity: show ? 1 : 0, fillOpacity: show ? (key === 'veterinaryMunicipal' ? 0.26 : 0.12) : 0 });
      if (item._path) item._path.style.pointerEvents = show ? 'auto' : 'none';
      if (item._icon) item._icon.style.display = show ? '' : 'none';
    });
  });
  document.getElementById('amr-state').textContent = value === 'AMR_ANY'
    ? 'Tutte le evidenze AMR pubbliche sono visibili.'
    : `${label}: ${visible} elementi compatibili visibili sulla mappa. Le fonti senza questo target restano nascoste.`;
}
fetch('public/data/pncar_env_panel.json').then(r => r.json()).then(d => {
  const group = document.createElement('optgroup');
  group.label = 'Pannello PNCAR';
  d.targets.forEach(target => {
    if (target.target_type !== 'biomass_normalizer') group.appendChild(new Option(target.display_name, target.target_id));
  });
  targetSelect.appendChild(group);
  const card = document.getElementById('pncar-panel-card');
  const argList = d.targets.filter(x => x.target_type === 'ARG').map(x => x.display_name).join(', ');
  const markerList = d.targets.filter(x => x.target_type !== 'ARG').map(x => x.display_name).join(', ');
  card.hidden = false;
  card.innerHTML = `<strong>${d.panel_name}</strong><br>ARG: ${argList}<br><small>Marker/controllo: ${markerList}. ${d.reporting_note}</small>`;
}).catch(() => {});
fetch('public/data/ar_iss_2024_coverage.json').then(r => r.json()).then(d => {
  const card = document.getElementById('ariss-card');
  card.hidden = false;
  card.innerHTML = `<strong>AR-ISS Sardegna 2024</strong><br>${d.reported_value}% copertura della sorveglianza<br><small>Indicatore di copertura, non prevalenza AMR.</small>`;
}).catch(() => {});
fetch('public/data/ar_iss_2024_sardinia_resistance.json').then(r => r.json()).then(d => {
  const card = document.getElementById('ariss-resistance-card');
  const rows = d.observations.map(x => `<tr><td>${x.phenotype}</td><td>${x.resistance_percent}%</td><td>${x.resistant}/${x.isolates}</td></tr>`).join('');
  card.hidden = false;
  card.innerHTML = `<strong>AR-ISS Sardegna 2024 - resistenza</strong><br><small>Copertura ${d.coverage_percent}%</small><table class="evidence-table"><tr><th>Fenotipo</th><th>%</th><th>R/n</th></tr>${rows}</table>`;
}).catch(() => {});
fetch('public/data/human_amr_facility_sassari_studies.json').then(r => r.json()).then(d => {
  const card = document.getElementById('human-facility-amr-card');
  const historical = d.records.find(item => item.study_id === 'aou_sassari_kpc_kp_2015_2017');
  const wgs = d.records.find(item => item.study_id === 'aou_sassari_kpc_oxa_wgs_2020_2021');
  const ndm = d.records.find(item => item.study_id === 'aou_sassari_ndm_kp_2021_2022');
  const vre = d.records.find(item => item.study_id === 'aou_sassari_vanb2_efaecium_2013_2018');
  const crkp = d.records.find(item => item.study_id === 'aou_sassari_crkp_genotype_phenotype_2018_2022');
  const kpcOxa = d.records.find(item => item.study_id === 'aou_sassari_kpc_oxa48_surveillance_2019_2020');
  const acinetobacter = d.records.find(item => item.study_id === 'aou_sassari_xdr_abaumannii_icu_2015');
  const covid = d.records.find(item => item.study_id === 'aou_sassari_covid_respiratory_coinfection_2021_2022');
  const kpc31 = wgs.key_resistance_genes.find(item => item.gene === 'blaKPC-31');
  card.hidden = false;
  card.innerHTML = `<strong>AMR umana · AOU Sassari</strong><br>` +
    `${d.records.length} studi o coorti pubblicati. <i>K. pneumoniae</i>: ${crkp.isolates_or_cases} CR-Kp (${crkp.period}); ` +
    `${kpcOxa.isolates_or_cases} KPC/OXA-48 (${kpcOxa.period}); ${historical.isolates_or_cases} KPC-Kp invasive; ` +
    `${wgs.isolates_or_cases} isolati ST512 con WGS; ${ndm.isolates_or_cases} casi NDM. ` +
    `<i>E. faecium</i>: ${vre.isolates_or_cases} isolati, ${vre.vanB2_positive_isolates} <code>vanB2</code>, di cui ` +
    `${vre.occult_vanB2_isolates_missed_by_initial_vitek2} occulto. <i>A. baumannii</i>: ${acinetobacter.typed_isolates} isolati XDR ST2. ` +
    `Studio COVID: ${covid.patients} pazienti.<br>` +
    `<small>Le pubblicazioni KPC/OXA includono coorti potenzialmente sovrapposte e non vanno sommate. ` +
    `<code>blaKPC-31</code> in ${kpc31.positive}/${kpc31.tested} isolati WGS. Dati di struttura, non prevalenza del Comune di Sassari.</small>`;
}).catch(() => {});
fetch('public/data/human_amr_local_studies_sardinia.json').then(r => r.json()).then(d => {
  const card = document.getElementById('human-local-amr-card');
  const cagliari = d.records.find(item => item.study_id === 'binaghi_cagliari_efaecalis_2010');
  const network = d.records.find(item => item.study_id === 'sardinia_three_hospital_nas_2017');
  const nuoro = d.records.find(item => item.study_id === 'nuoro_san_francesco_mdr_abaumannii_outbreak_2012');
  const mycobacteria = d.records.find(item => item.study_id === 'north_sardinia_mycobacteria_amr_2020_2023');
  const fosfomycin = cagliari.phenotypic_resistance_total.find(item => item.antibiotic === 'fosfomycin');
  const tetracycline = cagliari.phenotypic_resistance_total.find(item => item.antibiotic === 'tetracycline');
  const gentamicin = cagliari.phenotypic_resistance_total.find(item => item.antibiotic === 'high-level gentamicin');
  card.hidden = false;
  card.innerHTML = `<strong>AMR umana · Cagliari e rete ospedaliera</strong><br>` +
    `Binaghi Cagliari: ${cagliari.patients_and_isolates} isolati di <i>E. faecalis</i>; ` +
    `fosfomicina ${fosfomycin.resistant}/${fosfomycin.tested}, tetraciclina ${tetracycline.resistant}/${tetracycline.tested}, ` +
    `gentamicina ad alto livello ${gentamicin.resistant}/${gentamicin.tested}.<br>` +
    `Rete Sassari–Nuoro–Ozieri: ${network.human_cohort.resistant_to_at_least_one}/${network.human_cohort.isolates} NAS umani resistenti ad almeno un antimicrobico; ` +
    `${network.human_cohort.multidrug_resistant}/${network.human_cohort.isolates} MDR. ` +
    `San Francesco Nuoro: focolaio con ${nuoro.clinical_positive_patients} pazienti e ${nuoro.environmental_positive_bed_headboards} superfici positive (${nuoro.collection_period}). ` +
    `Nord Sardegna: ${mycobacteria.mtb_resistant_to_at_least_one_first_line_drug}/${mycobacteria.mycobacterium_tuberculosis_positive} MTB resistenti ad almeno un farmaco di prima linea (${mycobacteria.collection_period}).<br>` +
    `<small>Dati di struttura, rete o area vasta con periodi differenti; nessuna prevalenza comunale della popolazione.</small>`;
}).catch(() => {});
fetch('public/data/veterinary_amr_municipal_evidence.json').then(r => r.json()).then(d => {
  const card = document.getElementById('izs-municipal-amr-card');
  const izs = d.sources.find(item => item.source_id === 'izs_sardegna_bioresource');
  const uberis = d.sources.find(item => item.source_id === 'pmid_35799261_s_uberis_wgs');
  card.hidden = false;
  card.innerHTML = `<strong>AMR veterinaria · evidenze comunali</strong><br>` +
    `${d.municipality_count_unique} comuni documentati da due fonti.<br>` +
    `<i>S. uberis</i>: ${uberis.isolate_count} isolati da mastite ovina in ${uberis.municipality_count} comuni; ` +
    `${uberis.isolates_with_any_resistance}/${uberis.isolate_count} resistenti ad almeno un antimicrobico e ` +
    `${uberis.resistant_test_results}/${uberis.total_test_results} esiti resistenti (${uberis.period}).<br>` +
    `Bioresource IZS: ${izs.isolate_count} ceppi ovini in ${izs.municipality_count} comuni; ` +
    `${izs.resistant_test_results}/${izs.total_test_results} esiti resistenti (${izs.period}).<br>` +
    `<small>Coorti o collezioni selettive con pannelli differenti: identificazioni comunali, non prevalenza o rischio del comune; i conteggi delle due fonti non vanno sommati.</small>`;
}).catch(() => {});
fetch('public/data/izs_sa07_02_north_sardinia_amr.json').then(r => r.json()).then(d => {
  const card = document.getElementById('izs-area-amr-card');
  const oxytetra = d.antimicrobial_resistance.filter(x => x.antimicrobial === 'oxitetraciclina');
  const sUberis = oxytetra.find(x => x.organism === 'Streptococcus uberis');
  const ecoli = oxytetra.find(x => x.organism === 'Escherichia coli');
  card.hidden = false;
  card.innerHTML = `<strong>AMR veterinaria · Sardegna settentrionale</strong><br>` +
    `${d.isolate_total.toLocaleString('it-IT')} isolati da latte mastitico (${d.period}); ` +
    `oxitetraciclina: <i>S. uberis</i> ${sUberis.resistant}/${sUberis.tested} (${sUberis.resistance_percent}%), ` +
    `<i>E. coli</i> ${ecoli.resistant}/${ecoli.tested} (${ecoli.resistance_percent}%).<br>` +
    `<small>Rapporto IZS SA 07/02: antibiogrammi storici e sottocampione molecolare. Area di studio, non prevalenza comunale.</small>`;
}).catch(() => {});
fetch('public/data/pig_ecoli_sardinia_2024_amr.json').then(r => r.json()).then(d => {
  const card = document.getElementById('pig-amr-card');
  card.hidden = false;
  card.innerHTML = `<strong>AMR filiera suina · Sardegna</strong><br>` +
    `${d.isolates_analyzed} isolati E. coli da ${d.farms_sampled} allevamenti e ${d.slaughterhouses_sampled} macelli: ` +
    `${d.amr_phenotype.isolates_resistant_to_at_least_one}/${d.isolates_analyzed} resistenti ad almeno un antimicrobico; ` +
    `${d.amr_genotype.isolates_with_any_amr_gene}/${d.isolates_analyzed} con almeno un gene AMR. ` +
    `Più frequenti: tetracicline (${d.amr_phenotype.resistance_among_resistant_isolates.tetraciclina}%) e ampicillina (${d.amr_phenotype.resistance_among_resistant_isolates.ampicillina}%).<br>` +
    `<small>Studio 2020-2022; aziende e macelli anonimizzati, nessuna attribuzione comunale.</small>`;
}).catch(() => {});
fetch('public/data/wild_boar_ecoli_sardinia_2024_amr.json').then(r => r.json()).then(d => {
  const card = document.getElementById('wild-boar-amr-card');
  card.hidden = false;
  card.innerHTML = `<strong>AMR wildlife · cinghiali sardi</strong><br>` +
    `${d.wild_boars_sampled} cinghiali, ${d.samples_tested} campioni e ${d.isolates_with_ast_and_wgs} isolati sottoposti a WGS/AST; ` +
    `${d.amr_gene_positive_isolates} isolati non patogeni con geni AMR (` +
    `${d.amr_genes_detected.join(', ')}).<br>` +
    `<small>Province di Sassari e Nuoro, 2020-2022; dato wildlife aggregato, non comunale.</small>`;
}).catch(() => {});
fetch('public/data/food_chain_amr_berchidda.json').then(r => r.json()).then(d => {
  const card = document.getElementById('food-chain-amr-card');
  const culture = d.cultures.find(item => item.culture_id === 'SR56');
  card.hidden = false;
  card.innerHTML = `<strong>AMR filiera alimentare · Berchidda</strong><br>` +
    `${d.cultures.length} colture storiche da due caseifici anonimi; nella SR56 crescita sopra i cut-off per ` +
    `${culture.phenotypic_growth_above_cutoff.join(', ')} e gene <code>${culture.resistance_genes_detected.join(', ')}</code>.<br>` +
    `<small>${d.interpretation_note}</small>`;
}).catch(() => {});
fetch('public/data/environmental_amr_water_bodies_2024.json').then(r => r.json()).then(d => {
  const card = document.getElementById('environmental-amr-card');
  const bidighinzu = d.water_bodies.find(item => item.water_body_id === 'lake_bidighinzu');
  const cabras = d.water_bodies.find(item => item.water_body_id === 'cabras_lagoon');
  card.hidden = false;
  card.innerHTML = `<strong>AMR ambientale 2024 · due corpi idrici</strong><br>` +
    `${d.resistome_summary.annotated_arg_count} ARG in ${d.resistome_summary.drug_resistance_class_count} classi; <code>emrB</code> tra i più abbondanti.<br>` +
    `<small>${d.archive_snapshot.field_shotgun_wgs_runs} run shotgun di campo, quattro campagne stagionali. ARG + elementi mobili: ` +
    `${bidighinzu.arg_mge_positive_contigs}/${bidighinzu.arg_positive_contigs} contig nel Bidighinzu; ` +
    `${cabras.arg_mge_positive_contigs}/${cabras.arg_positive_contigs} a Cabras. ` +
    `Patogeni potenziali, inclusi ESKAPE, più abbondanti nel Bidighinzu. ` +
    `Risultati aggregati, non prevalenza clinica.</small>`;
}).catch(() => {});
fetch('public/data/literature_curated_sardinia.json').then(r => r.json()).then(d => {
  const card = document.getElementById('literature-card');
  const body = document.getElementById('literature-table-body');
  if (body) {
    body.innerHTML = d.records
      .slice()
      .sort((a, b) => b.year - a.year)
      .map(record => `<tr><td>${record.year}</td><td><a href="${record.source_url}" target="_blank" rel="noreferrer">${record.pmid}</a></td><td>${escapeHtml(record.hosts.join(', '))}</td><td>${escapeHtml(record.organisms.join(', '))}</td><td>${escapeHtml(record.title)}</td><td><a class="table-action" href="evidence.html?id=${encodeURIComponent(record.study_id)}">Apri scheda</a></td></tr>`)
      .join('');
  }
  return fetch('public/data/literature_curated_summary.json').then(r => r.json()).then(summary => {
    const hosts = summary.hosts.slice(0, 4).map(x => `${x.host} (${x.study_count})`).join(', ');
    card.hidden = false;
    card.innerHTML = `<strong>Letteratura AMR Sardegna</strong><br>${d.records.length} studi curati (${summary.year_min}-${summary.year_max}). Host principali: ${hosts}.<br><a class="inline-action" href="evidence.html">Apri l’elenco completo delle evidenze →</a>`;
  });
}).catch(() => {});
fetch('public/data/aifa_osmed_2024_antibiotics.json').then(r => r.json()).then(d => {
  const card = document.getElementById('aifa-card');
  const top = d.records.slice(0, 3).map(x => `${x.active_ingredient} (${x.ddd_1000_ab_die} DDD/1000 ab die)`).join('; ');
  card.hidden = false;
  card.innerHTML = `<strong>AIFA/OsMed Sardegna 2024</strong><br>Principali antibiotici convenzionati: ${top}<br><small>Consumo, non resistenza.</small>`;
}).catch(() => {});
fetch('public/data/bdn_ovicaprini_sardegna_2025.json').then(r => r.json()).then(d => {
  const card = document.getElementById('bdn-card');
  const values = Object.fromEntries(d.records.map(x => [x.species, x.heads.toLocaleString('it-IT')]));
  card.hidden = false;
  card.innerHTML = `<strong>BDN Sardegna – patrimonio ovicaprino</strong><br>31/12/2025: ${values.OVINI} ovini; ${values.CAPRINI} caprini.<br><small>Aggregato regionale di contesto, non indicatore AMR.</small>`;
}).catch(() => {});
fetch('public/data/bdn_bovini_sardegna_2025.json').then(r => r.json()).then(d => {
  const card = document.getElementById('bdn-bov-card');
  const values = Object.fromEntries(d.records.map(x => [x.species, x.heads.toLocaleString('it-IT')]));
  card.hidden = false;
  card.innerHTML = `<strong>BDN Sardegna – bovini e bufalini</strong><br>31/12/2025: ${values.BOVINI} bovini; ${values.BUFALINI} bufalini.<br><small>Aggregato regionale di contesto, non indicatore AMR.</small>`;
}).catch(() => {});
fetch('public/data/bdn_suini_sardegna_2025.json').then(r => r.json()).then(d => {
  const card = document.getElementById('bdn-suini-card');
  card.hidden = false;
  card.innerHTML = `<strong>BDN Sardegna – suini</strong><br>31/12/2025: ${d.records[0].heads.toLocaleString('it-IT')} capi.<br><small>Aggregato regionale di contesto, non indicatore AMR.</small>`;
}).catch(() => {});
const configs = [
  { key: 'municipalities', label: 'Comuni', file: 'public/geography/atlas_municipalities.geojson', color: '#2d7d61', weight: 0.65, fill: false, prop: 'Nome' },
  { key: 'provinces', label: 'Province', file: 'public/geography/atlas_provinces.geojson', color: '#d2763b', weight: 2, fill: false, prop: 'NOME' },
  { key: 'regions', label: 'Regione', file: 'public/geography/atlas_regions.geojson', color: '#173f59', weight: 3, fill: false, prop: 'Nome' },
  { key: 'veterinaryMunicipal', label: 'Evidenze AMR veterinarie comunali', file: 'public/data/veterinary_amr_municipal_evidence.geojson', color: '#c16f24', weight: 1.4, fill: true, prop: 'municipality' },
  { key: 'humanFacilityEvidence', label: 'Evidenze AMR umane di struttura', file: 'public/data/human_amr_facility_evidence.geojson', color: '#9e2744', weight: 1.2, fill: true, prop: 'facility' },
  { key: 'foodChainMunicipal', label: 'AMR filiera alimentare · Berchidda', file: 'public/data/food_chain_amr_berchidda.geojson', color: '#6f8428', weight: 2, fill: true, prop: 'municipality' },
  { key: 'hydro', label: 'Corsi d’acqua principali', file: 'public/data/dbgt_corsi_principali.geojson', color: '#2f78b7', weight: 1.2, fill: false, prop: 'Nome' },
  { key: 'arissSites', label: 'Laboratori partecipanti AR-ISS 2024', file: 'public/data/ar_iss_2024_sardinia_sites.geojson', color: '#c73e55', weight: 1, fill: true, prop: 'site_name' },
  { key: 'depuratori', label: 'Depuratori SIRA', file: 'public/data/sira_depuratori_points.geojson', color: '#7b3f98', weight: 1, fill: true, prop: 'DENOMINAZIONE' }
];

function style(cfg) { return { color: cfg.color, weight: cfg.key === 'hydro' ? 1.1 : cfg.weight, opacity: cfg.key === 'hydro' ? 0.55 : 1, fillColor: cfg.color, fillOpacity: cfg.key === 'veterinaryMunicipal' ? 0.26 : (cfg.fill ? 0.12 : 0) }; }
function popup(feature, cfg) {
  const props = feature.properties || {};
  if (cfg.key === 'veterinaryMunicipal') {
    const blocks = [];
    if (props.has_uberis_wgs) {
      const antibiotics = (props.uberis_resistant_antimicrobials || []).map(escapeHtml).join(', ');
      const genes = (props.uberis_resistance_genes || []).map(escapeHtml).join(', ');
      blocks.push(`<b><i>Streptococcus uberis</i> · ${escapeHtml(props.uberis_period)}</b><br>` +
        `${props.uberis_study_isolates} isolati da mastite ovina; ` +
        `${props.uberis_isolates_with_any_resistance}/${props.uberis_study_isolates} resistenti ad almeno un antimicrobico; ` +
        `${props.uberis_resistant_test_results}/${props.uberis_total_test_results} esiti resistenti. ` +
        `Antimicrobici con resistenza: ${antibiotics || 'nessuno'}.` +
        `${genes ? ` Geni rilevati: ${genes}.` : ''}`);
    }
    if (props.has_izs_catalogue) {
      const organisms = (props.izs_organisms || []).map(escapeHtml).join(', ');
      const antibiotics = (props.izs_resistant_antibiotics || []).map(escapeHtml).join(', ');
      blocks.push(`<b>Bioresource IZS · ${escapeHtml(props.izs_period)}</b><br>` +
        `${props.izs_catalogue_isolates} ceppi ovini di catalogo; ` +
        `${props.izs_resistant_test_results}/${props.izs_total_test_results} esiti resistenti. ` +
        `Organismi: ${organisms || 'non specificati'}. Antimicrobici con resistenza: ${antibiotics || 'nessuno'}.`);
    }
    return `<strong>${escapeHtml(props.municipality)} · evidenza AMR veterinaria</strong><br>` +
      `${blocks.join('<hr>')}<br><small>Fonti selettive: identificazione nel comune di origine del campione, non prevalenza o rischio comunale. I conteggi delle fonti non vanno sommati.</small>`;
  }
  if (cfg.key === 'humanFacilityEvidence') {
    const organisms = (props.organisms || []).map(escapeHtml).join(', ');
    return `<strong>${escapeHtml(props.facility)}</strong><br>` +
      `${escapeHtml(props.headline)}<br>${escapeHtml(props.detail)}<br>` +
      `<small>${escapeHtml(props.period)} · ${organisms}. ${escapeHtml(props.geography_note)}</small>`;
  }
  if (cfg.key === 'foodChainMunicipal') {
    const cultures = (props.cultures || []).map(culture => {
      const phenotype = (culture.phenotypic_growth_above_cutoff || []).map(escapeHtml).join(', ') || 'nessuna';
      const genes = (culture.resistance_genes_detected || []).map(escapeHtml).join(', ');
      return `<b>${escapeHtml(culture.culture_id)}</b>: crescita sopra cut-off per ${phenotype}${genes ? `; gene ${genes}` : ''}`;
    }).join('<br>');
    return `<strong>Berchidda · AMR nella filiera alimentare</strong><br>${cultures}<br>` +
      `<small>${escapeHtml(props.period)}. ${escapeHtml(props.interpretation_note)} I caseifici A e B non sono localizzati.</small>`;
  }
  if (cfg.key === 'arissSites') {
    const note = props.location_note ? `<br><small>${props.location_note}</small>` : '';
    return `<strong>${props.site_name}</strong><br>${props.municipality} (${props.province})<br><small>Laboratorio partecipante alla rete AR-ISS 2024. Il punto indica la sede del laboratorio. Copertura regionale ${props.coverage_percent_region}%; non e' prevalenza comunale o provinciale.</small>${note}`;
  }
  const title = props[cfg.prop] || cfg.label;
  const code = props.CIstat || props.CBelfiore || '';
  return `<strong>${title}</strong>${code ? `<br><small>Codice: ${code}</small>` : ''}`;
}

Promise.all(configs.map(async cfg => {
  const response = await fetch(cfg.file);
  if (!response.ok) throw new Error(`${cfg.label}: HTTP ${response.status}`);
  const data = await response.json();
  const layer = L.geoJSON(data, {
    style: () => style(cfg),
    pointToLayer: (feature, latlng) => {
      if (cfg.key === 'depuratori') return L.circleMarker(latlng, { radius: 3.5, color: '#555', fillColor: '#555', fillOpacity: 0.7, weight: 1 });
      if (cfg.key === 'arissSites') return L.circleMarker(latlng, { radius: 6, color: '#8e2237', fillColor: '#c73e55', fillOpacity: 0.82, weight: 1.2 });
      if (cfg.key === 'humanFacilityEvidence') return L.circleMarker(latlng, { radius: 6, color: '#762034', fillColor: '#9e2744', fillOpacity: 0.88, weight: 1.2 });
      return undefined;
    },
    onEachFeature: (feature, item) => item.bindPopup(popup(feature, cfg))
  });
  layer._sourceData = data;
  layers[cfg.key] = layer;
  return layer;
})).then(loaded => {
  layers.regions.addTo(map);
  layers.provinces.addTo(map);
  layers.municipalities.addTo(map);
  layers.veterinaryMunicipal.addTo(map);
  layers.humanFacilityEvidence.addTo(map);
  const categories = [...new Set((layers.depuratori._sourceData.features || []).map(f => f.properties?.categoria).filter(Boolean))];
  const categoryLayers = {};
  const categoryColors = { 'Acque reflue urbane': '#2878b5', 'Fosse Imhoff': '#d98c22', 'Industriale': '#b83b5e', 'Acque oleose': '#6a4c93', 'Fanghi/reflui speciali': '#555555' };
  categories.forEach(category => {
    categoryLayers[category] = L.geoJSON(layers.depuratori._sourceData, {
      filter: feature => feature.properties?.categoria === category,
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 3.5, color: categoryColors[category] || '#555555', fillColor: categoryColors[category] || '#555555', fillOpacity: 0.8, weight: 1 }),
      onEachFeature: (feature, item) => item.bindPopup(popup(feature, configs.find(c => c.key === 'depuratori')))
    });
  });
  const waterAndPlantLayers = {
    '<span class="layer-group-label">Corsi d’acqua principali</span>': layers.hydro
  };
  categories.forEach(category => {
    const color = categoryColors[category] || '#555555';
    waterAndPlantLayers[`<span class="layer-swatch" style="background:${color}"></span>Depuratori SIRA · ${escapeHtml(category)}`] = categoryLayers[category];
  });
  L.control.layers({
    'OpenStreetMap': osm,
    'Satellite Esri': satellite
  }, {
    'Comuni': layers.municipalities,
    'Province': layers.provinces,
    'Regione': layers.regions,
    '<span class="layer-swatch" style="background:#c16f24"></span>AMR veterinaria · evidenze comunali': layers.veterinaryMunicipal,
    '<span class="layer-swatch" style="background:#9e2744"></span>AMR umana · evidenze di struttura': layers.humanFacilityEvidence,
    '<span class="layer-swatch" style="background:#6f8428"></span>AMR filiera alimentare · Berchidda': layers.foodChainMunicipal,
    ...waterAndPlantLayers,
    '<span class="layer-swatch" style="background:#c73e55"></span>AMR umana · laboratori AR-ISS 2024': layers.arissSites
  }, { collapsed: false }).addTo(map);
  map.fitBounds(layers.regions.getBounds(), { padding: [20, 20] });
  document.getElementById('status').textContent = 'Layer caricati';
  applyAmrFilter(targetSelect.value);
}).catch(error => {
  document.getElementById('status').textContent = 'Errore di caricamento';
  console.error(error);
});

