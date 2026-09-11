#!/usr/bin/env bash
# ============================================================
#  Scarica i font del sito e li rende locali (auto-ospitati)
# ============================================================
#  Perché: il sito usava i font dal CDN di Google, il che fa
#  trasmettere l'indirizzo IP di ogni visitatore ai server di
#  Google. Ospitandoli nella cartella del sito questo non accade
#  più, e le pagine caricano anche un po' più in fretta.
#
#  Uso:  bash scarica-font.sh
#  Va eseguito una sola volta (e di nuovo solo se si cambiano i font).
#  Richiede connessione a internet.
# ============================================================
set -euo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
DEST="$BASE/sito-deploy/font"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"

mkdir -p "$DEST"

echo "1/3  Scarico il foglio di stile…"
curl -fsS -A "$UA" "$URL" -o "$DEST/fonts.css"

echo "2/3  Scarico i file dei font…"
n=0
while read -r u; do
  f="$(basename "$u")"
  if [ ! -f "$DEST/$f" ]; then
    curl -fsS -A "$UA" "$u" -o "$DEST/$f"
  fi
  n=$((n+1))
done < <(grep -o 'https://fonts\.gstatic\.com[^)]*\.woff2' "$DEST/fonts.css" | sort -u)

echo "3/3  Riscrivo i percorsi come locali…"
perl -pi -e 's{https://fonts\.gstatic\.com[^)]*/([^/)]+\.woff2)}{$1}g' "$DEST/fonts.css"

echo
echo "Fatto: $n file scaricati in sito-deploy/font/"
echo "Ora apri sito-deploy/index.html per verificare che i font si vedano."
