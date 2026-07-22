# Deploy di `mariasabrinasarto.it` su GitHub Pages

Procedura completa per pubblicare il sito statico contenuto in questa cartella
(`sito-deploy/`) su **GitHub Pages** con dominio personalizzato
`mariasabrinasarto.it`.

I comandi vanno eseguiti in un terminale **posizionato dentro questa cartella**
(`sito-deploy/`), su un computer con `git` e la GitHub CLI (`gh`) installati.

- Verifica strumenti: `git --version` e `gh --version`
- Se manca `gh`: https://cli.github.com (macOS: `brew install gh`)

> Nota riservatezza: pubblicare significa rendere pubblico **solo** il contenuto
> di questa cartella. Il resto del progetto resta locale.

---

## 0. Cosa contiene questa cartella

```
sito-deploy/
├── index.html              ← pagina principale (og:url già = https://mariasabrinasarto.it)
├── gestione.html           ← editor contenuti (agenda/FAQ/rassegna)
├── mappa-contestuale.html  ← mappa interattiva
├── contenuti.js            ← contenuti modificabili
├── CNAME                   ← contiene: mariasabrinasarto.it  (NON rinominare)
├── anteprima-social.png    ← immagine anteprima condivisioni
├── logo.png / logo-web.png
├── LEGGIMI.md
├── documenti/
│   ├── programma-sarto-2026.pdf
│   ├── cv-maria-sabrina-sarto.pdf
│   └── riconoscimenti/         ← premi/articoli mostrati nella sezione "Riconoscimenti"
└── galleria/                   ← foto mostrate nella sezione "Galleria"
```

Il file **`CNAME`** è ciò che dice a GitHub Pages di servire il sito sul dominio
personalizzato: deve restare nella root del repository.

---

## 1. Verificare la disponibilità del dominio

```bash
whois mariasabrinasarto.it | grep -iE "no match|not found|status|registrar"
```

- "No match for" / "NOT FOUND" → dominio **libero**, si può registrare.
- Altrimenti è già registrato: controlla `Registrar` ed eventuale `Expiry Date`.

(In alternativa: `dig +short NS mariasabrinasarto.it` — se non restituisce nulla
di solito è libero.)

---

## 2. Registrare il dominio  (passaggio MANUALE)

GitHub **non** vende domini. Acquista `mariasabrinasarto.it` presso un registrar
(Cloudflare, Namecheap, GoDaddy, Aruba… ~10–15 €/anno) con la tua carta.
Poi prosegui.

---

## 3. Autenticarsi su GitHub

```bash
gh auth status          # se già loggato, salta il passo successivo
gh auth login           # segui la procedura guidata nel browser
```

Ricava lo username (serve per il DNS del sottodominio `www`):

```bash
gh api user --jq .login
```

Chiamiamo `mauvalora` il valore restituito.

---

## 4. Creare il repository e pubblicare

Dalla cartella `sito-deploy/`:

```bash
# repository pubblico + push del contenuto attuale in un colpo solo
git init -b main
git add .
git commit -m "Sito candidatura Maria Sabrina Sarto"
gh repo create mariasabrinasarto --public --source=. --remote=origin --push
```

---

## 5. Attivare GitHub Pages + dominio personalizzato

```bash
# abilita Pages da branch main / root
gh api -X POST repos/mauvalora/mariasabrinasarto/pages \
  -f "source[branch]=main" -f "source[path]=/"

# imposta il dominio personalizzato (il file CNAME lo rende già persistente)
gh api -X PUT repos/mauvalora/mariasabrinasarto/pages \
  -f "cname=mariasabrinasarto.it"
```

In alternativa via interfaccia web: repo → **Settings → Pages** → *Source:
Deploy from a branch* → **main** / **/(root)** → Save; poi *Custom domain* →
`mariasabrinasarto.it`.

Il sito provvisorio è intanto su: `https://mauvalora.github.io/mariasabrinasarto`

---

## 6. Configurare il DNS su Aruba  (passaggio MANUALE)

Il dominio `mariasabrinasarto.it` è registrato presso **Aruba**. Di default Aruba
lo fa puntare al proprio hosting/parcheggio (record `A` verso `62.149.128.x`):
va sostituito con i record che puntano a GitHub.

**Dove:** area clienti Aruba → *I miei domini* → `mariasabrinasarto.it` →
**Gestione DNS / DNS e Name Server**. Se i record non sono modificabili, attiva
prima l'opzione **"DNS Aruba" / gestione DNS personalizzata** (o disattiva il
servizio di reindirizzamento/hosting che occupa il record `@`).

Imposta questi record (cancella prima il record `A` esistente verso
`62.149.128.40`):

