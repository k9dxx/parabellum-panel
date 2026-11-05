# Mural público PARABELLUM

A tabela pblm_community_posts é pública para leitura. Apenas usuários autenticados podem publicar. O banco restringe edição e exclusão ao proprietário e bloqueia alteração do owner_id. Limite: 100 posts por conta e 60 segundos entre inserções. Exclusão é definitiva e requer confirmação na interface.

As anotações privadas permanecem na tabela pblm_private_notes. Nenhum conteúdo é copiado entre tabelas. O apelido do mural é autodeclarado e não comprova cargo nem identidade. E-mail não é publicado pelo formulário.

O link Reportar abre uma issue pública no GitHub. A revisão é manual; não há moderação automática nem painel de moderador nesta versão. A administração pode remover conteúdo no Supabase Table Editor.

Validação: RLS testada em transação revertida com duas contas temporárias e papel anônimo; criação, edição pelo dono, proteção contra alteração de dono, acesso cruzado negado, intervalo de criação e proteção das notas privadas. Busca e estado vazio conferidos na prévia. O fluxo completo de publicação pela conta GitHub deve ser conferido após deploy.

## Comentários e curtidas

Visitantes podem ler comentários e totais de curtidas. Para interagir, entre com GitHub na área pessoal e use Conversas da comunidade. Cada conta tem uma curtida por post e pode desfazê-la. Comentários públicos aceitam até 1.000 caracteres, com consentimento no formulário, intervalo de 15 segundos e limite de 500 por conta. Apenas o autor pode excluir seu comentário. Não há edição de comentários nesta versão.

As tabelas pblm_community_comments e pblm_community_likes usam RLS forçada; IDs, datas e proprietário são atribuídos pelo banco. Excluir um post também exclui comentários e curtidas associados. Apelidos são autodeclarados. Os identificadores técnicos de autores de comentários são públicos, sem e-mail; identificadores de quem curtiu não são disponíveis ao papel anônimo, mas contas autenticadas podem consultar esses identificadores. Curtidas não são anônimas perante a administração.

A view pblm_community_like_counts usa security_invoker. Testes em transação revertida cobrem duplicação de curtidas, falsificação de proprietário, limitação de comentários, acesso anônimo e exclusão por outra conta. Os comentários têm link para denúncia por issue pública. Moderação permanece manual pelo administrador no Supabase.
