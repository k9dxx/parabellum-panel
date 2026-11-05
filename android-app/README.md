# PARABELLUM — aplicativo Android oficial (código-fonte)

Este projeto **não cria outro portal**. É um aplicativo WebView que abre
`https://k9dxx.github.io/parabellum-panel/` com o mesmo conteúdo do GitHub Pages.
O pacote Android é `com.pblm.parabellum`.

## APK de teste pelo GitHub Actions

1. Abra **Actions > PARABELLUM - APK Android > Run workflow**.
2. Após uma execução bem-sucedida, baixe o artefato **PARABELLUM-APK-debug** (ZIP).
3. Extraia `app-debug.apk` e instale no Android.
4. O APK debug é apenas de **teste**. Não distribua como release oficial.

O workflow também é acionado automaticamente quando `android-app/**` muda.
Não exige PC nem Android Studio: a compilação é feita pelo GitHub.

## APK de distribuição com assinatura

Crie uma keystore no Termux, **fora do repositório**:

```bash
pkg install openjdk-17 coreutils
mkdir -p ~/.pblm-keys
keytool -genkeypair -v -keystore ~/.pblm-keys/parabellum-release.jks \
  -alias parabellum -keyalg RSA -keysize 3072 -validity 3650
base64 -w0 ~/.pblm-keys/parabellum-release.jks > ~/.pblm-keys/keystore-b64.txt
```

Cadastre estes quatro segredos no GitHub: Settings > Secrets and variables > Actions:

- `PBLM_KEYSTORE_BASE64`: conteúdo de keystore-b64.txt
- `PBLM_STORE_PASSWORD`: senha da keystore
- `PBLM_KEY_ALIAS`: parabellum
- `PBLM_KEY_PASSWORD`: senha da chave

Nunca compartilhe keystore, senhas ou conteúdo base64. Guarde backup privado da chave.
Se perder a chave, poderá perder a capacidade de atualizar o app instalado.

Rode o workflow novamente. Se todos os segredos estiverem corretos,
o artefato **PARABELLUM-APK-release** será produzido.

## Segurança e limites

- Dentro do app, só são abertas URLs HTTPS do caminho `/parabellum-panel/`.
- Outros sites são abertos no navegador do sistema.
- Não há interfaces nativas JavaScript.
- Não permite conteúdo HTTP misto.
- Conteúdo novo depende de internet; o APK não embute uma cópia completa do portal.
- Os dados locais do WebView são separados dos dados locais do Chrome.
- Publicar em lojas exige revisar as políticas de cada loja e requisitos de privacidade.

## PWA

O portal também tem `manifest.webmanifest`, ícones PNG e `sw.js`.
No Chrome para Android: abra a página inicial, toque nos três pontos e escolha
**Instalar aplicativo** (quando oferecido).
