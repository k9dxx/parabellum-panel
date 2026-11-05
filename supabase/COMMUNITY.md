# Mural público PARABELLUM

A tabela pblm_community_posts é pública para leitura. Apenas usuários autenticados podem publicar. O banco restringe edição e exclusão ao proprietário e bloqueia alteração do owner_id. Limite: 100 posts por conta e 60 segundos entre inserções. Exclusão é definitiva e requer confirmação na interface.

As anotações privadas permanecem na tabela pblm_private_notes. Nenhum conteúdo é copiado entre tabelas. O apelido do mural é autodeclarado e não comprova cargo nem identidade. E-mail não é publicado pelo formulário.

O link Reportar abre uma issue pública no GitHub. A revisão é manual; não há moderação automática nem painel de moderador nesta versão. A administração pode remover conteúdo no Supabase Table Editor.

Validação: RLS testada em transação revertida com duas contas temporárias e papel anônimo; criação, edição pelo dono, proteção contra alteração de dono, acesso cruzado negado, intervalo de criação e proteção das notas privadas. Busca e estado vazio conferidos na prévia. O fluxo completo de publicação pela conta GitHub deve ser conferido após deploy.
