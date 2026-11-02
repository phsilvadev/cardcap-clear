# Cardap

Plataforma de restaurantes em Next.js 16, React 19 e TypeScript: vitrine pública, checkout, painel do proprietário, salão e impressão de comandas. O Firebase é compartilhado com os aplicativos de garçom e entregador.

## Executar

Requer Node.js 22 ou superior.

```bash
npm ci
cp .env.example .env.local
# Preencha as variáveis públicas do aplicativo Firebase e as origens da plataforma.
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

As variáveis `NEXT_PUBLIC_FIREBASE_*` são a configuração pública do aplicativo web, não credenciais administrativas. Cadastre a chave reCAPTCHA no Firebase App Check para habilitar o checkout. Chaves Asaas e tokens de webhook ficam exclusivamente no Secret Manager das Functions.

## O que está integrado

| Área                  | Comportamento                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Login do proprietário | Firebase Auth, sessão HttpOnly restrita ao host, autorização no servidor e isolamento por restaurante                            |
| Cardápio              | Produtos, categorias, imagens e personalizações no Firestore/Storage; lojas `configured` e `active` podem administrar o catálogo |
| Vitrine               | Apenas lojas ativas; busca por cidade/estado no banco antes da paginação; prévia reservada ao proprietário                       |
| Compra                | Produto real → carrinho por loja → entrega/retirada → pagamento → consulta do pedido                                             |
| Pagamento presencial  | Cria um pedido real a pagar; o proprietário confirma o recebimento no painel, pelo backend                                       |
| Pix Asaas             | Gera cobrança no backend e libera o pedido somente após confirmação canônica pela API do Asaas, acionada pelo webhook            |
| Pedidos e impressão   | Aceite, etapas, entregador e fila persistente por loja; impressora física exige Electron aberto e configurado                    |
| Salão                 | Mesas, comandas, solicitações de conta, pagamentos manuais pelo caixa, encerramento e limpeza                                    |
| Funcionários          | Cadastros e acessos em **Configurações → Funcionários**; atalhos filtram garçom ou entregador                                    |
| Entregas              | Visão operacional dos pedidos carregados; disponibilidade da equipe ainda usa estado local do navegador                          |
| Conta do consumidor   | Permanece demonstrativa; a compra real funciona como visitante, sem depender dessa conta                                         |
| Planos                | Catálogo e seleção demonstrativos; não contratam assinatura nem aplicam limites comerciais                                       |

A existência do código não confirma que Functions, regras, índices e segredos já estejam publicados. Consulte o [checklist atualizado](docs/correction-checklist.md) e a [publicação do checkout e da busca regional](docs/checkout-deployment.md).

## Checkout e Asaas

O servidor recalcula preços, complementos, divisão em partes, quantidades e entrega. O navegador precisa confirmar uma nova cotação se os valores mudarem. Carrinhos têm até 20 combinações e 99 unidades por combinação.

Cada confirmação recebe um identificador aleatório persistido antes do envio. Repetir uma tentativa usa os mesmos dados e o mesmo identificador, sem criar outro pedido. A confirmação pode ser recuperada no mesmo navegador. Evite apagar o armazenamento durante um envio pendente.

Pix pendente fica em `checkoutSessions`, fora da cozinha e da fila de impressão. O webhook valida seu token, consulta a cobrança na API do Asaas e compara cliente, referência, valor e ambiente. Apenas `RECEIVED` libera o pedido; o navegador não marca pagamentos como pagos. Estornos ficam sinalizados para conferência da loja.

Em respostas incertas do Asaas, a integração busca a cobrança pela referência. Não repete automaticamente o POST financeiro se não houver certeza de rejeição. Confira a mesma tentativa ou peça revisão ao suporte.

O repasse configurado é de **100% do líquido para a carteira Asaas da loja**, sem comissão da plataforma neste código; as tarifas Asaas incidem antes do split. A conta criadora deve ter split habilitado e a carteira deve pertencer à conta recebedora. Não configure a própria carteira da conta criadora como destino de split.

Referências: [Pix dinâmico](https://docs.asaas.com/docs/cobrancas-via-pix), [split e cálculo sobre o líquido](https://docs.asaas.com/docs/split-de-pagamentos) e [eventos de cobrança](https://docs.asaas.com/docs/webhook-para-cobrancas).

## Validação

```bash
npm run typecheck
npm run format:check
npm run build
npx playwright install chromium
npm test
npm --prefix firebase/employee-access test
npm --prefix desktop/printing test
```

Os testes de compra no navegador passam pelo handler real de checkout, com banco em memória e transporte Firebase interceptado. Não criam cobranças reais. A suíte de backend verifica cotação, idempotência, concorrência, confirmação de Pix, estornos e o percurso compra → aceite → fila de impressão. A impressão física e o recebimento real exigem validação no ambiente do restaurante.

Para as regras reais nos emuladores, use Firebase CLI e Java 21:

```bash
npm run test:menu:rules
```

O projeto de teste é `demo-cardap-test`. As contas e dados dessa suíte ficam nos emuladores. O GitHub Actions executa build, tipos, formatação, testes de navegador, backend, impressão e regras. Execução local com Chromium já instalado também aceita `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/caminho/do/chromium`.

O teste opcional `npm run test:security:live` acessa o Firebase configurado e possui requisitos próprios de autenticação e limpeza descritos no script; não faz parte do CI padrão.

## Publicar as regras no Firebase

Requer Firebase CLI autenticado e permissão no projeto. Na raiz do repositório:

```bash
git pull origin main
firebase login
firebase deploy --only firestore:rules,storage --project cardap-e0bf0
```

Confirme que `cardap-e0bf0` é o projeto de produção correto. Como as regras são compartilhadas com outros aplicativos, mantenha as definições sincronizadas antes de publicar. Esse comando não publica Functions, segredos ou índices do checkout.

## Autorização e subdomínios

O `proxy.ts` protege `/dashboard`, bloqueia acesso externo a `/tenants/...` e verifica o domínio da sessão. As páginas protegidas repetem a autorização por `requireTenant`. Leituras de identidade e cadastro independentes executam em paralelo, continuam autorizadas pelo Firebase e não são armazenadas em cache entre requisições. `CARDAP_AUTH_TIMING=true` registra somente a duração da verificação, sem tokens ou dados pessoais.

A sessão usa cookie HttpOnly, SameSite=Strict, restrito ao host, Secure em produção e duração máxima de 55 minutos. Logout local não revoga sessões de outros dispositivos. A integração entre domínio central e subdomínios depende de `tenantLoginTransfer` e das configurações de origem.

No desenvolvimento, `http://minha-loja.localhost:3000/dashboard` identifica a loja pelo subdomínio. Consulte [login e subdomínios](docs/tenant-login-subdomains.md) e [reCAPTCHA/App Check](docs/recaptcha-app-check.md).

