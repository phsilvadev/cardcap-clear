# Cardap

Projeto Next.js com App Router, React e TypeScript em modo estrito, migrado das 10 páginas HTML originais. O conteúdo, a identidade visual e as interações de demonstração foram preservados.

## Executar

Requer Node.js 20.9 ou superior.

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

O provedor de e-mail e senha precisa estar habilitado no Firebase Authentication, e as regras publicadas precisam permitir o modelo de cadastro do `main`. Nenhuma regra foi publicada por esta implementação. O formulário faz validação local e o Firebase aplica a política de senhas e as regras de acesso. Os pedidos, produtos, pagamentos e a configuração completa da loja continuam demonstrativos; o status `pending` libera apenas o painel atual e não ativa vendas.

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

O dashboard recebe o identificador no servidor, mostra o nome cadastrado no Firebase e usa uma chave de `sessionStorage` por tenant. Os pedidos e produtos continuam sendo exemplos. O servidor consulta o cadastro, o nome comercial, o status e o domínio no Firebase antes de liberar o painel. `/dashboard` no domínio central abre a loja do proprietário autenticado. O acesso direto à rota interna `/tenants/...` retorna 404.

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
