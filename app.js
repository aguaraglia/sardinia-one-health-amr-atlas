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
  const label = event.target.selectedOptions[0]?.textContent || 'target selezionato';
  document.getElementById('amr-state').textContent = `Nessuna osservazione pubblica caricata per ${label}`;
});
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
  { key: 'hydro', label: 'Corsi d’acqua principali', file: 'public/data/dbgt_corsi_principali.geojson', color: '#2f78b7', weight: 1.2, fill: false, prop: 'Nome' },
  { key: 'arissSites', label: 'AR-ISS sedi comunali 2024', file: 'public/data/ar_iss_2024_sardinia_sites.geojson', color: '#c73e55', weight: 1, fill: true, prop: 'site_name' },
  { key: 'depuratori', label: 'Depuratori SIRA', file: 'public/data/sira_depuratori_points.geojson', color: '#7b3f98', weight: 1, fill: true, prop: 'DENOMINAZIONE' }
];

function style(cfg) { return { color: cfg.color, weight: cfg.key === 'hydro' ? 2 : cfg.weight, opacity: cfg.key === 'hydro' ? 0.85 : 1, fillColor: cfg.color, fillOpacity: cfg.fill ? 0.12 : 0 }; }
function popup(feature, cfg) {
  const props = feature.properties || {};
  if (cfg.key === 'arissSites') {
    return `<strong>${props.site_name}</strong><br>${props.municipality} (${props.province})<br><small>Sede comunale della rete AR-ISS 2024. Copertura regionale ${props.coverage_percent_region}%; non e' prevalenza comunale o provinciale.</small>`;
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
  layers.arissSites.addTo(map);
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
  const plantMenu = L.control({ position: 'topright' });
  plantMenu.onAdd = () => {
    const el = L.DomUtil.create('div', 'leaflet-control plant-menu');
    el.innerHTML = `<details><summary>Depuratori SIRA</summary><label><input type="checkbox" data-plant-all> Tutti</label>${categories.map(c => `<label><input type="checkbox" data-plant-cat="${c}"> ${c}</label>`).join('')}</details>`;
    L.DomEvent.disableClickPropagation(el);
    el.querySelector('[data-plant-all]').addEventListener('change', e => categories.forEach(c => { const cb=el.querySelector(`[data-plant-cat="${c}"]`); cb.checked=e.target.checked; (e.target.checked ? categoryLayers[c].addTo(map) : map.removeLayer(categoryLayers[c])); }));
    el.querySelectorAll('[data-plant-cat]').forEach(cb => cb.addEventListener('change', e => e.target.checked ? categoryLayers[e.target.dataset.plantCat].addTo(map) : map.removeLayer(categoryLayers[e.target.dataset.plantCat])));
    return el;
  }; plantMenu.addTo(map);
  L.control.layers({
    'OpenStreetMap': osm,
    'Satellite Esri': satellite
  }, {
    'Comuni': layers.municipalities,
    'Province': layers.provinces,
    'Regione': layers.regions,
    'Corsi d’acqua principali': layers.hydro,
    'AR-ISS sedi comunali 2024': layers.arissSites
  }, { collapsed: false }).addTo(map);
  map.fitBounds(layers.regions.getBounds(), { padding: [20, 20] });
  document.getElementById('status').textContent = 'Layer caricati';
}).catch(error => {
  document.getElementById('status').textContent = 'Errore di caricamento';
  console.error(error);
});

