# Pendências para concluir o sistema Cardap

Atualizado em **03/11/2026**, com base no trabalho realizado até o commit `d97744c`.

Este checklist reúne o que ainda precisa ser implementado, configurado, publicado ou validado no sistema completo. Ele complementa o [checklist técnico de correções](correction-checklist.md). Os itens de validação não indicam necessariamente uma falha: precisam ser conferidos no ambiente e nos equipamentos reais. Esta lista não substitui uma nova revisão do código.

**Prioridade inicial:** validar o fluxo compra → pedido no painel → preparo → entrega/retirada → impressão, antes de receber os primeiros restaurantes.

## 1. Compra e pagamento — prioridade alta

- [x] Implementar [validação de conta Asaas independente](asaas-validacao-conta.md) com conferência de carteira, documento e confirmação do titular.
- [ ] Publicar e homologar essa validação em sandbox e produção; ligar a conferência à política de ativação comercial, se exigida.
- [ ] Configurar os segredos, o ambiente, as carteiras e o webhook do Asaas.
- [ ] Homologar Pix com pagamento real e conferir o recebimento na carteira correta do restaurante.
- [ ] Validar confirmação de pagamento, expiração, cancelamento e estorno nos cenários suportados.
- [ ] Validar pagamento presencial na entrega e na retirada, incluindo a confirmação de recebimento pelo responsável.
- [ ] Testar entrega e retirada de ponta a ponta, com endereço, taxa e instruções corretos.
- [ ] Testar perda de conexão, reenvio da compra e resposta perdida, verificando que não há pedidos ou cobranças duplicados.

Implementação disponível; a homologação financeira e a publicação ainda precisam ser concluídas. Consulte [checkout e publicação](checkout-deployment.md).

## 2. Operação do restaurante — prioridade alta

- [ ] Validar pedido recebido → aceite → preparo → entrega/retirada → conclusão com contas reais.
- [ ] Conferir os detalhes do pedido e a atualização de status no painel e na tela do cliente.
- [ ] Validar cancelamento e o comportamento de pedidos com pagamento pendente.
- [ ] Testar loja aberta, pausada e suspensa, além de produtos indisponíveis ou alterados durante a compra.
- [ ] Conferir o isolamento entre restaurantes em um ambiente de homologação com mais de uma loja.

## 3. Salão e funcionários — prioridade alta

- [ ] Validar abertura de mesas e contas, inclusão de pedidos e acompanhamento pela cozinha.
- [ ] Testar solicitação de conta, confirmação do pagamento pelo caixa, encerramento e liberação da mesa.
- [ ] Testar o aplicativo do garçom com o backend publicado e aparelhos reais.
- [ ] Conferir cadastro, ativação, desativação, link de acesso e permissões de garçons e entregadores.
- [ ] Validar que um funcionário não acessa outra loja nem funções exclusivas do proprietário.
- [ ] Testar atribuição, acompanhamento e conclusão de entregas com contas reais dos funcionários.

## 4. Impressão física — prioridade alta

- [ ] Validar uma impressora térmica compatível em um restaurante real.
- [ ] Conferir conteúdo, acentuação, largura do papel e legibilidade das comandas.
- [ ] Testar impressão automática, impressão manual e reimpressão.
- [ ] Testar impressora desligada, cabo desconectado, aplicativo fechado e reinício do computador.
- [ ] Conferir a recuperação da fila sem imprimir o mesmo pedido indevidamente.
- [ ] Confirmar que somente o computador autorizado processa as impressões daquela loja.

Os testes existentes usam dispositivo simulado. Consulte [Cardap Impressão](../desktop/printing/README.md).

## 5. WhatsApp — configuração e validação

- [ ] Disponibilizar um servidor Evolution API compatível por HTTPS.
- [ ] Configurar a URL e os segredos `EVOLUTION_API_KEY` e `EVOLUTION_WEBHOOK_SECRET` no backend.
- [ ] Publicar as Functions de conexão, mensagens, eventos de pedidos e webhook.
- [ ] Testar pareamento por QR Code, reconexão e desconexão com um número de teste.
- [ ] Validar avisos de pedidos e boas-vindas com eventos reais.
- [ ] Validar respostas rápidas, histórico, falhas de envio e recuperação de solicitações repetidas.
- [ ] Conferir que SAIR/PARAR bloqueiam novos envios e VOLTAR permite retomá-los.

O código foi testado com provedor simulado. As automações começam desativadas. A tela de conversas, o contador e as consultas periódicas do chat foram removidos por decisão de escopo; não são pendências para reimplementar. Consulte [configuração do WhatsApp](whatsapp-evolution.md).

## 6. Funcionalidades ainda demonstrativas — implementação

- [ ] Concluir a área do cliente, substituindo comportamentos demonstrativos por dados e operações reais.
- [ ] Definir e implementar o fluxo real de planos e assinaturas da plataforma.
- [ ] Substituir os indicadores de exemplo do painel por métricas calculadas a partir dos pedidos reais.
- [ ] Conferir que telas, mensagens e documentação identificam corretamente qualquer demonstração restante.

A existência de uma tela visual não significa que o fluxo correspondente esteja concluído ou publicado.

## 7. Distribuição dos aplicativos

- [ ] Gerar e validar versões instaláveis dos aplicativos de garçom e entregador.
- [ ] Gerar e validar a distribuição do aplicativo de impressão.
- [ ] Disponibilizar os arquivos e preencher os links de instalação no painel.
- [ ] Conferir instalação, login, atualização e compatibilidade nos aparelhos e computadores usados pelos parceiros.

## 8. Produção e acompanhamento

- [ ] Configurar hospedagem, domínio, HTTPS e variáveis do ambiente de produção.
- [ ] Configurar App Check e os domínios autorizados do Firebase.
- [ ] Publicar e conferir as regras, os índices e as Functions no projeto correto.
- [ ] Preencher as chaves de busca regional das lojas existentes com o script documentado.
- [ ] Conferir a execução remota dos workflows do GitHub Actions.
- [ ] Configurar monitoramento de erros, alertas de gastos e acompanhar leituras, escritas e execuções de Functions.
- [ ] Definir backups e testar a recuperação dos dados necessários à operação.
- [ ] Medir a latência de sessão e dos fluxos principais no ambiente publicado.
- [ ] Validar a página `/em-breve` e o cadastro real de interessados enquanto o sistema estiver em pré-lançamento.
- [ ] Liberar o sistema completo com `CARDAP_PRELAUNCH_ONLY=false` somente após a validação dos fluxos essenciais.

O push para a `main` não substitui a publicação das Functions, regras e índices no Firebase. Consulte também [pré-lançamento](launch-waitlist.md).

## Como acompanhar

Marque cada item somente depois de verificar o resultado correspondente. Ao concluir uma implementação ou validação, registre junto ao item a data e, quando disponível, o commit, ambiente ou evidência do teste. Nunca registre senhas, tokens ou chaves de API neste arquivo.
