# Cardap

Projeto Next.js com App Router, React e TypeScript em modo estrito, migrado das 10 páginas HTML originais. O conteúdo, a identidade visual e as interações de demonstração foram preservados.

## Executar

Requer Node.js 22 ou superior (validação de App Check no servidor).

```bash
npm install
npm run dev
```

Acesse http://localhost:3000. Para executar em produção:

```bash
npm run build
npm start
```

## Firebase

A base de integração usa o mesmo projeto Firebase de `anow/main`, com o SDK modular, conforme a [documentação do Firebase](https://firebase.google.com/docs/web/setup). As variáveis públicas desse projeto foram copiadas para `.env.local`, que é ignorado pelo Git. Em outro ambiente, copie `.env.example` para `.env.local` e preencha os valores do aplicativo web no Firebase. Reinicie o servidor de desenvolvimento após alterar essas variáveis.

O módulo `lib/firebase/client.ts` disponibiliza `getFirebaseApp`, `getFirebaseAuth`, `getFirebaseDb`, `getFirebaseStorage` e `getFirebaseFunctions` para uso em componentes e hooks do cliente. A inicialização ocorre no primeiro uso, valida as variáveis e reutiliza a instância existente. As Functions usam a região `southamerica-east1`, como no `main`.

O cadastro e o login do restaurante usam Firebase Authentication e Firestore. O cadastro inicial cria `tenants/{uid}` com status `pending` e reserva o slug em `tenantDomains` por transação, seguindo o modelo do `anow/main`. Se uma etapa falhar após criar a identidade, repita o cadastro com o mesmo e-mail e senha para retomar sem sobrescrever uma loja existente.

Após autenticar, o navegador envia o ID token para `/api/auth/session`. O servidor o valida no Firebase Authentication e consulta o proprietário, o status e o domínio do tenant no Firestore. As consultas usam o token do usuário e continuam sujeitas às [regras do Firestore](https://firebase.google.com/docs/firestore/use-rest-api). Nenhuma credencial administrativa é necessária.

A sessão usa cookie `HttpOnly`, `SameSite=Strict`, restrito ao host e `Secure` em produção, com duração máxima de 55 minutos. O painel tenta renovar a sessão enquanto estiver aberto. Sessões expiradas exigem novo login. As operações de criação e remoção da sessão verificam a origem da requisição. O logout remove o cookie e encerra a sessão do SDK neste navegador; não revoga sessões de outros dispositivos.

O `proxy.ts` (middleware do Next.js 16) protege `/dashboard`, bloqueia acesso público a `/tenants/...` e rejeita domínio de outro tenant. A página do painel repete a autorização no servidor. Tokens inválidos, contas desabilitadas, lojas suspensas e falhas de comunicação com o Firebase mantêm o painel bloqueado. A API não aceita um tenant informado pelo navegador para conceder acesso.

No desenvolvimento, faça o cadastro ou login em `http://localhost:3002/restaurantes/login` e acesse `/dashboard` no mesmo host. Também é possível entrar diretamente no host da loja, por exemplo `http://minha-loja.localhost:3002/restaurantes/login`; a conta deve pertencer àquele slug. Cookies e a autenticação do SDK não são compartilhados entre hosts. Em produção, configure `AUTH_APP_ORIGIN` com a origem HTTPS do site para permitir o acesso pelo domínio central.

O provedor de e-mail e senha precisa estar habilitado no Firebase Authentication, e as regras publicadas precisam permitir o modelo de cadastro do `main`. Nenhuma regra foi publicada por esta implementação. O formulário faz validação local e o Firebase aplica a política de senhas e as regras de acesso. Os pedidos, os pagamentos e a configuração completa da loja continuam demonstrativos; o cardápio já usa produtos reais do Firestore; o status `pending` libera apenas o painel atual e não ativa vendas.

## Páginas

| Rota                               | Conteúdo                                   |
| ---------------------------------- | ------------------------------------------ |
| `/`                                | Início e busca por região                  |
| `/restaurantes`                    | Lista e filtros de restaurantes            |
| `/loja`                            | Cardápio do restaurante                    |
| `/produto`                         | Produto, quantidade e carrinho             |
| `/carrinho`                        | Revisão dos itens                          |
| `/checkout`                        | Dados de entrega ou retirada               |
| `/pagamento`                       | Forma de pagamento demonstrativa           |
| `/pedido-confirmado`               | Resumo da simulação                        |
| `/restaurantes/login`              | Login do proprietário no Firebase          |
| `/cliente`                         | Conta demonstrativa, carrinhos e pedidos   |
| `http://cardap.<tenant>/dashboard` | Administração demonstrativa do restaurante |

Os endereços originais, como `/cardap-produto.html`, redirecionam para as novas rotas e preservam os parâmetros de consulta.

## Estrutura

```text
app/
├── layout.tsx                 # Layout raiz compartilhado
├── globals.css                # Estilos globais
├── (client)/                  # Experiência do consumidor
│   ├── page.tsx               # /
│   ├── restaurantes/
│   ├── loja/
│   ├── produto/
│   ├── carrinho/
│   ├── checkout/
│   ├── pagamento/
│   ├── pedido-confirmado/
│   ├── cliente/
│   ├── _components/
│   ├── _lib/
│   └── _styles/
└── (tenant)/                  # Administração do restaurante
    ├── tenants/[tenant]/dashboard/ # Destino interno de /dashboard
    ├── _components/
    ├── _lib/
    └── _styles/
components/behavior.tsx        # Inicialização compartilhada no navegador
lib/dom.ts                    # Utilitários tipados do DOM
lib/types.ts                  # Tipos compartilhados
lib/tenant.ts                 # Resolução dinâmica do domínio
proxy.ts                      # Rewrite do domínio para o tenant
styles/flow.css               # Estilos usados pelas duas áreas
tests/                        # Testes de navegação e fluxos
```

Os [Route Groups do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) organizam as páginas por área sem adicionar `(client)` ou `(tenant)` às URLs. A página inicial fica em `(client)`, e o painel do restaurante fica em `(tenant)`. Ambos usam `app/layout.tsx`.

As pastas privadas `_components`, `_lib` e `_styles` mantêm os arquivos específicos próximos às rotas, seguindo a [documentação de organização do Next.js](https://nextjs.org/docs/app/getting-started/project-structure). O código compartilhado permanece na raiz, e os imports usam o alias `@/`. A implementação das quatro etapas do checkout fica em `(client)/_lib/checkout-flow.ts`.

O layout autenticado fica em `app/(tenant)/tenants/[tenant]/layout.tsx`, separado das páginas públicas de login e cadastro. Ele monta `DashboardShell`, os controles de sessão e o conteúdo recebido em `children`. Em `_components/dashboard/`, `DashboardSidebar` contém o `aside` (menu lateral), `DashboardHeader` contém o `header` (barra superior), e `DashboardFooter` contém o rodapé. O shell envolve o conteúdo da página com `main`.

As seções do painel ficam em `dashboard-overview.tsx`, `dashboard-orders.tsx`, `dashboard-menu.tsx` e `dashboard-settings.tsx`; `dashboard.tsx` compõe essas seções e inicializa as interações. Os IDs e atributos usados pelo comportamento foram preservados. A função `requireTenant`, em `_lib/require-tenant.ts`, centraliza a autorização, com reutilização da consulta apenas dentro da mesma renderização do servidor. O layout e a página verificam o acesso; novas páginas protegidas também devem chamar essa função antes de carregar seus dados.

O nome `(client)` identifica a área do consumidor; os componentes que executam no navegador continuam definidos pela diretiva `"use client"`. O grupo `(tenant)` organiza a administração do restaurante; o tenant é identificado dinamicamente pelo domínio. O painel exige autenticação e autorização do proprietário no servidor.

As interações mantêm a implementação com APIs do DOM. Os links entre páginas realizam navegação completa para reinicializar cada tela e seus estilos. O Strict Mode está desativado enquanto essas interações forem imperativas, evitando inicializações duplicadas no desenvolvimento.

Os dados de demonstração usam `localStorage` e `sessionStorage`. Pedidos e pagamentos reais continuam sem integração com um backend. O cadastro e o login do restaurante já usam o Firebase. As fontes são carregadas do Google Fonts e precisam de conexão com a internet.

## Acesso local sem DNS

Execute o projeto na porta 3002:

```bash
npm run dev -- --port 3002
```

Acesse diretamente:

- http://hero-burger.localhost:3002/dashboard
- http://pizza-da-vila.localhost:3002/dashboard

O formato local é `<tenant>.localhost`, com `localhost` no final. Navegadores modernos resolvem esses endereços para a própria máquina, sem editar `/etc/hosts`, configurar DNS ou instalar um proxy. `localhost.hero-burger` tem outra estrutura e não funciona dessa forma. Cada nome antes de `.localhost` identifica um tenant dinamicamente.

## Domínios dos tenants

Também é aceito o padrão `cardap.<tenant>`, por exemplo `cardap.hero-burger` e `cardap.pizza-da-vila`. Não existe uma pasta nem uma configuração por restaurante. `lib/tenant.ts` extrai o identificador do host, e `proxy.ts` reescreve `/dashboard` para `/tenants/[tenant]/dashboard`, sem alterar a URL exibida. Esse mecanismo usa [Proxy do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

O dashboard recebe o identificador no servidor, mostra o nome cadastrado no Firebase e usa uma chave de `sessionStorage` por tenant. Os pedidos do painel continuam sendo exemplos; os produtos do cardápio são carregados do Firestore. O servidor consulta o cadastro, o nome comercial, o status e o domínio no Firebase antes de liberar o painel. `/dashboard` no domínio central abre a loja do proprietário autenticado. O acesso direto à rota interna `/tenants/...` retorna 404.

Para usar o formato alternativo `cardap.<tenant>` localmente:

1. Adicione os domínios desejados ao DNS local ou ao arquivo `/etc/hosts`:

   ```text
   127.0.0.1 cardap.hero-burger cardap.pizza-da-vila
   ```

2. Execute o Next.js na porta 3002:

   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3002
   ```

3. Acesse `http://cardap.hero-burger:3002/dashboard`.

4. Acesse `http://cardap.hero-burger:3002/dashboard`.

Para usar exatamente `http://cardap.hero-burger/dashboard`, sem a porta, é necessário um proxy na porta HTTP 80. A configuração [config/Caddyfile](config/Caddyfile) encaminha dinamicamente os hosts `cardap.<tenant>` para `127.0.0.1:3002`, conforme a [documentação do Caddy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy). Com o Caddy instalado e permissão para escutar na porta 80:

```bash
caddy run --config config/Caddyfile --adapter caddyfile
```

O arquivo `/etc/hosts` e a configuração de DNS da máquina não são alterados pelo projeto. Para resolver novos nomes automaticamente, use DNS local que atenda ao padrão; `/etc/hosts` exige uma entrada para cada domínio. O padrão `cardap.<tenant>` é destinado ao ambiente local; a publicação precisa de domínios registrados e DNS configurado.

## Validação

```bash
npm run typecheck
npm run build
npm run format:check
npx playwright install chromium
npm test
```

Os testes verificam as páginas do consumidor, redirecionamentos antigos, busca por região, conta demonstrativa, compra simulada e proteção do painel em múltiplos domínios, validação de credenciais com respostas simuladas e bloqueio das rotas internas. Os testes de sessão simulam as respostas do Firebase para cobrir expiração, revogação, suspensão, outro proprietário, outro domínio e falhas de rede, sem criar contas reais. O Chromium resolve os hosts de teste para o servidor local sem alterar `/etc/hosts`.

http://hero-burger.localhost:3002/dashboard

A opção “Para restaurantes” e o botão “Conhecer a área de parceiros” da página inicial abrem `/restaurantes/login`, localizada em `app/(tenant)/restaurantes/login/page.tsx`. O formulário autentica o proprietário no Firebase, estabelece a sessão no servidor e abre `/dashboard`. O link de cadastro abre `/restaurantes/cadastro`.

## Teste real de isolamento no Firebase

O comando abaixo cria duas contas temporárias no projeto configurado em `.env.local`, cadastra suas lojas, testa login, sessões, URLs protegidas e acesso cruzado no Firestore. Ao final, remove somente as contas e os documentos criados pela execução. Ele não publica regras nem altera lojas existentes.

Requer Firebase CLI instalado e autenticado, permissão para consultar as regras publicadas e remover os documentos temporários, além do aplicativo em execução na origem indicada. O teste cancela antes de criar contas se não conseguir confirmar a permissão de limpeza.

```bash
RUN_FIREBASE_LIVE_TESTS=1 FIREBASE_TEST_APP_ORIGIN=http://localhost:3001 npm run test:security:live
```

O relatório fica em `test-results/firebase-live-isolation.json`, fora do Git, sem senhas nem tokens. As verificações de autorização usam tokens de usuários reais; a credencial administrativa é usada apenas na consulta das regras, preparação dos dados de teste e limpeza. Esta execução cobre Firestore e as rotas do aplicativo; não valida Storage, App Check nem restrições da chave de API.

## Cardápio do tenant

O menu lateral **Cardápio** abre `/dashboard/cardapio`, com produtos reais do Firestore, busca por nome, filtro por categoria, paginação de 50 itens, edição de disponibilidade e exclusão com confirmação. O botão **Cadastrar produto** abre `/dashboard/cardapio/novo`. A edição fica em `/dashboard/cardapio/[productId]/editar`; ambas as páginas verificam a sessão e o tenant no servidor.

O formulário segue os campos e o modelo do `anow/main`: nome, descrição, categoria, preço base em centavos, imagem JPG/PNG/WebP de até 5 MB, disponibilidade, grupos de complementos e divisão em partes. A foto é obrigatória no cadastro e opcional na edição. Categorias podem ser criadas no formulário e na listagem. Complementos e divisão mantêm os limites do projeto compartilhado: até 5 grupos, até 10 opções por grupo e até 20 opções no total, incluindo a divisão.

Os serviços ficam em `lib/menu/`, os componentes em `app/(tenant)/_components/products/` e os hooks de opções e imagens em `app/(tenant)/_hooks/`. As gravações usam a identidade do proprietário e as regras do Firebase. A loja precisa estar com status `configured` ou `active` e carteira de recebimento válida. A tela informa essa exigência e bloqueia alterações enquanto o cadastro estiver pendente.

As regras locais de Firestore e Storage foram preparadas para permitir a exclusão de produtos e imagens apenas pelo proprietário de uma loja configurada ou ativa, preservando o bloqueio de outros tenants. Para a exclusão e a substituição de fotos funcionarem no projeto real, é necessário publicar `firestore.rules` e `storage.rules`. Como o Firebase é compartilhado com o `main`, essa publicação afeta os dois aplicativos; mantenha as regras sincronizadas antes de próximos deploys. Não é necessário publicar Functions para esta implementação.

Produto e imagem são armazenados em serviços diferentes. A exclusão remove primeiro o documento; se a limpeza da imagem falhar, a tela informa que o produto foi excluído, mas a imagem não foi removida. Leituras e gravações não utilizam credenciais administrativas no navegador.

Para testar o CRUD e o isolamento sem acessar o Firebase real, use os emuladores com um projeto `demo-`:

```bash
npm run test:menu:rules
```

Requer Firebase CLI e Java 21. O comando usa `firebase.emulators.json` e `playwright.rules.config.ts`, cria duas contas apenas no emulador e testa criação de categoria, cadastro com foto e personalizações, edição, disponibilidade, exclusão e bloqueios entre tenants, lojas pendentes e suspensas.

## Organização das configurações

Dentro da seção **Configurações**, o painel organiza oito áreas em abas: dados da loja, empresa e contato, endereço, horários, entrega e retirada, recebimentos, funcionários e permissões. A estrutura segue as configurações e o cadastro inicial do `anow/main`.

Os componentes ficam em `app/(tenant)/_components/settings/`. `settings-sections.ts` define a navegação e os campos das novas prévias; `dashboard-settings.tsx` coordena as abas, incluindo navegação por teclado. O formulário original de dados da loja e seus IDs foram preservados para manter as interações existentes.

Esta organização mantém as configurações em demonstração. As prévias de dados, horários, entrega e recebimentos usam `sessionStorage` com uma chave por tenant e por seção; salvar essas prévias não modifica o Firestore nem a carteira real. A seção Funcionários usa os registros e serviços reais do Firebase; a seção Permissões permanece informativa. O acesso efetivo ao painel continua restrito ao proprietário pelo fluxo de autenticação existente.

## Organização dos pedidos

A seção Pedidos usa um quadro com quatro etapas: novos, em preparo, em entrega e concluídos. Cada coluna mostra um contador e os cards com número do pedido, cliente, itens, horário e total. A busca inclui cliente, número e itens; os filtros por etapa exibem os respectivos pedidos. O layout adapta as colunas para telas menores.

O componente `dashboard-orders.tsx` usa `use-dashboard-orders.ts`; os cards ficam em `_components/orders/order-card.tsx`. O estado demonstrativo está em `lib/orders/demo-store.ts`, compartilhado com a visão geral para sincronizar os contadores, pedidos recentes e ações. As alterações continuam em `sessionStorage`, isoladas por tenant, e não recebem nem modificam pedidos reais do Firebase.

## Entregadores

O menu lateral abre `/dashboard/entregadores`, protegido pelo proxy e pela validação de tenant no servidor. A página permite cadastrar e editar nome, telefone, veículo e disponibilidade; buscar por nome ou telefone; filtrar por disponibilidade; e excluir com confirmação. Entregadores com pedidos em andamento não podem ser excluídos antes de remover a atribuição.

Pedidos em preparo ou em entrega têm um seletor de entregador. A equipe e as atribuições usam o mesmo estado demonstrativo dos pedidos, em `lib/orders/demo-store.ts`. Um entregador indisponível ou ocupado em outra entrega não pode receber uma nova atribuição. A conclusão libera a disponibilidade operacional, e o nome fica no histórico do pedido. Os links dos pedidos atribuídos abrem a área Pedidos com a busca pelo número correspondente.

A lógica da página fica em `_hooks/use-couriers.ts`, a interface em `_components/couriers/`, e a rota em `tenants/[tenant]/dashboard/entregadores/page.tsx`. Os dados ficam em `sessionStorage`, separados por tenant; não criam contas de login para entregadores nem gravações no Firebase. Configurações de taxa e prazo continuam em Configurações → Entrega e retirada.

## Funcionários

Configurações → Funcionários lista os registros reais de `tenants/{uid}/employees`, com busca por nome ou e-mail, filtro por situação, paginação de 50 registros, ativação/desativação e remoção com confirmação. O cadastro usa as funções já publicadas `employeeInvite` e `employeeResendInvite`, na mesma região e com o mesmo contrato do `anow/main`. A sessão do proprietário não é substituída ao cadastrar um funcionário.

A interface fica em `_components/settings/team-section.tsx` e `_components/employees/employee-dialogs.tsx`; a lógica fica em `_hooks/use-employees.ts`; os tipos, validações e serviços ficam em `lib/employees/`. A listagem só carrega quando a aba é selecionada. As ações confirmam a identidade do proprietário e o status da loja antes de consultar o Firestore ou chamar as funções. Lojas pendentes podem consultar a lista, mas precisam concluir o cadastro antes de alterá-la.

Os cargos disponíveis são atendente e gerente. Quando o serviço retorna uma senha temporária, as credenciais ficam apenas na memória do componente até o modal ser fechado, com senha inicialmente oculta e cópia manual opcional. Não são gravadas em `localStorage`, `sessionStorage` ou logs. Reenviar acesso depende da função existente. Remover exclui o vínculo no Firestore; não remove a conta global do Firebase Authentication.

Esta implementação gerencia a equipe compartilhada com o Anow. O login de funcionários e as permissões por cargo neste painel continuam pendentes; as rotas do Cardap permanecem restritas ao proprietário. Nenhuma Function ou regra foi publicada para essa mudança, e os testes não enviam convites reais.

## Checklist para preparar a loja

A visão geral mostra um card na cor primária enquanto houver pendências no cadastro. Ao clicar, o proprietário abre um checklist com progresso e links para apresentação, contato, endereço, horários, entrega/retirada, carteira, categorias, produto disponível e finalização do cadastro. Os links de configurações usam `section` para abrir a aba correspondente.

`lib/onboarding/readiness.ts` contém as validações; `lib/onboarding/service.ts` consulta exclusivamente o tenant autenticado; `_hooks/use-store-readiness.ts` controla carregamento, atualização e modal. O checklist lê o cadastro salvo, as categorias e os produtos disponíveis; também verifica categoria, preço e existência da foto no Storage. Se um produto estiver incompleto, procura outro disponível antes de considerar essa etapa pendente.

Prévias em `sessionStorage` não concluem o checklist. O Wallet ID é tratado como identificador informado, sem afirmar validação de titularidade no Asaas. A ativação é uma etapa separada, concluída somente quando o status salvo é `active`. O card não altera status nem publica a loja. Quando todas as etapas e a ativação estão concluídas, o aviso deixa de aparecer.

## Plano e assinatura

Configurações → Plano e assinatura apresenta três planos fictícios: Essencial, Profissional e Completo, com valores mensais/anuais e benefícios de exemplo. O catálogo fica em `lib/plans/catalog.ts`; a lógica da prévia está em `_hooks/use-plan-preview.ts`; a interface fica em `_components/settings/plan-section.tsx`.

A seleção é salva em `sessionStorage` por tenant. Não cria assinatura, não gera cobrança, não concede permissões e não aplica limites reais aos produtos ou funcionários. O plano Profissional mensal aparece como exemplo inicial. Valores e benefícios precisam ser substituídos pelo catálogo comercial antes de integrar uma contratação real.

# PRA FAZER - graçon

O fluxo pode ser:

1. Garçom solicita a conta: a mesa fica como “Conta solicitada”.
2. Na plataforma web, aparece na seção Salão → Contas a fechar, com mesa, itens e total.
3. Caixa confere a conta: aplica desconto autorizado, divide valores e registra os pagamentos.
4. Após quitar o total, o caixa encerra a conta. A mesa fica “Aguardando limpeza”.
5. Garçom confirma que está pronta: a mesa volta para “Disponível”.
   Assim, ficam separadas duas coisas: conta paga e mesa pronta para outro cliente.

No app do garçom, “Solicitar conta ao caixa” apenas avisa e muda o status. Quem pode confirmar pagamento deve ser definido pelas permissões: caixa, gerente ou proprietário. Essa integração ainda precisa ser implementada; o botão do app não confirma pagamento sozinho.
