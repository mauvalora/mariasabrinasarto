# Deploy di `mariasabrinasarto.net` su GitHub Pages

Procedura completa per pubblicare il sito statico contenuto in questa cartella
(`sito-deploy/`) su **GitHub Pages** con dominio personalizzato
`mariasabrinasarto.net`.

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
├── index.html              ← pagina principale (og:url già = https://mariasabrinasarto.net)
├── gestione.html           ← editor contenuti (agenda/FAQ/rassegna)
├── mappa-contestuale.html  ← mappa interattiva
├── contenuti.js            ← contenuti modificabili
├── CNAME                   ← contiene: mariasabrinasarto.net  (NON rinominare)
├── anteprima-social.png    ← immagine anteprima condivisioni
├── logo.png / logo-web.png
├── LEGGIMI.md
└── documenti/
    ├── programma-sarto-2026.pdf
    └── cv-maria-sabrina-sarto.pdf
```

Il file **`CNAME`** è ciò che dice a GitHub Pages di servire il sito sul dominio
personalizzato: deve restare nella root del repository.

---

## 1. Verificare la disponibilità del dominio

```bash
whois mariasabrinasarto.net | grep -iE "no match|not found|status|registrar"
```

- "No match for" / "NOT FOUND" → dominio **libero**, si può registrare.
- Altrimenti è già registrato: controlla `Registrar` ed eventuale `Expiry Date`.

(In alternativa: `dig +short NS mariasabrinasarto.net` — se non restituisce nulla
di solito è libero.)

---

## 2. Registrare il dominio  (passaggio MANUALE)

GitHub **non** vende domini. Acquista `mariasabrinasarto.net` presso un registrar
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
  -f "cname=mariasabrinasarto.net"
```

In alternativa via interfaccia web: repo → **Settings → Pages** → *Source:
Deploy from a branch* → **main** / **/(root)** → Save; poi *Custom domain* →
`mariasabrinasarto.net`.

Il sito provvisorio è intanto su: `https://mauvalora.github.io/mariasabrinasarto`

---

## 6. Configurare il DNS presso il registrar  (passaggio MANUALE)

Nel pannello DNS del registrar crea:

| Tipo  | Host / Nome | Valore                    | TTL   |
|-------|-------------|---------------------------|-------|
| A     | `@`         | `185.199.108.153`         | auto  |
| A     | `@`         | `185.199.109.153`         | auto  |
| A     | `@`         | `185.199.110.153`         | auto  |
| A     | `@`         | `185.199.111.153`         | auto  |
| CNAME | `www`       | `mauvalora.github.io.`       | auto  |

(Opzionali IPv6 – record **AAAA** su `@`: `2606:50c0:8000::153`,
`2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.)

Verifica la propagazione (può richiedere da minuti a ~24 h):

```bash
dig +short mariasabrinasarto.net        # deve mostrare i 4 IP 185.199.10x.153
dig +short www.mariasabrinasarto.net    # deve mostrare mauvalora.github.io
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

Fatto: il sito è online su **https://mariasabrinasarto.net** (e `www` reindirizza).

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
  (`https://mariasabrinasarto.net`).
