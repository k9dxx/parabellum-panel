# Ativação da área pessoal

A área pessoal fica desativada até concluir a configuração e verificar o isolamento real entre usuários. Não coloque senhas, tokens de serviço, credenciais do banco ou anotações pessoais no repositório.

1. Conectar um projeto Supabase dedicado ao portal e aplicar a migração `migrations/202611040001_private_notes.sql`.
2. Ativar autenticação por e-mail e senha, exigir confirmação do e-mail e configurar entrega de e-mails de produção. O SMTP padrão do Supabase pode limitar os destinatários; não considerar o cadastro público validado sem testar a entrega.
3. Configurar Site URL e redirect permitido: `https://k9dxx.github.io/parabellum-panel/pessoal.html`.
4. Obter somente a URL do projeto e a chave pública publishable/anon. Nunca usar service_role ou sb_secret no site.
5. Testar com dois usuários autenticados: A cria nota; B não consegue ler, alterar, transferir a propriedade ou excluir a nota de A. Testar acesso sem login e confirmação de e-mail. Executar as mesmas requisições REST diretamente, não apenas pela interface. Verificar revogação do acesso ao sair.
6. Só depois preencher `assets/private-config.json` e mudar enabled para true. Esta configuração é pública. As anotações são dados privados do banco e não entram nos JSONs públicos, backup público, favoritos, busca ou editor do site.

A migração começa uma transação, cria uma tabela nova com acesso anônimo revogado, ativa e força RLS e só permite acesso do proprietário autenticado. É uma migração de execução única. Não reaplicar para substituir uma instalação existente; fazer novas migrações incrementais.

As sessões ficam apenas na memória da página, sem localStorage ou sessionStorage. Recarregar a página exige entrar novamente. A sessão do servidor continua sujeita à expiração e às regras do Supabase. A interface usa uma lixeira reversível. A administração do banco e a infraestrutura têm acesso operacional; não há criptografia de ponta a ponta.

Antes de ativar o público, observar os limites e custos do plano contratado. Não contratar planos nem habilitar cobrança automaticamente.
