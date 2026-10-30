# Cardap Impressão

Aplicativo Electron que abre o painel e envia comandas à impressora do sistema sem a janela de impressão do navegador. A fila é persistida no Firebase e isolada por restaurante. O painel não tem acesso ao Node.js nem envia HTML ou comandas arbitrárias para o processo de impressão.

## Abrir o aplicativo

Na raiz do projeto, instale as dependências e inicie o painel:

```sh
npm run desktop:install
npm run dev -- --port 3001
```

Em outro terminal:

```sh
npm run desktop:start
```

Ao iniciar, uma tela local de carregamento aguarda a verificação da sessão e a preparação do login ou do painel. Uma sessão Firebase persistida pode restaurar o acesso sem mostrar o formulário. Falhas de conexão exibem opções para tentar novamente, configurar o endereço ou fechar o aplicativo.

O endereço inicial é `http://localhost:3001/dashboard/pedidos`. Em produção, configure a URL HTTPS da plataforma em **Impressão → Configurar impressora**. `CARDAP_PANEL_URL` também permite informar o endereço na primeira execução.

1. Entre com a conta do proprietário. O servidor valida a identidade e o restaurante.
2. Em **Configurar impressora**, escolha uma impressora instalada e papel de 58 ou 80 mm. Configure a mesma largura no driver.
3. Em Pedidos, escolha **Usar este computador para imprimir** e confirme. A escolha fica salva por restaurante no Firebase.
4. Aceite um pedido ou habilite **Aceitar automaticamente**. O aceite e a criação da comanda acontecem na mesma transação do servidor.

O aceite automático agora é uma configuração da loja, não de uma aba: o gatilho no Firebase aceita pedidos novos mesmo sem o painel aberto. Impressão física exige que o Electron responsável esteja aberto, autenticado e com impressora configurada. Sem ele, as comandas aguardam na fila. Aceitar pelo Chrome também gera a comanda para o Electron responsável.

## Isolamento e dois computadores

Cada instalação recebe um identificador aleatório persistente. Cada restaurante escolhe um computador responsável. A mesma instalação pode ser escolhida por restaurantes diferentes, mas só consome a fila do restaurante da sessão atual.

O processo nativo valida a sessão usando `tenantOrderOperations`. O token Firebase é mantido apenas em memória. Sair, mudar de conta, fechar ou navegar para outra página interrompe novas reservas; não é possível recolher papel já enviado ao sistema de impressão.

Antes de imprimir, o aplicativo reserva uma comanda por transação e confirma o início no servidor. A reserva tem 30 segundos e pode ser recuperada somente enquanto o envio ainda não começou. Cada reserva recebe um token novo. Trocar o computador invalida o início por uma reserva anterior.

Depois do início, não há retomada automática da mesma tentativa. Se houver queda ou resultado incerto, a comanda vai para revisão. O aplicativo persiste confirmações locais para recuperar o resultado após reiniciar sem reenviar o papel. O servidor também rejeita confirmações de outro computador, restaurante ou token de reserva.

**Revisar → Confirmar** permite uma nova tentativa após conferir a impressora. Se a tentativa ainda estiver em envio, aguarde dois minutos. O reenvio pode gerar segunda via se o papel já saiu: impressoras e seus drivers não fornecem uma garantia universal de saída física. O estado `submitted` significa que o sistema de impressão recebeu o envio.

O cadastro do computador e o registro local de envios ficam em `userData` do Electron. Não apague esses arquivos para resolver falhas; isso remove parte da proteção contra duplicações. Nenhuma senha ou token Firebase é persistido nesses arquivos.

## Origem dos pedidos reais

A tela de Pedidos lê exclusivamente `tenants/{tenantId}/orders` pelo serviço autenticado. Pedidos locais de demonstração não são migrados nem impressos. O checkout e os apps ainda precisam usar um backend de criação de pedidos que grave nessa coleção; esta entrega não cria cobranças nem conecta o checkout de demonstração.

Consulte [o contrato e os estados da fila](../../docs/firebase-order-printing.md). Nenhuma alteração nas regras do Firestore foi necessária: clientes não recebem permissão direta de escrever pedidos ou filas. As alterações passam por funções autenticadas.

O painel atualiza os pedidos a cada 10 segundos e ao recuperar o foco. O Electron consulta uma comanda a cada 3 segundos enquanto houver sessão e impressora configuradas. Falhas de rede preservam a fila no servidor.

## Distribuição e testes

```sh
npm run desktop:pack
npm --prefix desktop/printing test
npm run typecheck
```

O executável fica em `desktop/printing/dist/linux-unpacked/cardap-impressao`. Para instaladores, execute `npm --prefix desktop/printing run dist` no sistema de destino: Linux AppImage, Windows NSIS ou macOS DMG. Distribuição pública exige configurar a assinatura apropriada. A impressão física deve ser validada com a impressora e o driver do restaurante.

Referência: [API de impressão do Electron](https://www.electronjs.org/docs/latest/api/web-contents#contentsprintoptions-callback).
