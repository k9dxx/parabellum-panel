# ⛧ PARABELLUM Android — atualizações oficiais

Este projeto Android abre o **mesmo portal já existente** em https://k9dxx.github.io/parabellum-panel/.
Não cria outro portal, não altera perfis nem substitui páginas.

**Identificador fixo:** `com.pblm.parabellum`

## 1. Diferença entre debug e release

- **APK debug:** produzido automaticamente pelo workflow `build-android.yml` para testes. A chave debug pode mudar entre executores, por isso **não use** essa versão para atualização permanente.
- **APK release:** produzido manualmente pelo workflow `release-android.yml`, usando uma única chave de assinatura privada criada pelo responsável. O GitHub Releases publica o APK e o SHA-256 para download.

O primeiro APK release **não atualiza por cima do APK debug**: as assinaturas são diferentes.
**Exporte os dados locais do aplicativo de teste antes de desinstalá-lo.** Desinstalar apaga os dados locais do WebView. Os dados do navegador Chrome são separados.

## 2. Preparar o Termux

Instale ferramentas:

```bash
pkg update && pkg install git gh openjdk-17 coreutils curl -y
gh auth status || gh auth login -h github.com -p https -w
```

Baixe e **leia** o script oficial:

```bash
curl -fL --proto '=https' --tlsv1.2 \
  https://raw.githubusercontent.com/k9dxx/parabellum-panel/main/android-app/scripts/configurar-assinatura-termux.sh \
  -o ~/configurar-assinatura-pblm.sh
cat ~/configurar-assinatura-pblm.sh
```

Execute após revisar:

```bash
bash ~/configurar-assinatura-pblm.sh
```

O script cria, se ainda não existir, `~/.pblm-keys/parabellum-release.jks` com `keytool`, guarda o arquivo fora do repositório e define quatro **GitHub Actions secrets**:

- `PBLM_KEYSTORE_BASE64` — keystore codificada em base64, mantida privada no GitHub Actions.
- `PBLM_STORE_PASSWORD` — senha escolhida pelo dono.
- `PBLM_KEY_ALIAS` — `parabellum`.
- `PBLM_KEY_PASSWORD` — mesma senha da keystore para PKCS12.

**Nunca envie a keystore, base64 ou senhas na conversa, em commits, screenshots ou grupos.**
Guarde uma cópia privada da keystore e registre a senha em local seguro; sem a mesma chave, não será possível continuar atualizando o aplicativo pelo método atual. **Nunca gere uma chave nova ao atualizar.**

Pode conferir apenas os nomes (não valores) dos segredos com:

```bash
gh secret list -R k9dxx/parabellum-panel
```

## 3. Versão do aplicativo

O arquivo `android-app/version.properties` controla a versão:

```properties
VERSION_CODE=3
VERSION_NAME=1.1.0
```

A versão de personalização está preparada como **v1.1.0, código 3**. Para a próxima versão, aumente **AMBOS** os campos, por exemplo:

```properties
VERSION_CODE=4
VERSION_NAME=1.1.1
```

O Android exige aumento de `VERSION_CODE` e mesma identidade e assinatura para atualização por cima. `VERSION_NAME` é o identificador legível para membros e GitHub Releases.

## 4. Compilar e publicar sua primeira versão oficial

Após a chave estar registrada:

1. Abra [GitHub Actions — Publicar APK Oficial](https://github.com/k9dxx/parabellum-panel/actions/workflows/release-android.yml).
2. Toque em **Run workflow**, selecione **main** e execute.
3. O processo valida versão, segredos, SDK, assinatura e integridade do APK.
4. Se tiver sucesso, ele publica `PARABELLUM-v1.0.1.apk` em [GitHub Releases](https://github.com/k9dxx/parabellum-panel/releases) junto com o arquivo `.sha256`.
5. Antes de instalar o release, exporte o que for importante do APK debug e desinstale **somente** o APK debug, porque ele usa outra assinatura.
6. Instale o APK release baixado do repositório oficial. Nas próximas versões com a mesma assinatura, o Android permitirá instalar por cima.

**Não execute o workflow de release se os quatro secrets ainda não estiverem configurados.** O workflow falhará com uma mensagem de erro sem publicar um APK.

## 5. Avisos de atualização dentro do aplicativo

O código em `UpdateChecker.java` consulta `https://api.github.com/repos/k9dxx/parabellum-panel/releases/latest` na abertura do app, no máximo uma vez a cada 12 horas quando a consulta foi bem-sucedida.

Quando encontra uma versão semântica (`v1.0.2`, por exemplo) mais recente do que a instalada, mostra um diálogo com **Ver atualização**, abrindo o release no navegador. **Não baixa nem instala automaticamente.** A API pública do GitHub pode ter limites ou falhar sem conexão; o portal continua funcionando normalmente.

Esse aviso só funciona nos APKs compilados **após a implementação** do verificador.

## 6. Atualizações futuras

- Alterou conteúdo, menus, estilos ou notícias do portal? Atualize **o mesmo site**, sem compilar novo APK. O WebView acessa o conteúdo publicado.
- Mudou código nativo ou recursos Android? Aumente código e nome em `version.properties`, publique na `main` e execute o workflow **Publicar APK Oficial** novamente.
- Mantenha a mesma keystore. Não substitua seu aplicativo por builds debug novos depois de instalar a versão release.

## Segurança

O workflow release é **manual**, executado apenas na branch `main`, sem usar segredos nos builds automáticos de debug.
A keystore fica temporariamente no runner e é apagada ao terminar. O arquivo permanente permanece no Termux do proprietário e seus backups privados.
O APK assinado abre apenas o portal HTTPS oficial no WebView; sites externos abrem no navegador.
A verificação de updates não concede permissões para instalação silenciosa.

## Novidade: personalização 1.1.0

O **mesmo aplicativo Android oficial** ganhou uma barra superior nativa com botão ⚙.
Na nova central de personalização, cada pessoa poderá:

- Escolher entre sete cores ou aplicar sua cor personalizada no formato `#RRGGBB`.
- Ligar/desligar a entrada animada e o brilho do emblema.
- Escolher uma imagem da galeria para aparecer na animação de abertura.
- Criar um **atalho com foto personalizada na tela inicial**, se o launcher suportar.
- Voltar ao emblema original a qualquer momento.
- Abrir as Preferências do portal (bordas, cards, densidade, animações e papel de parede local).

**Atenção à diferença entre atalho e ícone original:**
o Android não permite mudar o ícone principal de um APK instalado para uma foto arbitrária em tempo real.
A foto escolhida no app muda a apresentação e o ícone de um **atalho adicional** na tela inicial.
O launcher pode pedir aprovação para fixar esse atalho.
O ícone original do APK continuará o mesmo.

Se quiser atualizar o **ícone oficial do aplicativo para todos os membros**,
há um script de publicação que recebe uma foto do celular:

```bash
pkg install imagemagick git -y
curl -fsSL https://raw.githubusercontent.com/k9dxx/parabellum-panel/main/android-app/scripts/mudar-icone-oficial-termux.sh -o ~/mudar-icone-oficial-termux.sh
cat ~/mudar-icone-oficial-termux.sh
bash ~/mudar-icone-oficial-termux.sh /sdcard/Download/minha-foto.png
```

O script edita **somente os ícones oficiais**, mostra o diff e pede confirmação antes de enviar alterações.
Para a imagem chegar ao ícone do APK instalado, publique uma **nova versão release assinada com a mesma keystore**,
aumentando `VERSION_CODE` e `VERSION_NAME`. A foto do ícone oficial afeta todos que instalarem a nova versão.
