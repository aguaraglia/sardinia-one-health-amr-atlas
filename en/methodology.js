const italianToEnglish = new Map([
  ['LETTURA DEL CRUSCOTTO', 'READING THE DASHBOARD'],
  ['Il dato mappato è un’evidenza documentata, non automaticamente una prevalenza.', 'Mapped data are documented evidence, not automatically prevalence.'],
  ['L’atlante pubblico separa dati comunali, strutture sanitarie, sorveglianza regionale, evidenze ambientali e letteratura curata.', 'The public atlas separates municipal data, healthcare facilities, regional surveillance, environmental evidence and curated literature.'],
  ['Pubblico', 'Public'], ['Aggregato', 'Aggregated'], ['Regole principali', 'Core rules'],
  ['Geografia', 'Geography'],
  ['I poligoni comunali indicano evidenze con un riferimento comunale pubblicabile. I punti ospedalieri indicano la sede della struttura, non la residenza dei pazienti. I laboratori AR-ISS indicano sedi partecipanti alla rete, non prevalenze locali.', 'Municipal polygons indicate evidence with a publishable municipal reference. Hospital points indicate the facility location, not patient residence. AR-ISS laboratories indicate participating facilities, not local prevalence.'],
  ['Filtri AMR', 'AMR filters'],
  ['Classi antimicrobiche e target PNCAR filtrano solo proprietà esplicitamente presenti nei dataset pubblici. Se un risultato è in un layer spento, il cruscotto lo segnala e permette di attivare il layer pertinente.', 'Antimicrobial classes and PNCAR targets filter only properties explicitly present in public datasets. If a result is in an inactive layer, the dashboard reports it and lets users enable the relevant layer.'],
  ['Periodo', 'Period'],
  ['Il filtro temporale usa anni presenti nelle proprietà pubbliche: periodo di campionamento, studio o sorveglianza quando disponibili. Non ricostruisce serie temporali non pubblicate.', 'The time filter uses years available in public properties: sampling, study or surveillance period where available. It does not reconstruct unpublished time series.'],
  ['Privacy', 'Privacy'],
  ['Coordinate di campione, aziende, allevamenti, macelli identificabili e dati puntuali sensibili restano fuori dalla parte pubblica. La pubblicazione usa solo aggregati o localizzazioni istituzionali già compatibili con il rilascio pubblico.', 'Sample coordinates, businesses, farms, identifiable slaughterhouses and sensitive point data remain outside the public version. Publication uses only aggregated data or institutional locations already compatible with public release.'],
  ['BENCHMARK EUROPEO', 'EUROPEAN BENCHMARK'],
  ['Soglie e cautele ispirate alle dashboard EFSA/ECDC', 'Thresholds and cautions inspired by EFSA/ECDC dashboards'],
  ['Le dashboard EFSA/ECDC sono usate qui come riferimento di lettura: aiutano a distinguere evidenza, copertura e interpretazione. Non aggiungono automaticamente dati locali alla Sardegna.', 'EFSA/ECDC dashboards are used here as an interpretive reference: they help distinguish evidence, coverage and interpretation. They do not automatically add local data for Sardinia.'],
  ['non mostrato', 'not shown'], ['rara', 'rare'], ['molto bassa', 'very low'], ['bassa', 'low'], ['moderata', 'moderate'], ['alta', 'high'], ['molto alta', 'very high'], ['estrema', 'extreme'],
  ['Dati mancanti', 'Missing data'],
  ['Un comune, una struttura o una classe AMR non visualizzati non indicano assenza di resistenza. Possono indicare layer spento, dato non pubblicabile, dato non disponibile o numerosità insufficiente.', 'A municipality, facility or AMR class not displayed does not indicate absence of resistance. It may indicate an inactive layer, non-publishable data, unavailable data or insufficient sample size.'],
  ['Percentuali', 'Percentages'],
  ['Le soglie percentuali sono applicabili solo quando esistono denominatore, anno, matrice e metodo comparabili. Le evidenze bibliografiche puntuali restano marcatori documentali.', 'Percentage thresholds apply only when denominator, year, matrix and method are comparable. Individual bibliographic evidence remains documentary evidence.'],
  ['Lettura umana, veterinaria, alimentare e ambientale va mantenuta integrata ma separata nei layer: aggregare senza denominatori omogenei produrrebbe indicatori fuorvianti.', 'Human, veterinary, food-chain and environmental readings should remain integrated but separate in layers: aggregation without homogeneous denominators would produce misleading indicators.'],
  ['BENCHMARK GLOBALE', 'GLOBAL BENCHMARK'],
  ['WHO GLASS come cornice di sorveglianza AMR/AMU', 'WHO GLASS as an AMR/AMU surveillance framework'],
  ['GLASS è usato come riferimento metodologico globale per separare dati di resistenza, uso di antimicrobici, qualità della sorveglianza e indicatori di policy. I profili GLASS sono nazionali o sovranazionali: non vengono proiettati sulla mappa comunale sarda.', 'GLASS is used as a global methodological reference to distinguish resistance data, antimicrobial use, surveillance quality and policy indicators. GLASS profiles are national or supranational; they are not projected onto Sardinian municipal maps.'],
  ['AMR umana', 'Human AMR'], ['Uso antimicrobici', 'Antimicrobial use'],
  ['Tipi di evidenza', 'Evidence types'], ['Tipo', 'Type'], ['Cosa significa', 'What it means'], ['Cosa non significa', 'What it does not mean'],
  ['Comune', 'Municipality'], ['Struttura sanitaria', 'Healthcare facility'], ['Sorveglianza regionale', 'Regional surveillance'], ['Ambiente', 'Environment'], ['Letteratura', 'Literature'],
  ['Regola sui target PNCAR', 'PNCAR target rule'], ['Prossimi rafforzamenti', 'Next improvements']
]);

const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const original = node.nodeValue.trim();
  const translated = italianToEnglish.get(original);
  if (translated) node.nodeValue = node.nodeValue.replace(original, translated);
}
