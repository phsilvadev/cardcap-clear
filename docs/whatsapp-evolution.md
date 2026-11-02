# WhatsApp em Configurações → Integrações

A seção conecta o WhatsApp de cada restaurante pela Evolution API (`WHATSAPP-BAILEYS`). Há status, pareamento com QR Code e desconexão com confirmação. Esta etapa não envia mensagens, não lê histórico e não configura webhooks de mensagens.

## Configuração do backend

É necessário um servidor Evolution API acessível por HTTPS, com o contrato de instâncias da versão 2. Configure a URL no ambiente das Functions (`firebase/employee-access/.env.cardap-e0bf0`, arquivo ignorado pelo Git):

```dotenv
EVOLUTION_API_URL=https://evolution.seu-dominio.com
```

Configure a chave administrativa no Secret Manager, sem colocá-la em variáveis `NEXT_PUBLIC_*`, no navegador ou no repositório:

```sh
firebase functions:secrets:set EVOLUTION_API_KEY --project cardap-e0bf0
firebase deploy --only functions:tenantWhatsAppIntegration --project cardap-e0bf0
```

A Function exige App Check em produção. Configure a chave pública de reCAPTCHA/App Check do projeto e autorize o domínio do site antes de usar. Publique também a versão atualizada do aplicativo web. Enquanto `CARDAP_PRELAUNCH_ONLY` não for `false`, o painel continua bloqueado pelo modo de pré-lançamento.

Sem a URL HTTPS ou a chave configuradas, a interface indica que o provedor ainda precisa ser habilitado. A chave deve existir para o deploy da Function que a vincula, mesmo que a URL ainda esteja vazia.

## Isolamento e funcionamento

- Somente o proprietário autenticado de uma loja configurada ou ativa pode consultar, conectar e desconectar.
- O nome da instância é derivado no servidor do projeto Firebase e do ID da loja. O cliente não pode escolher outra instância, servidor ou chave.
- O servidor usa os endpoints `connectionState`, `create`, `connect` e `delete`. Desconectar remove a instância dedicada, encerrando o pareamento; para reconectar será necessário novo QR Code.
- Credenciais e respostas completas do provedor nunca são devolvidas ao navegador. O QR Code PNG permanece apenas na memória da interface, com validade curta. Não é salvo no Firestore ou no armazenamento do navegador.
- A coleção privada `tenantWhatsAppIntegrations` guarda somente controles de concorrência, limite de chamadas e último estado de uma alteração. As regras existentes negam acesso direto a clientes.
- Há limite de 60 operações por minuto por restaurante e uma trava de 45 segundos para alterações concorrentes. Erros do provedor não expõem sua resposta ao usuário.
- A interface verifica o status a cada dez segundos enquanto está visível e a conexão está conectada ou em andamento. A consulta para quando a seção ou a aba fica oculta. QR Codes expirados precisam ser gerados novamente.

O contrato foi conferido no código oficial do provedor:

- [Rotas de instância](https://github.com/evolution-foundation/evolution-api/blob/main/src/api/routes/instance.router.ts)
- [Controlador de instância](https://github.com/evolution-foundation/evolution-api/blob/main/src/api/controllers/instance.controller.ts)

Antes de publicar, valide o pareamento e a desconexão com a versão instalada no seu servidor e um número de teste. Os testes locais usam um provedor simulado e não estabelecem uma conexão real de WhatsApp.

```sh
node --test firebase/employee-access/whatsapp.test.cjs
```
