const assetRoot = document.documentElement.lang === 'en' ? '../' : '';
const root = document.getElementById('evidence-root');
const isEnglish = document.documentElement.lang === 'en';
if (isEnglish) {
  const evidenceTranslations = new Map([
    ['← Torna all’elenco delle evidenze', '← Back to evidence directory'], ['SCHEDA PUBBLICA', 'PUBLIC RECORD'],
    ['In sintesi', 'Summary'], ['Ambito e rappresentatività', 'Scope and representativeness'], ['Periodo', 'Period'],
    ['Geografia pubblica', 'Public geography'], ['Organismi', 'Organisms'], ['Interpretazione e limiti', 'Interpretation and limits'],
    ['Fonte bibliografica', 'Bibliographic source'], ['Uso nell’atlante', 'Use in the atlas'], ['Apri la mappa', 'Open map'],
    ['Descrizione', 'Description'], ['Risultati fenotipici', 'Phenotypic results'], ['Risultati fenotipici e genomici', 'Phenotypic and genomic results'],
    ['Risultati genomici', 'Genomic results'], ['Indicatori pubblicati', 'Published indicators'], ['Regola di pubblicazione', 'Publication rule'],
    ['Metadati', 'Metadata'], ['Esplora', 'Explore'], ['Torna alla mappa', 'Back to map'], ['Apri scheda →', 'Open record →'],
    ['Evidenze e fonti', 'Evidence and sources'], ['Registro pubblico curato · Sardinia One Health AMR Atlas', 'Curated public register · Sardinia One Health AMR Atlas'],
    ['fonti verificate', 'verified sources'], ['Dataset e indicatori', 'Datasets and indicators'], ['Letteratura AMR curata', 'Curated AMR literature'],
    ['Scheda non trovata', 'Record not found'], ['Seleziona una fonte dall’elenco pubblico.', 'Select a source from the public directory.'],
    ['Vai alle evidenze', 'Go to evidence'], ['Impossibile caricare la scheda', 'Unable to load the record'], ['Riprova dall’elenco delle evidenze.', 'Try again from the evidence directory.']
  ]);
  const localizeEvidence = () => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const translation = evidenceTranslations.get(node.nodeValue.trim());
      if (translation) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), translation);
    }
  };
  new MutationObserver(localizeEvidence).observe(root, { childList: true, subtree: true });
}
const id = new URLSearchParams(location.search).get('id');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list = values => (values || []).map(esc).join(', ') || 'non specificato';
const link = url => url ? `<a class="source-link" href="${esc(url)}" target="_blank" rel="noreferrer">Apri fonte originale ↗</a>` : '';

const datasetFiles = {
  izs_sa07_02_north_sardinia_amr: 'public/data/izs_sa07_02_north_sardinia_amr.json',
  pig_ecoli_sardinia_2024_amr: 'public/data/pig_ecoli_sardinia_2024_amr.json',
  wild_boar_ecoli_sardinia_2024_amr: 'public/data/wild_boar_ecoli_sardinia_2024_amr.json',
  veterinary_amr_municipal_evidence: 'public/data/veterinary_amr_municipal_evidence.json',
  environmental_amr_water_bodies_2024: 'public/data/environmental_amr_water_bodies_2024.json',
  ar_iss_2024_sardinia_resistance: 'public/data/ar_iss_2024_sardinia_resistance.json'
};
const datasetTitles = {
  pig_ecoli_sardinia_2024_amr: 'E. coli nella filiera suina sarda',
  wild_boar_ecoli_sardinia_2024_amr: 'E. coli nei cinghiali della Sardegna',
  veterinary_amr_municipal_evidence: 'Evidenze AMR veterinarie comunali',
  environmental_amr_water_bodies_2024: 'Resistoma ambientale nei corpi idrici sardi',
  ar_iss_2024_sardinia_resistance: 'AR-ISS Sardegna 2024 · resistenza'
};

