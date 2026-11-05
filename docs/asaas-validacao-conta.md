# Validação de conta Asaas independente

Em Configurações → Recebimentos, o proprietário informa o Wallet ID e uma chave de API da própria conta Asaas. Não é necessário criar subconta pela plataforma. A função `tenantValidateAsaasAccount` é restrita ao proprietário e exige App Check fora do emulador.

## Fluxo

1. `validate` consulta `GET /v3/wallets/`. Se a carteira informada não estiver na resposta, encerra sem consultar os dados comerciais.
2. Consulta `GET /v3/myAccount/commercialInfo/` e exige dados comerciais `APPROVED`. Com CNPJ, compara o documento da conta com o CNPJ salvo em Empresa e contato. Sem CNPJ, pede CPF válido e compara com a conta de pessoa física. Esse CPF é declarado no momento da consulta; isso não comprova a identidade civil do usuário autenticado.
3. Mostra nome/razão social, documento mascarado e ambiente. Gera prova privada válida por dez minutos, vinculada ao proprietário, carteira, ambiente e dados cadastrais usados na consulta.
4. `confirm` exige confirmação explícita e salva a carteira em transação. Repetir a mesma confirmação é idempotente. Alteração de cadastro ou carteira invalida a prova. Uma loja ativa pode conferir a carteira atual, mas a troca exige suporte.
5. `status` informa se a carteira atual continua vinculada à conferência. Alterações no CNPJ, responsável ou razão social invalidam esse vínculo.

A chave nunca é gravada, retornada ou registrada em logs pela implementação; ela é enviada ao backend para as duas consultas GET e limpa do formulário ao iniciar a consulta ou sair da seção. O backend usa apenas os domínios fixos do Asaas, recusa redirecionamentos e não executa operações financeiras. A resposta bruta, CPF/CNPJ integral, e-mail e dados bancários do Asaas não são persistidos. O registro privado `tenantAsaasVerification/{uid}` guarda prova temporária, nome, documento mascarado e vínculo por hash; acesso direto pelo navegador é negado. Há limite de cinco consultas por loja a cada quinze minutos. Não há polling, assinatura extra ou webhook neste fluxo.

O formulário antigo e a função genérica `tenantSaveProfile` não salvam mais carteiras. As regras do Firestore também recusam gravação direta da carteira e a antiga conclusão inicial pelo cliente. O cadastro inicial mínimo e a reserva do slug continuam permitidos; o preenchimento é feito pelas Functions.

## Publicação e validação real

- Publicar `tenantValidateAsaasAccount`, a atualização de `tenantSaveProfile`, as regras do Firestore e a aplicação web em conjunto.
- Configurar `ASAAS_ENVIRONMENT=sandbox` ou `production` nas Functions. O padrão é sandbox, igual ao checkout. A chave do restaurante deve pertencer ao mesmo ambiente. Não colocar chaves de restaurante em `NEXT_PUBLIC_*`, Firestore ou arquivos versionados.
- Garantir que App Check esteja configurado para o domínio publicado.
- Homologar primeiro com conta e chave de sandbox: carteira correta, chave incorreta/revogada, documento divergente, aprovação pendente, expiração e confirmação. Os testes automatizados usam respostas simuladas; nenhuma conta real foi consultada durante a implementação.
- Em produção, validar a conta real na própria interface. O responsável pode revogar a chave no Asaas depois da consulta; o Cardap não precisa armazená-la.

## Limites

A conferência é pontual e não acompanha mudanças posteriores no Asaas. `commercialInfo.status` se refere aos dados comerciais; não garante aprovação de documentos, conta bancária, análise de risco, disponibilidade de split ou liberação de recebimentos. Nenhum pagamento ou transferência de teste é criado. A validação não ativa vendas.

Carteiras legadas não são consideradas validadas por este fluxo: a seção apresenta a pendência até nova conferência. O checkout e o checklist geral mantêm os critérios anteriores; esta mudança não impõe bloqueio retroativo de vendas nem migra registros existentes. Uma política de ativação baseada nesta conferência exige integração adicional na liberação comercial e no checkout.

## Documentação oficial consultada

- [Recuperar WalletId](https://docs.asaas.com/reference/recuperar-walletid)
- [Recuperar dados comerciais](https://docs.asaas.com/reference/recuperar-dados-comerciais)

## Verificação automatizada desta implementação

Os 12 testes específicos cobrem documento divergente, autenticação, isolamento, chave recusada, expiração, ambiente, limite de consultas, confirmação idempotente e conclusão de cadastro sem ativação. A suíte do backend, compilação, TypeScript e formatação passaram. Os 113 testes web passaram entre a execução geral e a repetição dos cinco testes que exigiam compilar com configuração Firebase de demonstração.

O teste de regras que impede adulterar carteira e prova passou no emulador. A suíte completa das regras encontrou uma falha de upload de imagem (`storage.rules`, linha 9, leitura cruzada do Firestore nula). A falha também foi reproduzida usando o arquivo de regras do Firestore anterior a esta alteração, com Firebase CLI 15.34.2; não foi alterada a regra de Storage neste trabalho.
