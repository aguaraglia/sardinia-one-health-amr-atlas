const assetRoot = document.documentElement.lang === 'en' ? '../' : '';
const isEn = document.documentElement.lang === 'en';
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function renderLiteratureTable(records) {
  const body = document.getElementById('literature-table-body');
  if (!body) return;
  const sheetLabel = isEn ? 'Open record' : 'Apri scheda';
  const emptyLabel = isEn ? 'No curated studies in this dataset.' : 'Nessuno studio curato in questo dataset.';
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="6">${emptyLabel}</td></tr>`;
    return;
  }
  body.innerHTML = records
    .slice()
    .sort((a, b) => b.year - a.year)
    .map(record => {
      const title = escapeHtml(record.title || '');
      const href = record.source_url ? escapeHtml(record.source_url) : '';
      const titleCell = href
        ? `<a href="${href}" target="_blank" rel="noreferrer">${title}</a>`
        : title;
      const pmid = record.pmid ? escapeHtml(String(record.pmid)) : '—';
      const hosts = escapeHtml((record.hosts || []).join(', '));
      const organisms = escapeHtml((record.organisms || []).join(', '));
      const sheet = record.study_id
        ? `<a class="table-action" href="${assetRoot}evidence.html?id=${encodeURIComponent(record.study_id)}">${sheetLabel}</a>`
        : '—';
      return `<tr><td>${record.year || '—'}</td><td>${pmid}</td><td>${hosts}</td><td>${organisms}</td><td>${titleCell}</td><td>${sheet}</td></tr>`;
    })
    .join('');
}
fetch(`${assetRoot}public/data/literature_curated_sardinia.json`).then(r => r.json()).then(d => {
  renderLiteratureTable(d.records || []);
}).catch(() => {
  const body = document.getElementById('literature-table-body');
  if (body) body.innerHTML = `<tr><td colspan="6">${isEn ? 'Literature dataset unavailable.' : 'Dataset della letteratura non disponibile.'}</td></tr>`;
});