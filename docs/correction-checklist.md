# Checklist de correções

Os itens concluídos indicam implementação e testes no código. Não significam publicação no Firebase, execução no GitHub Actions remoto ou homologação financeira em produção.

## Funcionamento

- [x] Lojas `configured` e `active` administram produtos, categorias e imagens, com validação do proprietário e da carteira.
- [x] Regras e serviço alinhados; testes com lojas configuradas, ativas, pendentes, suspensas e outro proprietário.
- [x] Checkout cria pedidos reais e consulta seus resultados pelo backend.
- [x] Preços, complementos, divisão, quantidades, disponibilidade e entrega calculados no servidor.
- [x] Confirmação de cotação nova se preços ou entrega mudarem.
- [x] Reenvio idempotente, inclusive em chamadas concorrentes e resposta perdida.
- [x] Pagamentos presenciais ficam a pagar.
- [x] Pix Asaas no backend; apenas confirmação canônica libera o pedido; webhook protegido e tratamento de estorno.
- [ ] Configurar segredos, carteira, split e webhook Asaas e homologar recebimento real.

## Confiabilidade

- [x] Consulta regional antes da paginação, com chaves normalizadas e índice versionado.
- [x] Sincronização de endereço e script de preenchimento inicial em modo de prévia por padrão.
- [ ] Publicar e conferir índices; preencher chaves das lojas existentes.
- [x] Impressão usa o projeto da aplicação ou o ambiente configurado, sem projeto fixo no executável.
- [x] README distingue integrações reais, demonstrações e requisitos de publicação.
- [x] Workflow GitHub Actions para build, tipos, formatação, navegador, backend, impressão e regras.
- [ ] Conferir a execução remota do workflow depois do push.

## Melhorias técnicas

- [x] Consultas independentes de identidade e cadastro em paralelo, sem cache de autorização entre requisições.
- [x] Instrumentação de duração da sessão sem credenciais ou dados pessoais nos logs.
- [ ] Coletar latência e percentis no ambiente de produção.
- [x] Produto e todas as etapas da compra migrados para estado React.
- [x] Listeners e opções de formulário geradas têm limpeza; Strict Mode reativado.
- [x] Fontes hospedadas localmente, sem depender de uma folha externa para a página hidratar.
- [ ] Continuar a migração gradual de conta demonstrativa e interações antigas do painel para React.

## Validação e publicação

- [x] Build de produção, verificação de tipos, formatação e `git diff --check`.
- [x] 93 testes web, 101 testes de backend, 17 de impressão e 13 de regras nos emuladores.
- [x] Conferência de inicialização e limpeza também em desenvolvimento com Strict Mode.

- [x] Testes de checkout incluem compra → aceite → fila de impressão, com dispositivo de impressão simulado.
- [x] Testes de rede, sessão expirada, tentativas concorrentes e reenvio de impressão.
- [ ] Publicar as regras, Functions e índices e comparar com o projeto ativo.
- [ ] Homologar a compra com pagamento real e impressão física no restaurante.

Consulte [a sequência de publicação e configuração](checkout-deployment.md). Não forneça chaves Asaas ou senhas em issues ou no README.
