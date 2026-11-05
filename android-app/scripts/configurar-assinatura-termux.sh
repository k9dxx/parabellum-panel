#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

REPO="k9dxx/parabellum-panel"
DIR="$HOME/.pblm-keys"
KEY="$DIR/parabellum-release.jks"
ALIAS="parabellum"

for cmd in gh keytool base64; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Falta $cmd. Instale: pkg install gh openjdk-17 coreutils"
    exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  echo "Entre no GitHub com: gh auth login"
  echo "Depois execute este instalador novamente."
  exit 1
fi

mkdir -p "$DIR"
chmod 700 "$DIR"
if [[ -f "$KEY" ]]; then
  echo "⛧ Chave existente encontrada. Ela será REUTILIZADA (não substituída)."
else
  echo "⛧ Criando sua chave PERMANENTE. Guarde a senha e faça backup do arquivo."
  keytool -genkeypair -v \
    -keystore "$KEY" -storetype PKCS12 \
    -alias "$ALIAS" -keyalg RSA -keysize 3072 -validity 10000
  chmod 600 "$KEY"
fi

echo
read -r -s -p "Digite novamente a senha da keystore (não será exibida): " PBLM_PASS
echo
if [[ -z "$PBLM_PASS" ]]; then
  echo "Senha vazia não é permitida."
  exit 1
fi
export PBLM_PASS
if ! keytool -list -keystore "$KEY" -storepass:env PBLM_PASS -alias "$ALIAS" >/dev/null 2>&1; then
  echo "Senha incorreta, alias diferente ou chave inválida. NADA será substituído."
  unset PBLM_PASS
  exit 1
fi

echo "⛧ Transferindo a chave criptografada para segredos Actions do repositório..."
base64 -w0 "$KEY" | gh secret set PBLM_KEYSTORE_BASE64 -R "$REPO"
printf '%s' "$PBLM_PASS" | gh secret set PBLM_STORE_PASSWORD -R "$REPO"
printf '%s' "$ALIAS" | gh secret set PBLM_KEY_ALIAS -R "$REPO"
printf '%s' "$PBLM_PASS" | gh secret set PBLM_KEY_PASSWORD -R "$REPO"
unset PBLM_PASS

echo
echo "✓ Quatro segredos registrados. Nenhuma senha ou chave foi exibida."
echo "✓ Guarde a keystore fora do repositório:"
echo "$KEY"
echo "✓ Faça backup privado da chave e anote a senha."
echo "✓ Agora execute manualmente o workflow release-android.yml no GitHub."
