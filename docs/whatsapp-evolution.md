# WhatsApp em Configurações → Integrações

O card de WhatsApp não oficial abre a conexão pela Evolution API (`WHATSAPP-BAILEYS`). Quando o servidor confirma o pareamento, o modal fecha e um painel lateral abre pela esquerda. O botão do card passa a Gerenciar.

WhatsApp Business oficial, Instagram e E-mail continuam sendo apenas prévias visuais. Somente o WhatsApp não oficial usa os recursos descritos abaixo.

## Recursos do painel

- Conectar com QR Code, atualizar status e desconectar com confirmação.
- Ativar avisos dos pedidos online: recebido, em preparo, entrega/retirada, concluído e cancelado. Cada etapa tem texto editável. A etapa de retirada usa o texto “pronto para retirada”.
- Ativar boas-vindas para mensagens de texto recebidas de conversas individuais. Cada cliente recebe no máximo uma saudação em 24 horas. Mensagens próprias, grupos, broadcasts e histórico antigo são ignorados.
- Salvar até dez respostas rápidas e enviá-las manualmente a um cliente selecionando um pedido real. O destinatário é lido do pedido no backend, não de um número livre informado pelo navegador.
- Consultar os dez últimos envios, incluindo fila, aceite pelo provedor, falha e resultado não confirmado. O histórico é atualizado pelo botão Atualizar envios.

As automações começam desativadas. O proprietário precisa revisar os textos, conectar o WhatsApp e salvar as opções antes de ativá-las. Os textos aceitam `{cliente}`, `{loja}`, `{pedido}` e `{status}`.

O cliente pode enviar **SAIR** ou **PARAR** para bloquear novos envios daquele restaurante, ou **VOLTAR** para retomá-los. Essa preferência também é respeitada nas respostas rápidas manuais.

## Publicação e credenciais

É necessário um servidor Evolution API acessível por HTTPS, compatível com o contrato v2 de instâncias, `sendText` e webhooks com cabeçalhos personalizados. A URL fica no ambiente das Functions (`firebase/employee-access/.env.cardap-e0bf0`, ignorado pelo Git):

```dotenv
EVOLUTION_API_URL=https://evolution.seu-dominio.com
# Opcional; o backend usa o endereço padrão da Function se estiver vazio.
EVOLUTION_WEBHOOK_URL=https://southamerica-east1-cardap-e0bf0.cloudfunctions.net/evolutionWhatsAppWebhook
```

Configure os dois segredos no Secret Manager. Use uma chave aleatória forte e exclusiva para `EVOLUTION_WEBHOOK_SECRET`; ela não é a chave administrativa da Evolution. Não coloque os segredos em `NEXT_PUBLIC_*`, no repositório, em URLs de callback ou no navegador.

```sh
firebase functions:secrets:set EVOLUTION_API_KEY --project cardap-e0bf0
firebase functions:secrets:set EVOLUTION_WEBHOOK_SECRET --project cardap-e0bf0
firebase deploy --only functions:tenantWhatsAppIntegration,functions:tenantWhatsAppMessaging,functions:whatsAppOrderChanged,functions:whatsAppMessageCreated,functions:evolutionWhatsAppWebhook,firestore:indexes --project cardap-e0bf0
```

As Functions chamadas pelo navegador exigem App Check em produção. Configure a chave pública de reCAPTCHA/App Check, autorize o domínio do site e publique também o aplicativo web atualizado. O painel do site continua bloqueado enquanto `CARDAP_PRELAUNCH_ONLY` não for `false`.

O backend registra o callback ao ativar as automações ou solicitar uma resposta rápida, para tratar boas-vindas e os comandos SAIR/PARAR/VOLTAR. Ao recriar a conexão, o registro é restaurado se alguma automação estiver habilitada. Depois de trocar o segredo ou URL, salve novamente as configurações para atualizar o callback.

Valide no servidor instalado um número de teste: pareamento, mensagem recebida, saudação, SAIR/VOLTAR, mudança de status de um pedido e envio manual. Mensagens com identificador `@lid` só são aceitas quando o provedor também informa o número em `remoteJidAlt`. Não há tela de conversas, contador de não lidas, armazenamento de conversas recebidas ou importação do histórico do celular. O webhook trata apenas as boas-vindas e os comandos de bloqueio; não há envio de campanhas em massa.

## Fila, isolamento e falhas

Somente o proprietário autenticado de uma loja configurada ou ativa gerencia a conexão, as configurações e os envios. O nome da instância é derivado do projeto Firebase e da loja no servidor. O cliente não escolhe servidor, chave ou instância. As respostas completas do provedor, incluindo segredos, nunca são retornadas à interface. QR Codes ficam apenas na memória da interface.

Configurações e mensagens ficam em coleções privadas, protegidas pela regra padrão que nega acesso direto a clientes:

- `tenantWhatsAppSettings/{storeId}`: textos, respostas, flags e revisão das configurações.
- `tenantWhatsAppIntegrations/{storeId}`: limites e controle de concorrência da conexão/configuração.
- `tenantWhatsAppIntegrations/{storeId}/whatsappMessages/{messageId}`: fila e histórico com retenção de 30 dias via TTL em `expiresAt`.
- Subcoleções `contacts` e `limits`: preferências de bloqueio, intervalo de boas-vindas e limites de envio.

Os avisos são criados por um trigger dos pedidos e deduplicados por pedido/etapa. Eventos atrasados e etapas já ultrapassadas não são enviados. Respostas manuais usam um `requestId` persistido no navegador até a confirmação da solicitação, para recuperar uma resposta perdida sem criar outro envio.

O worker revalida a loja, a automação, a etapa e a preferência do destinatário antes de enviar. A fila espera conexão por até quinze minutos. Há limite de 30 tentativas por minuto e 1.000 por dia por restaurante. Mensagens pendentes expiram e não são enviadas dias depois. Desativar uma automação impede seus envios ainda pendentes.

A intenção de envio é gravada antes da chamada à Evolution. Depois dessa gravação, uma repetição do evento não faz outro POST. Isso evita duplicatas após timeout, mas pode deixar uma mensagem sem envio se houver falha entre a gravação e a chamada. Resultado incerto aparece como **Envio não confirmado**; confira o WhatsApp antes de solicitar outro envio. Aceite pelo provedor não é confirmação de entrega ou leitura pelo cliente.

## Validação local

```sh
node --test firebase/employee-access/whatsapp.test.cjs firebase/employee-access/whatsapp-messages.test.cjs
```

Os testes exercitam os handlers com armazenamento transacional em memória e um provedor simulado. Os testes não enviam mensagens reais nem substituem a validação na versão instalada da Evolution.

Contratos conferidos no código oficial:

- [Instâncias](https://github.com/evolution-foundation/evolution-api/blob/main/src/api/controllers/instance.controller.ts)
- [Mensagens](https://github.com/evolution-foundation/evolution-api/blob/main/src/api/dto/sendMessage.dto.ts)
- [Webhook](https://github.com/evolution-foundation/evolution-api/blob/main/src/api/integrations/event/webhook/webhook.controller.ts)

## Consultas e custo

Não há consultas periódicas de conversas nem contador global de mensagens. O status da conexão é verificado somente com o modal/painel de WhatsApp visível; fora dele não há polling global. As configurações são carregadas ao abrir o painel, e o histórico dos dez últimos envios é consultado pelo botão Atualizar envios. O callback processa eventos de mensagens para as automações sem manter uma cópia das conversas.
