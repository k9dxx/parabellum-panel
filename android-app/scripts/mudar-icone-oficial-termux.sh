#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
# Atualiza SOMENTE os ícones do PWA e do APK oficial.
# A compilação release ainda depende da chave permanente e de versionamento.
if [[ $# -ne 1 ]]; then
  echo "Uso: bash mudar-icone-oficial-termux.sh /sdcard/Download/minha-foto.jpg"
  exit 2
fi
IMAGE="$1"
if [[ ! -f "$IMAGE" || ! -r "$IMAGE" ]]; then
  echo "Arquivo não encontrado ou sem acesso: $IMAGE"
  exit 1
fi
if [[ "$(wc -c < "$IMAGE")" -gt 20000000 ]]; then
  echo "Imagem muito grande. Escolha uma foto de até 20 MB."
  exit 1
fi
if command -v magick >/dev/null 2>&1; then
  MAGICK=magick
elif command -v convert >/dev/null 2>&1; then
  MAGICK=convert
else
  echo "Instale o editor de imagens: pkg install imagemagick"
  exit 1
fi
command -v git >/dev/null 2>&1 || { echo "Instale git: pkg install git"; exit 1; }

ROOT="$HOME/parabellum-icone-publicacao"
mkdir -p "$ROOT"
WORK="$(mktemp -d "$ROOT/icone-XXXXXX")"
trap 'echo "Cópia de trabalho: $WORK"' EXIT

git clone --depth 1 --branch main https://github.com/k9dxx/parabellum-panel.git "$WORK/site"
cd "$WORK/site"

mkdir -p assets/icons android-app/app/src/main/res/drawable-nodpi
"$MAGICK" "$IMAGE[0]" -auto-orient -resize '512x512^' -gravity center -extent 512x512 -strip \
  -define png:compression-level=9 "assets/icons/pblm-512.png"
"$MAGICK" "assets/icons/pblm-512.png" -resize 192x192 \
  -define png:compression-level=9 "assets/icons/pblm-192.png"
cp assets/icons/pblm-192.png android-app/app/src/main/res/drawable-nodpi/pblm_icon.png

git add -- assets/icons/pblm-512.png assets/icons/pblm-192.png \
  android-app/app/src/main/res/drawable-nodpi/pblm_icon.png

if git diff --cached --quiet; then
  echo "Nada mudou: a imagem já está publicada."
  exit 0
fi

echo "⛧ Estes são os ÚNICOS arquivos que serão alterados:"
git diff --cached --stat
echo
echo "ATENÇÃO: atualizar o ícone original para TODOS exige lançar outro APK oficial assinado."
echo "Este script não altera versionCode, não gera APK e não mexe na assinatura."
read -r -p "Confirma publicar SOMENTE estes ícones? (s/N) " answer
if [[ "$answer" != "s" && "$answer" != "S" ]]; then
  echo "Publicação cancelada. Nenhum arquivo remoto alterado."
  exit 0
fi

git -c user.name="PBLM Publisher" -c user.email="k9dxx@users.noreply.github.com" \
  commit -m "feat(branding): atualizar ícones oficiais PARABELLUM"
git push origin main
echo "✓ Ícones enviados ao mesmo portal. O PWA pode atualizar o ícone após reinstalação."
echo "✓ Para o APK mudar o ícone original, aumente versionCode/versionName e publique o próximo release assinado."
