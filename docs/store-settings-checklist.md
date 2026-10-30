# Configurações da loja e checklist

Os formulários de Dados da loja, Empresa e contato, Endereço, Horários, Entrega e retirada e Recebimentos usam o documento `tenants/{uid}`. Campos são carregados por uma assinatura autenticada e alterações passam pela função `tenantSaveProfile`, restrita ao proprietário.

O checklist observa os dados gravados da loja, a presença de categorias e produtos disponíveis, além de atualizar ao abrir ou recuperar o foco. Alterar um rascunho não conclui uma etapa: é necessário salvar. Taxas são exibidas em reais e persistidas como `deliveryFeeCents`; telefone e CEP são normalizados antes de gravar.

As seções têm validação compartilhada entre formulário, backend e checklist. Cada seção aceita apenas seus próprios campos. Quando as informações cadastrais obrigatórias estão completas, uma loja `pending` passa a `configured` e o cadastro recebe `setupCompleted`. A ativação comercial continua sendo uma liberação da plataforma. A carteira de uma loja ativa não pode ser alterada por esse formulário, preservando a restrição anterior.

Empresa e contato oferecem as escolhas Tenho CNPJ e Ainda não tenho CNPJ. A segunda escolha salva `hasCnpj: false` e registra `cnpjDeclaredAt` no servidor. O usuário optou por definir o prazo de solicitação depois: nenhum prazo ou bloqueio foi criado. Ao informar CNPJ, o sistema valida os dígitos e solicita razão social. A validação do formato não verifica titularidade ou situação cadastral.

A validação aceita os formatos numérico e alfanumérico, seguindo o [manual de cálculo do dígito verificador da Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf).

Não são usadas as antigas prévias em `sessionStorage` como fonte cadastral. A logo continua com seu fluxo próprio de upload. Nenhuma regra do Firestore ou permissão IAM foi alterada para publicar o salvamento das configurações.
