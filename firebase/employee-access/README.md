# Link de acesso da equipe

`employeeAccessLink` gera um link do Firebase para definir/redefinir a senha. Não envia e-mail. O painel exibe o link apenas em memória para cópia manual; não o salva no navegador ou no Firestore.

Somente o proprietário autenticado de uma loja configurada/ativa pode solicitar links. O funcionário deve estar ativo e ter `uid` gravado pelo backend de cadastro, associado à conta do Firebase Authentication e ao mesmo e-mail. Cadastros antigos sem esse vínculo são recusados; não preencha esse campo a partir de dados enviados pelo navegador.

A função utiliza a página de ação padrão do Firebase. O login de funcionários neste painel continua dependendo da integração de autenticação da equipe.

## Publicação

Esta função pertence ao codebase separado `employee-access`, em `firebase.json`. Instale as dependências nesta pasta antes de publicar somente esse codebase. Não é necessário alterar as funções externas `employeeInvite` e `employeeResendInvite`. As funções `employeeAccessLink` e `employeeCreateCourier` foram publicadas no projeto `cardap-e0bf0`, região `southamerica-east1`, em 29/10/2026.

Validação local sem dependências: `node --test firebase/employee-access/*.test.cjs`, executado na raiz do projeto.

## Cadastro único de entregadores

`employeeCreateCourier` cadastra um funcionário com cargo `courier` na coleção `tenants/{storeId}/employees`, com telefone e veículo. Confere o proprietário e o status da loja em transação e recusa e-mails já vinculados à equipe. O cadastro é operacional, sem criação de usuário ou convite no Authentication.

Essa função foi publicada no codebase `employee-access`. As telas de Funcionários, Entregadores e a seleção nos Pedidos passam a compartilhar o ID desse funcionário. A disponibilidade e os pedidos continuam sendo prévias de sessão, sem gravação de entregas reais no Firebase. Cadastros antigos independentes do navegador não são migrados automaticamente; somente funcionários ativos cadastrados no Firebase entram na operação.