| Tipo  | Nome / Host      | Valore / Destinazione | TTL   |
|-------|------------------|-----------------------|-------|
| A     | `@` (o vuoto)    | `185.199.108.153`     | auto  |
| A     | `@` (o vuoto)    | `185.199.109.153`     | auto  |
| A     | `@` (o vuoto)    | `185.199.110.153`     | auto  |
| A     | `@` (o vuoto)    | `185.199.111.153`     | auto  |
| CNAME | `www`            | `mauvalora.github.io.`| auto  |

(Opzionali IPv6 – record **AAAA** su `@`: `2606:50c0:8000::153`,
`2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.)

**Particolarità di Aruba da tenere presenti:**

- Il campo *Nome/Host* per l'apice va spesso lasciato **vuoto** (equivale a `@`);
  non scrivere il dominio per esteso.
- Se l'interfaccia non accetta 4 record `A` con lo stesso nome, **aggiungili uno
  alla volta** e salva tra uno e l'altro.
- Nel valore del CNAME `www` includi il **punto finale**: `mauvalora.github.io.`
- Se è attivo un "reindirizzamento web" o un "sito Aruba" preimpostato,
  **disattivalo**: altrimenti tiene occupato l'apice e i record `A` non hanno
  effetto.
- Aruba di solito propaga in fretta (minuti–qualche ora), ma può arrivare a ~24 h.
- Non toccare i **Name Server**: restano quelli Aruba (`dns.technorail.com`,
  `dns2.technorail.com`, ecc.); si cambiano solo i **record** all'interno.

Verifica la propagazione dal Mac (deve sparire `62.149.128.40`):

```bash
dig +short mariasabrinasarto.it        # deve mostrare i 4 IP 185.199.10x.153
dig +short www.mariasabrinasarto.it    # deve mostrare mauvalora.github.io
```

---

## 7. Forzare HTTPS

Quando GitHub ha verificato il dominio (in *Settings → Pages* sparisce l'avviso
giallo), attiva il certificato:

```bash
gh api -X PUT repos/mauvalora/mariasabrinasarto/pages \
  -F "https_enforced=true"
```

Oppure spunta **Enforce HTTPS** nella pagina Settings → Pages.

Fatto: il sito è online su **https://mariasabrinasarto.it** (e `www` reindirizza).

---

## 8. Domini alias / reindirizzamenti

Domini secondari da far puntare al dominio di riferimento
`mariasabrinasarto.it`:

- `mariasabrinasarto.eu`
- `mariasabrinasarto68.it`
- `mariasabrinasarto68.eu`

> Nota: GitHub Pages ospita **un solo** dominio personalizzato (quello nel file
> `CNAME`). Il reindirizzamento degli alias si fa quindi presso il registrar,
> non su GitHub: nessuna modifica al repo.

Tutti e tre sono su **Aruba**; si usa il servizio di reindirizzamento gratuito
incluso. Procedura da ripetere **identica per ciascun dominio**:

1. Area clienti Aruba → **I miei domini** → clicca sul dominio.
2. Apri **"Gestione" / "Modifica configurazione"** del dominio e scegli l'opzione
   **"Reindirizza il dominio verso un sito web esistente"** (o *"Reindirizzamento
   web"*).
3. Destinazione: `https://mariasabrinasarto.it`
4. Tipo di redirect: **301 (permanente)**; se disponibile, attiva l'inclusione di
   `www`.
5. Salva. Aruba imposta da sé i record DNS verso il proprio server di
   reindirizzamento.
6. Ripeti per gli altri due domini.

Verifica dopo la propagazione (minuti–qualche ora):

```bash
curl -I http://mariasabrinasarto.eu       # attesa: 301/302 → location: https://mariasabrinasarto.it
curl -I http://mariasabrinasarto68.it
curl -I http://mariasabrinasarto68.eu
```

Note:

- Passando a "reindirizzamento", Aruba **azzera la configurazione DNS
  precedente** del dominio: per domini di solo presidio è il comportamento
  voluto.
- Il redirect copre l'`http://`. Le versioni `https://` degli alias possono
  mostrare un avviso certificato (nessun certificato sul dominio-alias):
  accettabile per domini di presidio. Per coprire anche l'`https://` servirebbe
  un servizio come Cloudflare (cambio nameserver + Redirect Rule, con
  certificato automatico).

---

## Aggiornamenti futuri

Per pubblicare modifiche, dalla cartella `sito-deploy/`:

```bash
git add .
git commit -m "Aggiornamento contenuti"
git push
```

Le modifiche sono online in 1–2 minuti.

## Diagnostica rapida

```bash
gh api repos/mauvalora/mariasabrinasarto/pages   # stato Pages, dominio, HTTPS, build
```

- Errore dominio "not properly configured" → DNS non ancora propagato (attendi).
- 404 dopo il push → controlla che `index.html` sia nella root del repo.
- Anteprima social errata → verifica `og:url` in `index.html`
  (`https://mariasabrinasarto.it`).
