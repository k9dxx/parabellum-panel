# PARABELLUM / PBLM.777

Portal estático, sem dependências, para GitHub Pages. Tema preto e vermelho, responsivo no Android.

## Páginas

- `index.html`: início e contadores do conteúdo público.
- `comunidade.html`: busca de membros, filtro por cargo, perfis, cargos e princípios.
- `noticias.html`: busca e leitura completa de comunicados.
- `galeria.html`: categorias, ampliação e download de artes.
- `ferramentas.html`: senha aleatória, texto, relógio, compartilhamento e terminal local.
- `painel.html`: acesso à edição no GitHub e aos pedidos de entrada.

## Conteúdo

Edite `data/conteudo.json` com sua conta GitHub autorizada a escrever no repositório. Não há senha de administração no JavaScript. A edição e a autorização acontecem no GitHub. O conteúdo é público e versionado; nunca inclua dados privados ou segredos.

`membros`: nome, cargo (id de um cargo), descricao e instagram opcional.

`cargos`: id, nome e descricao. Os ids devem ser únicos.

`noticias`: id único, titulo, categoria, data (`AAAA-MM-DD`), resumo e paragrafos (lista de textos).

`galeria`: id, titulo, categoria e arquivo. Imagens devem ficar diretamente em `assets/artes/` com extensão svg, png, jpg, jpeg ou webp. Use nomes sem espaços.

As contagens vêm do JSON. Nenhum pedido de entrada é aprovado automaticamente. A solicitação abre uma issue pública no GitHub, onde a pessoa deve entrar na própria conta e confirmar o envio. Aprovar exige a administração editar a lista de membros. O visitante é informado de que o pedido fica público.

O membro inicial k9 corresponde ao criador do projeto. Os demais integrantes devem ser incluídos após aprovação, usando somente dados autorizados.

## Testar no Termux

```sh
cd ~/parabellum-panel
python -m http.server 8080 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8080/` no navegador do celular. Para encerrar, Ctrl+C. Não abra os HTMLs como arquivos locais: o conteúdo depende de fetch via HTTP.

## Publicar

O GitHub Pages deve servir a raiz da branch main. Todos os caminhos internos são relativos e preservam o prefixo `/parabellum-panel/`. A página 404 usa esse prefixo explicitamente. Após salvar na main, aguarde a implantação do Pages.

Este projeto não oferece contas privadas de visitantes, chat, banco de dados privado ou execução de comandos no servidor. O terminal é uma interface local de navegação. O gerador de senha usa Web Crypto com amostragem sem viés e não transmite as senhas.
