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
| `/restaurantes/login`              | Login do restaurante (prévia visual)       |
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

O nome `(client)` identifica a área do consumidor; os componentes que executam no navegador continuam definidos pela diretiva `"use client"`. O grupo `(tenant)` organiza a administração do restaurante; o tenant é identificado dinamicamente pelo domínio. O controle de acesso ainda depende de autenticação e autorização no backend.

As interações mantêm a implementação com APIs do DOM. Os links entre páginas realizam navegação completa para reinicializar cada tela e seus estilos. O Strict Mode está desativado enquanto essas interações forem imperativas, evitando inicializações duplicadas no desenvolvimento.

Os dados de demonstração usam `localStorage` e `sessionStorage`. Autenticação, pedidos e pagamentos reais continuam sem integração com um backend. As fontes são carregadas do Google Fonts e precisam de conexão com a internet.

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

O dashboard recebe o identificador no servidor, mostra o nome derivado do domínio e usa uma chave de `sessionStorage` por tenant. Os pedidos e produtos continuam sendo exemplos. Nesta etapa, qualquer identificador válido no padrão de domínio abre uma demonstração; o cadastro, a existência do restaurante, seu nome comercial e as permissões devem ser consultados no backend quando ele for integrado. `localhost/dashboard` e o acesso direto à rota interna `/tenants/...` retornam 404.

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

Os testes verificam as páginas do consumidor, redirecionamentos antigos, busca por região, conta demonstrativa, compra simulada e painel em múltiplos domínios, incluindo isolamento do estado e validação do domínio na rota interna. O Chromium resolve os hosts de teste para o servidor local sem alterar `/etc/hosts`.

http://hero-burger.localhost:3002/dashboard

A opção “Para restaurantes” e o botão “Conhecer a área de parceiros” da página inicial abrem `/restaurantes/login`, localizada em `app/(tenant)/restaurantes/login/page.tsx`. O formulário possui campos de e-mail e senha, mas ainda não envia credenciais nem autentica usuários.