## Estrutura

```text
app/(client)/        Vitrine, produto e checkout do consumidor
app/(tenant)/        Login e painel do restaurante
app/api/auth/        Sessão e transferência entre origens
lib/checkout/        Carrinho, tipos e serviços de compra
firebase/employee-access/  Functions de equipe, salão, checkout e pagamentos
firestore.rules      Regras de autorização do Firestore
storage.rules        Regras de imagens
firestore.indexes.json     Busca regional e TTL dos limites de criação
desktop/printing/    Aplicativo Electron de impressão
```

As fontes são hospedadas no próprio projeto, com licenças em `app/fonts`, e não exigem uma folha de estilos do Google durante a navegação.

Produto e checkout usam estado React. Interações antigas restantes usam listeners com limpeza no unmount; o Strict Mode está habilitado. Novas funcionalidades devem usar componentes e hooks, sem depender de alterações imperativas no DOM.

## Impressão e aplicativos

Veja [Cardap Impressão](desktop/printing/README.md) e [o contrato da fila](docs/firebase-order-printing.md). O painel informa seu projeto Firebase ao Electron. `CARDAP_FIREBASE_PROJECT_ID` permite fixar um projeto e recusar outro ambiente; `CARDAP_FIREBASE_FUNCTIONS_REGION` define a região quando ela não vier do painel.

Os aplicativos de garçom e entregador são distribuídos separadamente. Configure os links de instalação em `.env.local`; links ausentes permanecem ocultos. O app do garçom usa a mesma operação de salão, mantendo pagamentos e encerramento sob responsabilidade do caixa.

### Página de pré-lançamento

Acesse `/em-breve` para ver a página em construção e a inscrição para receber novidades. O formulário salva os interessados no Firestore pela Function `publicJoinWaitlist`. Consulte [publicação e funcionamento da lista](docs/launch-waitlist.md). O envio de campanhas por e-mail ainda depende de um serviço de e-mail.

O modo de pré-lançamento fica ativo por padrão: somente `/em-breve` pode ser acessada; as demais páginas redirecionam para ela, e as APIs internas ficam indisponíveis. Para liberar o sistema, defina `CARDAP_PRELAUNCH_ONLY=false` no servidor e reinicie/republique. Esse modo não desativa os serviços independentes do Firebase.

### Integração WhatsApp

Configurações → Integrações permite conectar o WhatsApp do restaurante pela Evolution API, consultar o status e desconectar. O painel permite ativar avisos de pedidos, boas-vindas e respostas rápidas, com histórico de envios. As automações começam desativadas. Veja [como configurar a URL, o segredo e publicar a Function](docs/whatsapp-evolution.md).
