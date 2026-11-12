// Renders modules 13–30 to 1280×720 PNGs plus a notes manifest.
// Uses the same CSS as the dissemination page and system Chrome.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('/tmp/pptxgen/node_modules/puppeteer-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/outreach-slides';
const port = 8765;

const dissemination = await readFile(path.join(root, 'assets/dissemination.js'), 'utf8');
const slugs = Function('return ' + dissemination.match(/const outreachDeckSlugs = (\[[\s\S]*?\]);/)[1])();

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/scripts/outreach-slide-frame.html`, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

const manifest = [];
const overflows = [];
for (let index = 12; index <= 29; index += 1) {
  const slug = slugs[index];
  const dir = path.join(outDir, String(index + 1).padStart(2, '0') + '-' + slug);
  await mkdir(dir, { recursive: true });
  const slides = [];
  for (let slide = 0; slide < 6; slide += 1) {
    const meta = await page.evaluate((moduleIndex, slideIndex) => {
      const config = additionalOutreachModules[moduleIndex];
      const item = config.slides[slideIndex];
      const frame = document.getElementById('frame');
      frame.innerHTML = `<article class="embedded-slide"><p class="embedded-slide-label">${item.label}</p><h2>${item.title}</h2><p class="embedded-slide-intro">${item.intro}</p><div class="embedded-visual">${item.visual}</div><p class="embedded-takeaway"><span aria-hidden="true">i</span>${item.takeaway}</p><div class="embedded-sources"><strong>Fonti della scheda</strong>${item.sources.map(([name, url]) => `<a href="${url}">${name} <span aria-hidden="true">↗</span></a>`).join('')}</div></article>`;
      const article = frame.querySelector('.embedded-slide');
      const box = frame.getBoundingClientRect();
      const links = [...article.querySelectorAll('.embedded-sources a')].map(anchor => {
        const r = anchor.getBoundingClientRect();
        return { name: anchor.textContent.replace(/\s+/g, ' ').trim(), url: anchor.getAttribute('href'), x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
      });
      return {
        label: item.label,
        title: item.title,
        intro: item.intro,
        takeaway: item.takeaway,
        visualText: article.querySelector('.embedded-visual').innerText,
        sources: item.sources,
        links,
        overflow: article.scrollHeight - article.clientHeight
      };
    }, index, slide);
    if (meta.overflow > 2) overflows.push(`${index + 1}.${slide + 1} +${meta.overflow}px ${meta.title}`);
    const file = path.join(dir, `slide${slide + 1}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    slides.push({ ...meta, file });
  }
  manifest.push({
    number: index + 1,
    slug,
    title: await page.evaluate(i => additionalOutreachModules[i].title, index),
    slides
  });
  process.stdout.write(`rendered ${index + 1} ${slug}\n`);
}

await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
await browser.close();
server.kill();
if (overflows.length) {
  console.log('OVERFLOWS');
  overflows.forEach(line => console.log(line));
} else {
  console.log('no overflow');
}