function header(title, subtitle, tags = []) {
  return `<a class="back-link" href="index.html#literature-title">← Torna all’elenco delle evidenze</a>
    <div class="evidence-heading"><div><p class="section-kicker">SCHEDA PUBBLICA</p><h2>${esc(title)}</h2><p class="evidence-subtitle">${esc(subtitle || '')}</p></div><div class="tag-list">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`;
}

function literaturePage(record) {
  const title = record.title;
  const subtitle = `${record.year} · ${record.public_geography || 'Sardegna'}`;
  return header(title, subtitle, [...(record.hosts || []), ...(record.amr_evidence || [])]) +
    `<div class="evidence-layout"><article class="evidence-article">
      <section><h3>In sintesi</h3><p>Studio su ${list(record.organisms)} in ${list(record.matrix)}. La fonte documenta evidenze ${list(record.amr_evidence)} per ${list(record.hosts)}.</p></section>
      <section><h3>Ambito e rappresentatività</h3><dl class="fact-list"><div><dt>Periodo</dt><dd>${esc(record.period || 'non riportato')}</dd></div><div><dt>Geografia pubblica</dt><dd>${esc(record.public_geography || 'Sardegna')}</dd></div><div><dt>Host</dt><dd>${list(record.hosts)}</dd></div><div><dt>Organismi</dt><dd>${list(record.organisms)}</dd></div></dl></section>
      <section><h3>Interpretazione e limiti</h3><p>${esc(record.notes || 'I dati sono riferiti al disegno dello studio e non costituiscono automaticamente una prevalenza regionale o comunale.')}</p></section>
    </article><aside class="evidence-rail"><div class="source-box"><h3>Fonte bibliografica</h3><p><strong>${esc(record.pmid || 'Record bibliografico')}</strong></p><p>${esc(record.doi || '')}</p>${link(record.source_url)}</div><div class="source-box"><h3>Uso nell’atlante</h3><p>La fonte è mostrata come evidenza curata. Non vengono inferiti dati per comuni o popolazioni non presenti nella pubblicazione.</p><a class="button-link" href="index.html">Apri la mappa</a></div></aside></div>`;
}

function datasetPage(data) {
  let title = data.source_title || data.title || datasetTitles[data.source_id] || data.source_id;
  let subtitle = `${data.period || data.collection_period || ''} · ${data.geography || data.geography_level || ''}`;
  let summary = data.interpretation_note || data.notes || data.method_note || '';
  let results = '';
  if (data.antimicrobial_resistance) {
    results = `<h3>Risultati fenotipici</h3><div class="result-table-wrap"><table class="result-table"><thead><tr><th>Organismo</th><th>Antimicrobico</th><th>R/n</th><th>%</th></tr></thead><tbody>${data.antimicrobial_resistance.map(x => `<tr><td>${esc(x.organism)}</td><td>${esc(x.antimicrobial)}</td><td>${x.resistant}/${x.tested}</td><td>${x.resistance_percent}%</td></tr>`).join('')}</tbody></table></div>`;
  } else if (data.amr_phenotype) {
    results = `<h3>Risultati fenotipici e genomici</h3><div class="metric-grid"><div><strong>${data.amr_phenotype.isolates_resistant_to_at_least_one}/${data.isolates_analyzed}</strong><span>resistenti ad almeno un antimicrobico</span></div><div><strong>${data.amr_genotype.isolates_with_any_amr_gene}/${data.isolates_analyzed}</strong><span>con almeno un gene AMR</span></div><div><strong>${data.amr_genotype.most_common_gene_groups[0].group}</strong><span>classe genica più frequente</span></div></div>`;
  } else if (data.amr_gene_positive_isolates !== undefined) {
    results = `<h3>Risultati genomici</h3><div class="metric-grid"><div><strong>${data.amr_gene_positive_isolates}</strong><span>isolati con geni AMR</span></div><div><strong>${data.isolates_with_ast_and_wgs}</strong><span>isolati con AST e WGS</span></div><div><strong>${data.wild_boars_sampled}</strong><span>cinghiali campionati</span></div></div><p>Geni rilevati: ${list(data.amr_genes_detected)}.</p>`;
  } else if (data.observations) {
    results = `<h3>Indicatori pubblicati</h3><div class="result-table-wrap"><table class="result-table"><thead><tr><th>Fenotipo</th><th>Resistenti</th><th>Percentuale</th></tr></thead><tbody>${data.observations.map(x => `<tr><td>${esc(x.phenotype)}</td><td>${x.resistant}/${x.isolates}</td><td>${x.resistance_percent}%</td></tr>`).join('')}</tbody></table></div>`;
  }
  return header(title, subtitle, [data.geography_level || 'aggregato pubblico', data.privacy || 'public']) +
    `<div class="evidence-layout"><article class="evidence-article"><section><h3>Descrizione</h3><p>${esc(data.method_note || 'Dataset curato a partire dalla fonte originale.')}</p><p class="callout">${esc(summary)}</p></section><section>${results}</section><section><h3>Regola di pubblicazione</h3><p>Il livello geografico è quello esplicitamente documentato dalla fonte. Aziende, coordinate di campione e identificativi puntuali non vengono esposti in questa scheda.</p></section></article><aside class="evidence-rail"><div class="source-box"><h3>Metadati</h3><dl class="fact-list"><div><dt>Periodo</dt><dd>${esc(data.period || 'non riportato')}</dd></div><div><dt>Geografia</dt><dd>${esc(data.geography || data.geography_level || '')}</dd></div><div><dt>Fonte</dt><dd>${esc(data.source_id)}</dd></div></dl>${link(data.source_url)}</div><div class="source-box"><h3>Esplora</h3><a class="button-link" href="index.html">Torna alla mappa</a></div></aside></div>`;
}

