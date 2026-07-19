const embeddedModuleOne = [
  {
    label: 'Le parole giuste', title: 'Un ombrello, quattro famiglie',
    intro: '“Antimicrobico” è il termine generale. Un antibiotico è un antimicrobico rivolto ai batteri: non è il nome di tutti i farmaci contro le infezioni.',
    visual: `<div class="antimicrobial-umbrella"><div class="umbrella-label">ANTIMICROBICI</div><div class="umbrella-line" aria-hidden="true"></div><div class="family-grid"><div><span class="microbe-icon bacteria-icon" aria-hidden="true">▰ · ▰</span><strong>Antibiotici</strong><small>batteri</small><p>penicilline, cefalosporine, macrolidi</p></div><div><span class="microbe-icon virus-icon" aria-hidden="true">✺</span><strong>Antivirali</strong><small>virus</small><p>farmaci per influenza, HIV, epatiti</p></div><div><span class="microbe-icon fungi-icon" aria-hidden="true">Y</span><strong>Antifungini</strong><small>funghi</small><p>azoli, echinocandine</p></div><div><span class="microbe-icon parasite-icon" aria-hidden="true">∿</span><strong>Antiparassitari</strong><small>parassiti</small><p>antimalarici, antielmintici</p></div></div></div>`,
    takeaway: 'Idea chiave: AMR comprende la resistenza di batteri, virus, funghi e parassiti; “antibiotico-resistenza” riguarda i batteri.',
    sources: [['WHO · AMR fact sheet, 2026','https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance']]
  },
  {
    label: 'Il bersaglio conta', title: 'Batteri e virus non sono la stessa cosa',
    intro: 'Gli antibiotici possono uccidere i batteri o frenarne la crescita. Non agiscono sui virus, che si replicano usando le cellule dell’ospite.',
    visual: `<div class="target-compare"><article class="target-yes"><span aria-hidden="true">✓</span><h4>Possibile bersaglio batterico</h4><p>Un’infezione urinaria può essere causata da batteri. La scelta dell’antibiotico dipende dal quadro clinico e, quando indicato, dagli esami.</p></article><article class="target-no"><span aria-hidden="true">×</span><h4>Non è un bersaglio antibiotico</h4><p>Raffreddore e influenza sono in genere virali. Un antibiotico non elimina il virus e non abbrevia automaticamente i sintomi.</p></article></div><p class="clinical-caveat"><strong>Attenzione:</strong> sintomi simili possono avere cause diverse e possono comparire complicanze batteriche. La valutazione spetta al professionista sanitario.</p>`,
    takeaway: 'Esempio quotidiano: “ho la febbre” non identifica da solo il microrganismo né il farmaco adatto.',
    sources: [['ECDC · Factsheet per il pubblico','https://www.ecdc.europa.eu/en/antimicrobial-resistance/facts/factsheets/general-public'],['AIFA · Uso consapevole 2025','https://www.aifa.gov.it/campagna-sull-uso-consapevole-degli-antibiotici-2025']]
  },
  {
    label: 'Come funzionano', title: 'Ogni antibiotico colpisce un processo preciso',
    intro: 'I batteri hanno strutture e processi propri. Classi diverse di antibiotici interferiscono con bersagli differenti, e nessun antibiotico è attivo contro tutti i batteri.',
    visual: `<div class="mechanism-grid"><article><span class="mechanism-mark wall-mark" aria-hidden="true"></span><h4>Parete cellulare</h4><p>Alcuni farmaci impediscono di costruire o mantenere l’involucro batterico.</p><small>Esempio di classe: β-lattamici</small></article><article><span class="mechanism-mark ribosome-mark" aria-hidden="true"></span><h4>Sintesi proteica</h4><p>Altri bloccano i ribosomi batterici e la produzione di proteine.</p><small>Esempi: macrolidi, tetracicline</small></article><article><span class="mechanism-mark dna-mark" aria-hidden="true"></span><h4>DNA e metabolismo</h4><p>Altri ancora ostacolano replicazione del DNA o vie metaboliche essenziali.</p><small>Esempi: fluorochinoloni, sulfamidici</small></article></div>`,
    takeaway: '“Spettro ampio” non significa “migliore”: indica attività su una gamma più ampia di batteri e richiede comunque un uso appropriato.',
    sources: [['ECDC · Che cosa sono gli antibiotici','https://www.ecdc.europa.eu/en/antimicrobial-resistance/facts/factsheets/general-public']]
  },
  {
    label: 'Che cosa diventa resistente', title: 'È il batterio a diventare resistente, non la persona',
    intro: 'In una popolazione batterica possono esistere varianti con caratteristiche diverse. L’esposizione a un antibiotico seleziona quelle capaci di sopravvivere.',
    visual: `<div class="selection-flow"><div><strong>1</strong><span class="bacteria-pop" aria-label="Popolazione con batteri sensibili e resistenti">● ● ● ◆ ●</span><p>Variabilità nella popolazione</p></div><i aria-hidden="true">→</i><div><strong>2</strong><span class="antibiotic-dose" aria-hidden="true">capsula</span><p>Pressione dell’antibiotico</p></div><i aria-hidden="true">→</i><div><strong>3</strong><span class="bacteria-pop resistant" aria-label="Sopravvivono batteri resistenti">◆ ◆ ◆</span><p>I resistenti sopravvivono e si moltiplicano</p></div></div><div class="myth-fact"><p><b>Non significa:</b> “il mio corpo si è abituato”.</p><p><b>Significa:</b> quel microrganismo non risponde più come prima a uno o più farmaci.</p></div>`,
    takeaway: 'La resistenza può emergere naturalmente; uso eccessivo o inappropriato accelera selezione e diffusione dei microrganismi resistenti.',
    sources: [['ECDC · Cause della resistenza','https://www.ecdc.europa.eu/en/antimicrobial-resistance/facts/factsheets/general-public'],['WHO · AMR fact sheet, 2026','https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance']]
  },
  {
    label: 'Perché è importante', title: 'L’efficacia degli antibiotici sostiene la medicina moderna',
    intro: 'Quando un’infezione è resistente, la terapia può richiedere più tempo, esami aggiuntivi o farmaci di seconda linea. Anche procedure comuni diventano più rischiose.',
    visual: `<div class="impact-layout"><div class="impact-stat"><strong>1 su 6</strong><p>infezioni batteriche comuni, confermate in laboratorio nel mondo nel 2023, risultava resistente agli antibiotici considerati dal rapporto WHO.</p><small>Stima globale: non descrive automaticamente una regione o un ospedale.</small></div><div class="modern-medicine"><h4>Antibiotici efficaci proteggono anche</h4><ul><li>chirurgia e terapia intensiva</li><li>chemioterapia e trapianti</li><li>cura delle infezioni in persone fragili</li></ul></div></div><div class="burden-note"><strong>2021:</strong> 4,71 milioni di decessi stimati <em>associati</em> all’AMR batterica; 1,14 milioni <em>attribuibili</em>. Sono due misure epidemiologiche diverse, non intercambiabili.</div>`,
    takeaway: 'I numeri globali spiegano la scala del problema; per decisioni locali servono dati locali con copertura e denominatori dichiarati.',
    sources: [['WHO · Global surveillance report 2025','https://www.who.int/publications/i/item/9789240116337'],['GBD 2021 AMR Collaborators · Lancet 2024','https://doi.org/10.1016/S0140-6736(24)01867-1']]
  },
  {
    label: 'Dalla conoscenza all’azione', title: 'Proteggere l’efficacia è un lavoro condiviso',
    intro: 'Non esiste un singolo gesto risolutivo. Servono diagnosi, prescrizioni appropriate, prevenzione delle infezioni, sorveglianza e accesso equo alle cure.',
    visual: `<div class="action-grid"><article><strong>Persone</strong><p>Usare antibiotici solo dopo valutazione e prescrizione; non condividere né riutilizzare avanzi; chiedere al farmacista come smaltirli.</p></article><article><strong>Professionisti</strong><p>Integrare quadro clinico, diagnostica, linee guida e dati locali; rivalutare terapia, dose e durata.</p></article><article><strong>Sistemi sanitari</strong><p>Prevenire infezioni, vaccinare, sorvegliare resistenze e consumi, garantire qualità di laboratori e farmaci.</p></article></div><div class="aware-strip"><span><b>Access</b> prima scelta quando appropriata</span><span><b>Watch</b> uso mirato e monitorato</span><span><b>Reserve</b> ultima risorsa in situazioni selezionate</span></div>`,
    takeaway: 'La classificazione WHO AWaRe guida la stewardship: non è una lista per l’automedicazione e va applicata con linee guida e resistenze locali.',
    sources: [['AIFA · Uso consapevole 2025','https://www.aifa.gov.it/campagna-sull-uso-consapevole-degli-antibiotici-2025'],['WHO · AWaRe antibiotic book','https://www.who.int/news-room/questions-and-answers/item/the-who-essential-medicines-list-antibiotic-book']]
  }
];

