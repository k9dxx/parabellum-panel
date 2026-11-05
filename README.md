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


## Portal v2

Novas páginas: explorar.html (busca geral), agenda.html, materiais.html, favoritos.html, ajuda.html e preferencias.html. Links diretos de conteúdos usam ?membro=id, ?noticia=id, ?arte=id, ?evento=id, ?material=id e ?duvida=id.

Favoritos, preferências, anotações e rascunhos usam localStorage com prefixo pblm.v2. São exclusivos do navegador. Falhas de armazenamento são mostradas ao visitante. Não há sincronização ou contas privadas de visitantes.

O editor em painel.html permite criar, editar, remover, importar e exportar registros localmente. Ele não publica: o proprietário baixa conteudo.json e envia ao diretório data no GitHub com uma conta autorizada. Restaurar o rascunho usa a versão pública carregada. Campos e referências são validados antes da exportação. Novos arquivos de arte e materiais devem ser enviados separadamente.

O JSON deve incluir eventos, recursos e faq, além das listas originais. Eventos usam inicio/fim em ISO 8601 com fuso (por exemplo 2026-11-15T19:00:00-03:00), titulo, descricao e local. A agenda começa vazia. O exportador ICS converte para UTC, escapa texto e dobra linhas por tamanho UTF-8.

Os arquivos de download ficam em assets/downloads. O kit visual contém os três SVGs da galeria. O sitemap contém as páginas públicas; favoritos, preferências, editor e 404 usam noindex.
