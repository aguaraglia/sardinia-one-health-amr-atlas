const replacements = [
  ['Tutte le classi', 'All classes'], ['Beta-lattamici', 'Beta-lactams'], ['Carbapenemi', 'Carbapenems'],
  ['Cefalosporine di terza generazione', 'Third-generation cephalosporins'], ['Fluorochinoloni', 'Fluoroquinolones'],
  ['Aminoglicosidi', 'Aminoglycosides'], ['Tetracicline', 'Tetracyclines'], ['Macrolidi', 'Macrolides'],
  ['Glicopeptidi', 'Glycopeptides'], ['Colistina', 'Colistin'], ['Multiresistenza', 'Multidrug resistance'],
  ['elementi compatibili visibili sulla mappa.', 'compatible items visible on the map.'],
  ['evidenza compatibile è in layer non attivi.', 'compatible evidence item is in inactive layers.'],
  ['evidenze compatibili sono in layer non attivi.', 'compatible evidence items are in inactive layers.'],
  ['Nessuna evidenza compatibile nei layer attivi, ma ci sono risultati disponibili in layer spenti.', 'No compatible evidence is in active layers, but results are available in inactive layers.'],
  ['Nessuna evidenza pubblica compatibile con questo filtro. Il dataset pubblico non contiene valori mappabili per questa combinazione.', 'No compatible public evidence is available for this filter. The public dataset has no mappable values for this combination.'],
  ['elementi non mostrati nell’elenco', 'items not shown in the list'], [' risultati', ' results'],
  ['Attiva ', 'Enable '], ['Periodo non pubblicato', 'Period not published'], ['Evidenza pubblica', 'Public evidence'],
  ['Fonte', 'Source'], ['Layer caricati', 'Layers loaded'], ['Errore di caricamento', 'Loading error'],
  ['Comuni', 'Municipalities'], ['Province', 'Provinces'], ['Corsi d’acqua principali', 'Main watercourses'],
  ['Depuratori SIRA', 'SIRA treatment plants'], ['Laboratori partecipanti AR-ISS 2024', 'AR-ISS participating laboratories 2024'],
  ['AMR veterinaria', 'Veterinary AMR'], ['AMR umana di struttura', 'Human facility AMR'], ['AMR filiera alimentare', 'Food-chain AMR'],
  ['Laboratori AR-ISS', 'AR-ISS laboratories'], ['Satellite Esri', 'Esri satellite'], ['OpenStreetMap', 'OpenStreetMap']
];

const localizeDashboard = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    let value = node.nodeValue;
    for (const [italian, english] of replacements) value = value.replaceAll(italian, english);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
};

new MutationObserver(localizeDashboard).observe(document.body, { childList: true, subtree: true });
localizeDashboard();
