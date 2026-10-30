# Pedidos e impressão por restaurante

## Contrato de entrada

Pedidos devem ser criados por um backend autorizado em `tenants/{tenantId}/orders/{orderId}`. Não é permitido ao navegador criar pedidos, definir preços ou escrever a fila diretamente. A futura integração de checkout precisa calcular preços e verificar produtos no servidor antes de criar o pedido. Não use o endpoint de gestão para importar dados não verificados do navegador.

`tenantId` é o UID do proprietário, conforme o modelo atual da aplicação. `orderId` deve ser único, ter até 100 caracteres e conter letras ASCII, números, `_` ou `-`.

```ts
{
  storeId: tenantId,
  customer: "Nome do cliente", // de 1 a 120 caracteres
  items: "2 × Produto · 1 × Bebida", // de 1 a 12.000 caracteres
  total: 5980, // inteiro em centavos, de 0 a 100.000.000
  status: "new",
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
}
```

Pedidos reais não são extraídos de `sessionStorage`. A tela fica vazia enquanto não houver pedidos nessa coleção. Não foram criados pedidos ou contas de teste no projeto de produção.

## Funções

- `tenantOrderOperations`: callable em `southamerica-east1`, com operações `inspect`, `list`, `setAutoAccept`, `setDevice`, `transition`, `assignCourier`, `claim`, `start`, `finish` e `retry`.
- `tenantOrderCreated`: gatilho em novos documentos da coleção de pedidos; consulta a configuração atual e aceita o pedido se o aceite automático estiver habilitado.

Todas as operações do callable exigem Firebase Auth e `request.auth.uid === storeId`, vínculo `ownerUid` e loja `configured` ou `active`. Caminhos são construídos no servidor com IDs validados. O token Firebase do processo Electron vai no cabeçalho `Authorization` e nunca para arquivos locais ou logs.

As configurações ficam em `tenants/{tenantId}/printing/settings`:

```ts
{ autoAccept: false, deviceId: "uuid-da-instalacao", deviceName: "Computador da cozinha" }
```

A seleção usa o ID esperado do computador anterior para recusar sobrescritas concorrentes. Desabilitar o aceite não desfaz pedidos já aceitos. Pausar a impressão remove o computador responsável, preservando a fila.

## Fila persistente

O aceite `new → preparing` e o documento `printJobs/kitchen-{orderId}` são gravados na mesma transação. Eventos repetidos ou aceites concorrentes não criam outra comanda. O conteúdo da comanda vem do pedido no servidor, capturado no aceite.

Estados:

```text
queued → reserved → printing → submitted
             ↓           ↓
         cancelled    uncertain
```

- `queued`: aguarda o computador escolhido.
- `reserved`: um computador recebeu token e reserva de 30 segundos. Reserva expirada pode ser retomada, com token novo.
- `printing`: o servidor autorizou iniciar o envio. Não volta automaticamente à fila.
- `submitted`: o envio ao driver foi confirmado. Não garante papel físico.
- `uncertain`: resultado precisa de revisão humana.
- `cancelled`: pedido cancelado antes de iniciar o envio.

A troca do computador impede iniciar uma reserva antiga. Um envio que já começou pode ser confirmado pelo computador que o iniciou, mesmo depois da troca. Confirmar uma comanda exige o mesmo restaurante, computador e token da reserva. Um pedido cancelado não pode ser reenviado.

Após revisão explícita, `retry` incrementa `attempt` e retorna a comanda à fila. A nova tentativa tem outro ID de deduplicação. Para uma comanda ainda em `printing`, o servidor exige aguardar dois minutos. Retentativas de eventos do gatilho não significam retentativas automáticas de impressão física.

## Recuperação e limites

O Electron mantém um registro de envios e um arquivo de confirmações pendentes, ambos separados por restaurante e tentativa. Após reiniciar, confirma no Firebase um envio já registrado ou informa resultado incerto; não imprime automaticamente de novo.

O processo principal é o único consumidor da fila. A ponte do navegador expõe apenas conexão, desconexão, status e configuração. Não existe IPC de impressão arbitrária nem servidor HTTP local. Context isolation, sandbox e validação da origem/janela são mantidos.

As leituras do painel são paginadas de 50 em 50, com até 20 páginas carregadas. O painel consulta a cada 10 segundos; o Electron consulta a fila a cada 3 segundos enquanto estiver pronto. `createdAt` é necessário para listagem ordenada. Consultas usam índices de campo único padrão do Firestore. O servidor não migra formatos antigos de outros projetos.

A visão geral mantém os indicadores do protótipo, mas recebe a lista de pedidos carregada do servidor e encaminha suas ações de aceite ao backend. Não use esses indicadores como relatórios financeiros completos; a listagem é paginada.

## Publicação

```sh
firebase deploy --only functions:employee-access:tenantOrderOperations,functions:employee-access:tenantOrderCreated --project cardap-e0bf0 --non-interactive --force
```

`--force` é exigido pela CLI para habilitar a política de retentativa do gatilho. A seleção explícita limita a publicação a essas duas funções. Não é necessário publicar regras novas ou conceder aos clientes acesso direto à fila.
