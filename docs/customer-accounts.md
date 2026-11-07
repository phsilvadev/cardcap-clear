# Contas de clientes

O cliente usa Firebase Auth com e-mail/senha em um app nomeado `cardap-customer`. A autenticação do restaurante continua no app padrão; entrar e sair do cliente não altera a sessão do parceiro.

- `/cliente/login`, `/cliente/cadastro`, `/cliente/recuperar-senha`: acesso, cadastro e recuperação pelo Firebase Auth.
- `/cliente`: perfil, confirmação de e-mail, endereços, favoritos, carrinhos do navegador e histórico de compras.
- `customerOperations`: lê e grava os dados de `customers/{uid}` após validar a identidade, desativação e revogação. O UID nunca vem do corpo da requisição. As regras padrão negam acesso direto a esses documentos.
- `publicCheckout`: registra `customerUid` a partir do token verificado e cria o índice privado de pedidos na mesma transação da compra. Pedidos de visitantes não são reivindicados por e-mail ou telefone.
- O histórico consulta o pedido real do restaurante, incluindo preparo, entrega, conclusão, cancelamento e situação do pagamento. A primeira página é atualizada a cada 15 segundos enquanto estiver visível.
- O e-mail do perfil vem da identidade autenticada; a troca de senha usa o fluxo de recuperação do Firebase. Endereços têm limite de cinco, com um principal; favoritos têm limite de cinquenta.

Habilite o provedor E-mail/senha no Firebase Authentication e configure os domínios autorizados e modelos de e-mail. Pedidos continuam disponíveis para visitantes. Para App Check, configure as variáveis públicas já documentadas em `.env.example`; `publicCheckout` mantém a exigência de App Check em produção. O Pix continua dependendo dos segredos e da configuração Asaas existentes.

## Publicar sem depender dos segredos de integrações externas

```powershell
npm.cmd --prefix firebase/employee-access install
node scripts/prepare-customer-deploy.cjs
firebase deploy --config .next/customer-deploy.firebase.json --only "functions:employee-access:customerOperations,functions:employee-access:publicCheckout" --project cardap-e0bf0
```

O pacote temporário importa os mesmos módulos da aplicação e mantém as verificações de autenticação e App Check. Não publica outras Functions. O comando normal `firebase deploy --only functions:employee-access` continua disponível quando todos os segredos externos estiverem configurados.

## Verificação

```powershell
npm.cmd run typecheck
node --test firebase/employee-access/customer.test.cjs firebase/employee-access/checkout.test.cjs
npm.cmd run build
npx.cmd playwright test tests/customer.spec.ts
```

Os testes de navegador simulam o protocolo Firebase Auth e o transporte callable para não criar contas nem enviar e-mails reais. Os testes do servidor cobrem isolamento, identidade, revogação, validação de endereços, favoritos e vínculo/paginação de pedidos.