Promise.all([fetch(`${assetRoot}public/data/literature_curated_sardinia.json`).then(r => r.json()), ...Object.values(datasetFiles).map(file => fetch(`${assetRoot}${file}`).then(r => r.json()))])
  .then(all => {
    const literature = all[0].records || [];
    if (!id) {
      const datasetList = all.slice(1).map(x => `<a class="directory-row" href="evidence.html?id=${encodeURIComponent(x.source_id)}"><span><strong>${esc(x.source_title || x.title || x.source_id)}</strong><small>${esc(x.geography || x.geography_level || '')} · ${esc(x.period || '')}</small></span><span>Apri scheda →</span></a>`).join('');
      const literatureList = literature.slice().sort((a,b) => b.year - a.year).map(x => `<a class="directory-row" href="evidence.html?id=${encodeURIComponent(x.study_id)}"><span><strong>${esc(x.title)}</strong><small>${x.year} · ${esc((x.public_geography || 'Sardegna'))}</small></span><span>Apri scheda →</span></a>`).join('');
      root.innerHTML = header('Evidenze e fonti', 'Registro pubblico curato · Sardinia One Health AMR Atlas', ['fonti verificate']) + `<div class="directory-layout"><section><h3>Dataset e indicatori</h3><div class="directory-list">${datasetList}</div></section><section><h3>Letteratura AMR curata</h3><div class="directory-list">${literatureList}</div></section></div>`;
      return;
    }
    const record = literature.find(x => x.study_id === id);
    if (record) { root.innerHTML = literaturePage(record); document.title = `${record.title} · AMR Atlas`; return; }
    const data = all.slice(1).find(x => x.source_id === id);
    if (data) { root.innerHTML = datasetPage(data); document.title = `${data.source_title || data.source_id} · AMR Atlas`; return; }
    root.innerHTML = `<div class="empty-state"><h2>Scheda non trovata</h2><p>Seleziona una fonte dall’elenco pubblico.</p><a class="button-link" href="index.html#literature-title">Vai alle evidenze</a></div>`;
  }).catch(() => { root.innerHTML = '<div class="empty-state"><h2>Impossibile caricare la scheda</h2><p>Riprova dall’elenco delle evidenze.</p></div>'; });
