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

| Rota                 | Conteúdo                                   |
| -------------------- | ------------------------------------------ |
| `/`                  | Início e busca por região                  |
| `/restaurantes`      | Lista e filtros de restaurantes            |
| `/loja`              | Cardápio do restaurante                    |
| `/produto`           | Produto, quantidade e carrinho             |
| `/carrinho`          | Revisão dos itens                          |
| `/checkout`          | Dados de entrega ou retirada               |
| `/pagamento`         | Forma de pagamento demonstrativa           |
| `/pedido-confirmado` | Resumo da simulação                        |
| `/cliente`           | Conta demonstrativa, carrinhos e pedidos   |
| `/dashboard`         | Administração demonstrativa do restaurante |

Os endereços originais, como `/cardap-produto.html`, redirecionam para as novas rotas e preservam os parâmetros de consulta.

## Estrutura

- `app/`: rotas, metadados, layout e estilos comuns.
- `components/`: conteúdo TSX e componentes de inicialização no navegador.
- `lib/behaviors/`: interações originais, executadas após a hidratação; o checkout compartilha a mesma implementação entre suas quatro etapas.
- `lib/types.ts`: tipos compartilhados de carrinho, cliente, checkout, pedidos e painel.
- `styles/`: estilos específicos de cada página.

As interações mantêm a implementação com APIs do DOM. Os links entre páginas realizam navegação completa para reinicializar cada tela e seus estilos. O Strict Mode está desativado enquanto essas interações forem imperativas, evitando inicializações duplicadas no desenvolvimento.

Os dados de demonstração usam `localStorage` e `sessionStorage`. Autenticação, pedidos e pagamentos reais continuam sem integração com um backend. As fontes são carregadas do Google Fonts e precisam de conexão com a internet.

## Validação

```bash
npm run typecheck
npm run build
npm run format:check
npx playwright install chromium
npm test
```

Os testes verificam as dez páginas, redirecionamentos antigos, busca por região, conta demonstrativa, compra simulada e navegação no painel.
