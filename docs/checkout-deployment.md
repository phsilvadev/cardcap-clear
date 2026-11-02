# Publicar checkout, Pix e busca regional

O código está preparado para pagamentos presenciais e Pix Asaas. Publicação e homologação exigem acesso ao Firebase e à conta Asaas. Nenhuma chave privada deve ir para `NEXT_PUBLIC_*`, para o navegador ou para o Git.

## Busca por região

A listagem consulta `status`, `publicStateKey` e `publicCityKey` no Firestore antes de limitar a página. A gravação do perfil atualiza esses campos; `tenantStoreSearchUpdated` sincroniza alterações feitas por outros aplicativos usando o cadastro atual em transação.

1. Confira os índices já existentes no projeto compartilhado e mescle suas definições com `firestore.indexes.json`; preserve índices de outros aplicativos.
2. Publique o índice regional e o TTL de `checkoutRateLimits.expiresAt`. Aguarde o índice ficar pronto.
3. Publique `tenantStoreSearchUpdated` e a versão atualizada de `tenantSaveProfile`.
4. Preencha as chaves regionais das lojas existentes em um ambiente autenticado com Application Default Credentials (ADC). O script é uma prévia por padrão:

```bash
npm --prefix firebase/employee-access ci
GOOGLE_CLOUD_PROJECT=cardap-e0bf0 node firebase/employee-access/backfill-store-search.cjs
# Depois de conferir projeto e contadores:
GOOGLE_CLOUD_PROJECT=cardap-e0bf0 node firebase/employee-access/backfill-store-search.cjs --apply
```

5. Publique a nova `publicStorefront` e teste uma cidade com mais de 40 lojas e uma cidade com poucas lojas. Sem o preenchimento inicial, lojas antigas não serão encontradas pela nova consulta.

O script lê o documento atual em transação para não sobrescrever um endereço mais recente. Não altera status, carteira ou valores comerciais.

## App Check e Functions

Registre o aplicativo web no Firebase App Check e configure reCAPTCHA na aplicação. As novas callables de checkout exigem App Check em produção; apenas o emulador dispensa a validação. Visitantes não recebem acesso direto a pedidos, sessões de compra ou índices privados.

O `firebase.json` deste repositório gerencia somente a codebase `employee-access`. As Functions de outras codebases não são incluídas no comando abaixo. Publique regras e índices após conferir as definições compartilhadas:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project cardap-e0bf0
firebase deploy --only functions:employee-access --project cardap-e0bf0
```

A publicação de toda a codebase inclui as Functions Pix e exige os segredos abaixo. Para publicar inicialmente só o checkout presencial e funções sem segredos, selecione explicitamente os nomes desejados, por exemplo `functions:publicCheckout,functions:publicStorefront,functions:tenantStoreSearchUpdated,functions:tenantSaveProfile`, preservando as funções existentes.

## Configurar Asaas em sandbox

1. Habilite API, Pix e split na conta Asaas de testes. Cadastre a carteira da conta recebedora na loja. O contrato atual repassa 100% do valor líquido para essa carteira; não acrescente uma comissão sem definir a regra comercial.
2. Cadastre a chave da API e um token de webhook longo e aleatório no Secret Manager, sem colocá-los em arquivos do projeto:

```bash
firebase functions:secrets:set ASAAS_API_KEY --project cardap-e0bf0
firebase functions:secrets:set ASAAS_WEBHOOK_TOKEN --project cardap-e0bf0
```

O CLI solicita cada valor. Guarde o token de webhook para configurar a mesma credencial no Asaas.

3. Na pasta `firebase/employee-access`, crie `.env.cardap-e0bf0` a partir de `.env.example`:

```dotenv
ASAAS_ENVIRONMENT=sandbox
CHECKOUT_PIX_ENABLED=true
```

4. Publique `publicCheckout`, `publicCheckoutPix` e `asaasCheckoutWebhook` da codebase `employee-access`.
5. No Asaas, configure o webhook HTTPS `https://southamerica-east1-cardap-e0bf0.cloudfunctions.net/asaasCheckoutWebhook`, com o token de autenticação igual ao segredo `ASAAS_WEBHOOK_TOKEN`. Inclua eventos de recebimento, confirmação, vencimento, exclusão e estorno de cobranças.
6. Homologue o fluxo com chave e carteira de sandbox. A tela sinaliza o ambiente de testes. Nunca use esse ambiente para uma venda real.

O webhook ignora valores e status fornecidos no corpo e consulta a cobrança pela API do Asaas. Valor, pagador, referência e ambiente precisam corresponder ao pedido. Somente cobrança `RECEIVED` libera a cozinha. Pix pendente não pode ser marcado como pago pelo navegador.

## Ativar produção

Após homologação, configure uma chave Asaas de produção, a carteira de produção, o webhook correspondente e `ASAAS_ENVIRONMENT=production`. Publique novamente as Functions que usam esses valores. Ative Pix somente quando App Check, segredos, conta, split e webhook estiverem funcionando. `CHECKOUT_PIX_ENABLED=false` mantém novas compras Pix indisponíveis, preservando o tratamento dos pedidos já criados.

Nunca remova uma tentativa incerta para forçar uma nova cobrança. A integração preserva a tentativa e consulta a referência. Caso o provedor não encontre uma cobrança após um timeout, o sistema exige nova conferência da mesma tentativa ou suporte; ele não arrisca uma segunda cobrança automática.

## Homologação final

- Compra presencial entra no painel como a pagar, com preços e frete calculados pelo servidor. O proprietário confere o recebimento e usa Registrar pagamento recebido; Pix não admite confirmação manual.
- Pix fica aguardando pagamento, sem impressão ou preparo, até o webhook confirmado.
- Reenvio simultâneo não cria outro pedido ou cobrança.
- Webhook repetido não cria outro pedido; valor incorreto não libera a operação.
- Estorno sinaliza revisão financeira sem reverter automaticamente uma entrega já realizada.
- Aceite cria uma comanda; reinício ou erro de impressão exige os cuidados descritos no aplicativo Electron.
- Meça latência com `CARDAP_AUTH_TIMING=true`, desligando após a medição.
- Confira fisicamente papel, impressora e driver. Os testes automatizados não comprovam a saída física.
