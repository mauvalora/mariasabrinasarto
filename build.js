#!/usr/bin/env node
/* ============================================================
   BUILD.JS — pre-renderizza contenuti.js dentro index.html
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

   Uso: dopo aver modificato i contenuti con gestione.html (che
   salva contenuti.js), esegui prima del commit/push:

       node build.js

   Va rilanciato ogni volta che contenuti.js cambia. Se te ne
   dimentichi il sito continua a funzionare correttamente per i
   visitatori (il JavaScript compensa), ma i crawler senza
   JavaScript vedranno contenuti non aggiornati fino al prossimo
   build.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENUTI_PATH = path.join(ROOT, 'contenuti.js');
const INDEX_PATH = path.join(ROOT, 'index.html');

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
}

bake();
