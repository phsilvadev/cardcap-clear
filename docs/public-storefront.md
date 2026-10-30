# Catálogo público e recebimento

- `tenantSetReceivingOrders` salva `receivingOrders` no restaurante autenticado. Somente o proprietário pode alterar lojas com status `configured` ou `active`. A operação não ativa nem publica a loja. O valor ausente equivale a recebimento pausado.
- `publicStorefront` oferece `list`, `get` e `summary`. A listagem mostra apenas lojas `active`, filtradas por cidade (sem diferenciar acentos/maiúsculas) e UF. O detalhe usa o slug vinculado em `tenantDomains`.
- O recebimento público depende de `status === "active"` e `receivingOrders === true`. Pausar o recebimento mantém a loja e seu cardápio consultáveis; os pedidos já recebidos continuam sendo tratados normalmente.
- Os horários são exibidos conforme o cadastro. Nesta etapa, o recebimento é controlado manualmente pelo proprietário.
- `Ver minha loja` usa `/loja?store=SLUG&preview=1`. Lojas ainda não publicadas só podem ser consultadas nessa prévia pelo próprio proprietário, com autenticação Firebase. A prévia apresenta um aviso de publicação pendente.
- A projeção pública inclui nome, descrição, categoria, logo, endereço comercial, horários, modalidades, prazo e taxa de entrega. Não inclui responsável, contatos de acesso, CNPJ, carteira Asaas, equipe ou permissões.
- O cardápio lê produtos disponíveis e categorias do mesmo restaurante. Os caminhos de imagens precisam corresponder ao produto e ao restaurante. Imagens utilizam os tokens de download já existentes do Storage, sem alterar permissões do bucket ou regras do Firestore.
- A lista pagina consultas de até 40 lojas ativas; cada página é filtrada pela região. O cursor permite continuar a busca em outras páginas. O cardápio pagina 30 produtos por vez e consulta até 100 categorias.
- A listagem atualiza as páginas já consultadas a cada 30 segundos enquanto visível, e ao recuperar o foco, preservando os filtros.
- A página da loja atualiza os dados de apresentação e o recebimento a cada 15 segundos quando visível, e ao recuperar o foco. Os produtos são carregados ao abrir, atualizar a página ou solicitar mais produtos.
- Esta integração disponibiliza a consulta real das lojas e dos cardápios. A criação de pedidos e o pagamento do checkout continuam sendo uma integração separada; a vitrine não envia pedidos fictícios para o restaurante.

Validação: testes do backend em `storefront.test.cjs`, fluxo de navegação e atualização de status em `tests/storefront.spec.ts`, compilação Next.js e verificações de leitura na API publicada. Nenhuma loja foi ativada nem foram criados pedidos de teste no Firebase.
