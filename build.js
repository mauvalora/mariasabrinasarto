#!/usr/bin/env node
/* ============================================================
   BUILD.JS — pre-renderizza contenuti.js dentro index.html
             e tiene sitemap.xml allineata
   ============================================================
   Perché serve: agenda, FAQ, rassegna stampa, riconoscimenti e
   galleria vengono normalmente scritti nella pagina da JavaScript,
   leggendo contenuti.js al caricamento. Comodo per l'editor
   (gestione.html), ma molti crawler (motori di ricerca "semplici",
   e probabilmente i bot degli assistenti IA) non eseguono
   JavaScript: senza questo script vedrebbero le sezioni vuote.

   Questo script legge contenuti.js, genera lo stesso identico HTML
   che il browser produrrebbe con JavaScript, e lo scrive già dentro
   index.html, tra marcatori dedicati. Il JavaScript in index.html
   resta invariato e ri-genera comunque il contenuto ad ogni
   caricamento pagina: il testo "cotto" da questo script serve solo
   a chi non esegue JavaScript (crawler, anteprime, ecc.), per i
   visitatori normali non cambia nulla.

   In più, lo script rigenera sitemap.xml: aggiorna la data della
   home a oggi, aggiorna quella di mappa-contestuale.html e dei PDF
   in base alla loro data di modifica reale su disco, e aggiunge da
   solo un URL per ogni PDF allegato in rassegna stampa (campo "pdf"
   delle voci di D.stampa in contenuti.js) che non fosse già elencato.

   Uso: dopo aver modificato i contenuti con gestione.html (che
   salva contenuti.js), esegui prima del commit/push:

       node build.js

   Va rilanciato ogni volta che contenuti.js cambia. Se te ne
   dimentichi il sito continua a funzionare correttamente per i
   visitatori (il JavaScript compensa), ma i crawler senza
   JavaScript vedranno contenuti non aggiornati fino al prossimo
   build, e la sitemap non rifletterà gli ultimi aggiornamenti.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENUTI_PATH = path.join(ROOT, 'contenuti.js');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://mariasabrinasarto.it';

function loadSiteData() {
  const sandbox = { window: {} };
  const code = fs.readFileSync(CONTENUTI_PATH, 'utf8');
  const fn = new Function('window', code);
  fn(sandbox.window);
  return sandbox.window.SITE_DATA || {};
}

function esc(s) {
  s = (s == null ? '' : String(s));
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── stessi render della sezione <script> in index.html ──

function renderAgenda(D) {
  const ev = D.agenda || [];
  return ev.length
    ? ev.map(function (e) {
        return '<div class="event"><div class="date"><div class="d">' + esc(e.giorno) +
               '</div><div class="m">' + esc(e.mese) + '</div></div>' +
               '<div class="info"><h4>' + esc(e.titolo) + '</h4><p>' + esc(e.dettagli) + '</p></div></div>';
      }).join('')
    : '<p class="section-lead" style="margin:0;">Nessun appuntamento in programma al momento.</p>';
}

function renderFaq(D) {
  const fq = D.faq || [];
  return fq.length
    ? fq.map(function (f) {
        return '<details><summary>' + esc(f.domanda) + '</summary><p>' + (f.risposta || '') + '</p></details>';
      }).join('')
    : '<p class="section-lead" style="margin:0;">Nessuna domanda inserita al momento.</p>';
}

function renderStampa(D) {
  const st = D.stampa || [];
  return st.length
    ? st.map(function (p) {
        const extra = (p.pdf && p.pdf.trim())
          ? '<a class="press-pdf" href="' + esc(p.pdf) + '" target="_blank" rel="noopener">Leggi l\u2019articolo in PDF \u2192</a>'
          : '';
        const steso = (p.url && p.url.trim())
          ? '<a class="press-link" href="' + esc(p.url) + '" target="_blank" rel="noopener" aria-label="' + esc(p.titolo) + '"></a>'
          : '';
        return '<div class="press-item">' + steso + '<div class="src">' + esc(p.testata) +
               '</div><h4>' + esc(p.titolo) + '</h4><div class="date">' + esc(p.data) + '</div>' +
               extra + '</div>';
      }).join('')
    : '<p class="section-lead" style="margin:0;">Nessun articolo disponibile al momento.</p>';
}

function renderRiconoscimenti(D) {
  const doc = D.riconoscimenti || [];
  return doc.length
    ? doc.map(function (d) {
        const isPdf = /\.pdf$/i.test(d.file || '');
        const thumb = isPdf
          ? '<div class="thumb pdf">📄</div>'
          : '<div class="thumb"><img src="' + esc(d.file) + '" alt="' + esc(d.titolo) + '" loading="lazy"></div>';
        return '<a class="doc-item" href="' + esc(d.file) + '" target="_blank" rel="noopener">' + thumb +
               '<div class="body"><div class="cat">' + esc(d.categoria) + '</div><h4>' + esc(d.titolo) + '</h4>' +
               '<p>' + esc(d.descrizione) + '</p><div class="date">' + esc(d.data) + '</div></div></a>';
      }).join('')
    : '<p class="section-lead" style="margin:0;">Nessun documento disponibile al momento.</p>';
}

function renderGalleria(D) {
  const gal = D.galleria || [];
  if (!gal.length) return '<p class="section-lead" style="margin:0;">La galleria fotografica sar\u00e0 aggiornata a breve.</p>';
  const ordine = [], gruppi = {};
  gal.forEach(function (g, i) {
    const s = (g.sezione || '').trim() || 'Altre immagini';
    if (!gruppi[s]) { gruppi[s] = []; ordine.push(s); }
    gruppi[s].push({ g: g, i: i });
  });
  return ordine.map(function (s) {
    const cards = gruppi[s].map(function (o) {
      const g = o.g;
      const cap = g.didascalia || g.titolo || '';
      const isVideo = g.tipo === 'video';
      const src = isVideo ? (g.poster || g.file) : g.file;
      return '<button type="button" class="gallery-item' + (isVideo ? ' is-video' : '') +
             '" data-idx="' + o.i + '" title="' + esc(cap) + '">' +
             '<img src="' + esc(encodeURI(src)) + '" alt="' + esc(cap) + '" loading="lazy">' +
             (isVideo ? '<span class="play-badge" aria-hidden="true"></span>' : '') + '</button>';
    }).join('');
    return '<div class="gallery-group"><h3 class="subsection-title">' + esc(s) + '</h3>' +
           '<div class="gallery-grid">' + cards + '</div></div>';
  }).join('');
}

const TARGETS = [
  { id: 'agenda-list', render: renderAgenda },
  { id: 'faq-list', render: renderFaq },
  { id: 'press-grid', render: renderStampa },
  { id: 'doc-grid', render: renderRiconoscimenti },
  { id: 'gallery-grid', render: renderGalleria },
];

function bake() {
  const D = loadSiteData();
  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  let changed = 0;

  TARGETS.forEach(function (t) {
    const start = '<!--STATIC:' + t.id + ':START-->';
    const end = '<!--STATIC:' + t.id + ':END-->';
    const re = new RegExp(
      start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    if (!re.test(html)) {
      console.warn('Attenzione: marcatori non trovati per #' + t.id + ' — sezione saltata.');
      return;
    }
    const fresh = t.render(D);
    html = html.replace(re, start + fresh + end);
    changed++;
  });

  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('build.js: ' + changed + '/' + TARGETS.length + ' sezioni aggiornate in index.html.');

  return D;
}

// ── SITEMAP ──────────────────────────────────────────────────
// Data nel formato AAAA-MM-GG a partire dalla data di modifica reale
// del file su disco. Se il file non esiste (es. non ancora salvato),
// usa oggi come ripiego.
function lastmodOf(relPath) {
  try {
    const stat = fs.statSync(path.join(ROOT, relPath));
    return stat.mtime.toISOString().slice(0, 10);
  } catch (e) {
    return oggi();
  }
}

function oggi() {
  return new Date().toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority, commento) {
  const righe = [];
  if (commento) righe.push('  <!-- ' + commento + ' -->');
  righe.push('  <url>');
  righe.push('    <loc>' + SITE_URL + loc + '</loc>');
  righe.push('    <lastmod>' + lastmod + '</lastmod>');
  righe.push('    <changefreq>' + changefreq + '</changefreq>');
  righe.push('    <priority>' + priority + '</priority>');
  righe.push('  </url>');
  return righe.join('\n');
}

function buildSitemap(D) {
  const entries = [];

  entries.push(urlEntry(
    '/', oggi(), 'weekly', '1.0',
    'Pagina principale: programma, percorso, documenti, riconoscimenti,\n' +
    '       galleria, FAQ, agenda, rassegna stampa, informazioni di voto, contatti'
  ));

  entries.push(urlEntry(
    '/mappa-contestuale.html', lastmodOf('mappa-contestuale.html'), 'monthly', '0.8',
    'Mappa contestuale interattiva del programma (15 aree, 4 cluster)'
  ));

  entries.push(urlEntry(
    '/documenti/programma-sarto-2026.pdf', lastmodOf('documenti/programma-sarto-2026.pdf'), 'monthly', '0.9',
    'Programma elettorale completo (PDF)'
  ));

  entries.push(urlEntry(
    '/documenti/cv-maria-sabrina-sarto.pdf', lastmodOf('documenti/cv-maria-sabrina-sarto.pdf'), 'monthly', '0.7',
    'Curriculum vitae in formato Europass (PDF)'
  ));

  // PDF allegati alle voci della rassegna stampa (campo "pdf" in contenuti.js):
  // trovati automaticamente, così non serve aggiungerli a mano ogni volta.
  const notiLoc = new Set(['/mappa-contestuale.html',
    '/documenti/programma-sarto-2026.pdf', '/documenti/cv-maria-sabrina-sarto.pdf']);
  const stampa = D.stampa || [];
  stampa.forEach(function (p) {
    if (!p.pdf || !p.pdf.trim()) return;
    const loc = '/' + p.pdf.replace(/^\/+/, '');
    if (notiLoc.has(loc)) return; // evita duplicati se in futuro coincidesse con altro
    notiLoc.add(loc);
    const nota = (p.testata || 'Rassegna stampa') + (p.data ? ', ' + p.data : '') + ' — copia dell’articolo (PDF)';
    entries.push(urlEntry(encodeURI(loc), lastmodOf(p.pdf), 'yearly', '0.5', nota));
  });

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n' +
    entries.join('\n\n') + '\n\n</urlset>\n';

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log('build.js: sitemap.xml aggiornata (' + entries.length + ' URL).');
}

const dati = bake();
buildSitemap(dati);
