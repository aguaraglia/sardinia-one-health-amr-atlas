const map = L.map('map', { zoomControl: true }).setView([40.12, 9.05], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

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
  const label = amrTargets.find(([value]) => value === event.target.value)?.[1] || 'classe selezionata';
  document.getElementById('amr-state').textContent = `Nessuna osservazione pubblica caricata per ${label}`;
});
fetch('../public/data/ar_iss_2024_coverage.json').then(r => r.json()).then(d => {
  const card = document.getElementById('ariss-card');
  card.hidden = false;
  card.innerHTML = `<strong>AR-ISS Sardegna 2024</strong><br>${d.reported_value}% copertura della sorveglianza<br><small>Indicatore di copertura, non prevalenza AMR.</small>`;
}).catch(() => {});
fetch('../public/data/ar_iss_2024_sardinia_resistance.json').then(r => r.json()).then(d => {
  const card = document.getElementById('ariss-resistance-card');
  const rows = d.observations.map(x => `<tr><td>${x.phenotype}</td><td>${x.resistance_percent}%</td><td>${x.resistant}/${x.isolates}</td></tr>`).join('');
  card.hidden = false;
  card.innerHTML = `<strong>AR-ISS Sardegna 2024 - resistenza</strong><br><small>Copertura ${d.coverage_percent}%</small><table class="evidence-table"><tr><th>Fenotipo</th><th>%</th><th>R/n</th></tr>${rows}</table>`;
}).catch(() => {});
fetch('../public/data/aifa_osmed_2024_antibiotics.json').then(r => r.json()).then(d => {
  const card = document.getElementById('aifa-card');
  const top = d.records.slice(0, 3).map(x => `${x.active_ingredient} (${x.ddd_1000_ab_die} DDD/1000 ab die)`).join('; ');
  card.hidden = false;
  card.innerHTML = `<strong>AIFA/OsMed Sardegna 2024</strong><br>Principali antibiotici convenzionati: ${top}<br><small>Consumo, non resistenza.</small>`;
}).catch(() => {});
const configs = [
  { key: 'municipalities', label: 'Comuni', file: '../public/geography/atlas_municipalities.geojson', color: '#2d7d61', weight: 0.65, fill: false, prop: 'Nome' },
  { key: 'provinces', label: 'Province', file: '../public/geography/atlas_provinces.geojson', color: '#d2763b', weight: 2, fill: false, prop: 'NOME' },
  { key: 'regions', label: 'Regione', file: '../public/geography/atlas_regions.geojson', color: '#173f59', weight: 3, fill: false, prop: 'Nome' }
];

function style(cfg) { return { color: cfg.color, weight: cfg.weight, fillColor: cfg.color, fillOpacity: cfg.fill ? 0.12 : 0 }; }
function popup(feature, cfg) {
  const props = feature.properties || {};
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
    onEachFeature: (feature, item) => item.bindPopup(popup(feature, cfg))
  });
  layers[cfg.key] = layer;
  return layer;
})).then(loaded => {
  layers.regions.addTo(map);
  layers.provinces.addTo(map);
  layers.municipalities.addTo(map);
  L.control.layers({}, {
    'Comuni': layers.municipalities,
    'Province': layers.provinces,
    'Regione': layers.regions
  }, { collapsed: false }).addTo(map);
  map.fitBounds(layers.regions.getBounds(), { padding: [20, 20] });
  document.getElementById('status').textContent = '3 layer caricati';
}).catch(error => {
  document.getElementById('status').textContent = 'Errore di caricamento';
  console.error(error);
});
