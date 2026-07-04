# Sito — Candidatura Maria Sabrina Sarto · Sapienza 2026–2032

Guida rapida per aggiornare e pubblicare il sito. Non serve alcun software particolare: basta un editor di testo (o Claude) per modificare `index.html`.

## Struttura della cartella

```
sito/
├── index.html                      ← la pagina principale del sito
├── gestione.html                   ← EDITOR: gestisce agenda, FAQ e rassegna stampa
├── contenuti.js                    ← i contenuti modificabili (generato dall'editor)
├── mappa-contestuale.html          ← la mappa interattiva (versione v5)
├── anteprima-social.png            ← immagine mostrata quando il link è condiviso
├── LEGGIMI.md                      ← questa guida
└── documenti/
    ├── programma-sarto-2026.pdf    ← programma completo
    └── cv-maria-sabrina-sarto.pdf  ← curriculum Europass
```

Tutti i collegamenti sono **relativi**: la cartella `sito/` funziona sia aperta localmente (doppio clic su `index.html`) sia caricata così com'è su un hosting.

## Gestire agenda, FAQ e rassegna stampa (senza toccare il codice)

Queste tre sezioni si aggiornano tramite la pagina **`gestione.html`**, senza modificare l'HTML. Il flusso è:

1. Apri `gestione.html` nel browser (doppio clic sul file).
2. Scegli la scheda **Agenda**, **FAQ** o **Rassegna stampa**.
3. Usa i pulsanti per **creare** (`+ Nuovo…`), **modificare**, **riordinare** (↑ ↓) o **eliminare** una voce.
4. Premi **💾 Salva contenuti.js**:
   - Su **Chrome/Edge** puoi salvare direttamente: scegli il file `contenuti.js` nella cartella `sito/` e conferma la sostituzione.
   - Sugli **altri browser** viene scaricato un `contenuti.js`: spostalo nella cartella `sito/` sovrascrivendo il precedente.
5. Apri (o aggiorna) `index.html`: le modifiche sono già visibili.

Il pulsante **📂 Carica contenuti.js** serve a ricaricare nell'editor i contenuti attuali (utile se lavori da un altro computer o riprendi in un secondo momento). **👁 Anteprima sito** apre `index.html` in una nuova scheda.

I contenuti vivono tutti nel file `contenuti.js`: se preferisci, puoi anche modificarlo con un editor di testo, ma l'editor è il modo consigliato per evitare errori.

> Nota FAQ: nel campo *Risposta* puoi inserire un link con `<a href="https://...">testo</a>`.

## Cosa completare prima della pubblicazione

### Informazioni di voto (sezione `id="voto"` in `index.html`)

Questa sezione è già compilata con i dati ufficiali (decreto n. 971 dell'11.05.2026: calendario delle tornate di ottobre 2026, voto elettronico online, quorum del 30%, elettorato attivo, link ufficiali). Non è gestita dall'editor: se le informazioni cambiano, aggiornala direttamente in `index.html`. Le fonti sono la [pagina elezioni Sapienza](https://www.uniroma1.it/it/pagina/elezioni-rettore-2026) e il relativo decreto di indizione.

### Silenzio elettorale automatico

La sezione contatti si **oscura da sola** nei periodi di silenzio elettorale (dalle 24 ore prima dell'apertura di ogni tornata fino alla chiusura del voto): al posto dell'email compare un avviso e la voce "Contatti" sparisce dal menu. Le date sono già impostate secondo il calendario ufficiale. Se il calendario cambia, modifica l'array `FINESTRE` nello script in fondo a `index.html` (ogni riga ha `da`, `a` e `nome` della tornata; gli orari sono in ora italiana con offset `+02:00` fino al 25 ottobre e `+01:00` dal 26).

## Meta tag per la condivisione social

Nella parte alta di `index.html` (dentro `<head>`) c'è questa riga da aggiornare **dopo** aver scelto l'indirizzo definitivo del sito:

```html
<meta property="og:url" content="https://SOSTITUIRE-CON-URL-DEFINITIVO">
```

Inseriscici l'URL reale (es. `https://sarto2026.it`). L'immagine di anteprima è `anteprima-social.png`: puoi sostituirla con un'altra immagine mantenendo lo stesso nome, oppure cambiare il nome nei tag `og:image` e `twitter:image`.

## Aggiornare la mappa contestuale

Se produci una nuova versione della mappa, sostituisci il file `mappa-contestuale.html` mantenendo lo stesso nome: i link nel sito continueranno a funzionare senza altre modifiche.

## Come pubblicare il sito

Il sito è statico, quindi si può pubblicare gratuitamente o a basso costo. Alcune opzioni:

- **Netlify / Vercel / Cloudflare Pages** — trascini la cartella `sito/` e ottieni un indirizzo pubblico in pochi minuti.
- **GitHub Pages** — se preferisci gestirlo tramite un repository.
- **Hosting tradizionale** — carichi il contenuto di `sito/` via FTP nella cartella pubblica del dominio.

In tutti i casi carica l'**intera cartella** `sito/` (inclusi `documenti/`, `contenuti.js` e `gestione.html`), non solo `index.html`.

> Suggerimento: se pubblichi il sito online, la pagina `gestione.html` sarà raggiungibile da chiunque ne conosca l'indirizzo. Non contiene dati riservati (solo l'editor dei contenuti pubblici), ma se preferisci puoi non caricarla online e usarla solo in locale: ti basta modificare `contenuti.js` sul tuo computer e ricaricare solo quel file.

## Nota

Le funzioni che richiedono un backend (blog ad accesso ristretto @uniroma1.it, sondaggi, moduli di raccolta proposte, newsletter con archiviazione delle email) non sono incluse: richiedono un servizio di hosting con autenticazione e database. Possono essere aggiunte in un secondo momento.

---
*I materiali di questo progetto restano riservati all'area di lavoro locale e non vanno divulgati.*
