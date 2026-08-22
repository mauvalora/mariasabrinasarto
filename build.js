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
        const inner = '<div class="press-item"><div class="src">' + esc(p.testata) +
                    '</div><h4>' + esc(p.titolo) + '</h4><div class="date">' + esc(p.data) + '</div></div>';
        return (p.url && p.url.trim())
          ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + inner + '</a>'
          : inner;
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
  return gal.length
    ? gal.map(function (g, i) {
        return '<button type="button" class="gallery-item" data-idx="' + i + '"><img src="' + esc(g.file) + '" alt="' + esc(g.didascalia || g.titolo || '') + '" loading="lazy"></button>';
      }).join('')
    : '<p class="section-lead" style="margin:0;">La galleria fotografica sarà aggiornata a breve.</p>';
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