function renderEmbeddedModuleOne(detail, deckUrl) {
  let slideIndex = 0;
  detail.classList.add('has-embedded-deck');
  detail.innerHTML = `<section class="embedded-deck" tabindex="0" aria-label="Presentazione incorporata: Antibiotici e antimicrobici"><header class="embedded-deck-head"><div><span class="embedded-book" aria-hidden="true">▤</span><strong>Antibiotici e antimicrobici</strong></div><span id="embedded-counter">1 / ${embeddedModuleOne.length}</span></header><div id="embedded-slide-stage" class="embedded-slide-stage" aria-live="polite"></div><footer class="embedded-deck-controls"><button type="button" id="embedded-prev" class="deck-control" aria-label="Scheda precedente"><span aria-hidden="true">←</span> Precedente</button><div id="embedded-dots" class="embedded-dots" aria-label="Seleziona una scheda"></div><button type="button" id="embedded-next" class="deck-control primary">Successiva <span aria-hidden="true">→</span></button></footer></section><div class="embedded-after"><p><strong>Modulo completo.</strong> Sei schede consultabili online, con fonti istituzionali e distinzione tra evidenza, esempio e indicazione sanitaria.</p><a class="inline-action" href="${deckUrl}" download>Scarica anche la versione PowerPoint <span aria-hidden="true">↓</span></a></div>`;
  const stage = detail.querySelector('#embedded-slide-stage');
  const counter = detail.querySelector('#embedded-counter');
  const dots = detail.querySelector('#embedded-dots');
  const prev = detail.querySelector('#embedded-prev');
  const next = detail.querySelector('#embedded-next');
  dots.innerHTML = embeddedModuleOne.map((_, i) => `<button type="button" data-slide="${i}" aria-label="Vai alla scheda ${i + 1}"></button>`).join('');
  function paintSlide() {
    const slide = embeddedModuleOne[slideIndex];
    stage.innerHTML = `<article class="embedded-slide"><p class="embedded-slide-label">${slide.label}</p><h2>${slide.title}</h2><p class="embedded-slide-intro">${slide.intro}</p><div class="embedded-visual">${slide.visual}</div><p class="embedded-takeaway"><span aria-hidden="true">i</span>${slide.takeaway}</p><div class="embedded-sources"><strong>Fonti della scheda</strong>${slide.sources.map(([name,url]) => `<a href="${url}" target="_blank" rel="noreferrer">${name} <span aria-hidden="true">↗</span></a>`).join('')}</div></article>`;
    counter.textContent = `${slideIndex + 1} / ${embeddedModuleOne.length}`;
    prev.disabled = slideIndex === 0;
    next.disabled = slideIndex === embeddedModuleOne.length - 1;
    next.innerHTML = slideIndex === embeddedModuleOne.length - 1 ? 'Fine del modulo <span aria-hidden="true">✓</span>' : 'Successiva <span aria-hidden="true">→</span>';
    dots.querySelectorAll('button').forEach((dot, i) => { dot.classList.toggle('is-active', i === slideIndex); dot.setAttribute('aria-current', i === slideIndex ? 'step' : 'false'); });
  }
  prev.addEventListener('click', () => { if (slideIndex > 0) { slideIndex -= 1; paintSlide(); } });
  next.addEventListener('click', () => { if (slideIndex < embeddedModuleOne.length - 1) { slideIndex += 1; paintSlide(); } });
  dots.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { slideIndex = Number(button.dataset.slide); paintSlide(); }));
  detail.querySelector('.embedded-deck').addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' && slideIndex < embeddedModuleOne.length - 1) { slideIndex += 1; paintSlide(); }
    if (event.key === 'ArrowLeft' && slideIndex > 0) { slideIndex -= 1; paintSlide(); }
  });
  paintSlide();
}