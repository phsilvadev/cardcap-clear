# Login por subdomínio

O login central autentica a conta no Firebase e valida o vínculo do proprietário. O destino é calculado pelo servidor com o slug salvo no cadastro. Exemplo: `http://localhost:3001` → `http://hero-burger.localhost:3001/dashboard`. A porta é preservada; não é necessário outro servidor para cada restaurante.

## Estado de ativação

O código está protegido por `AUTH_TENANT_SUBDOMAIN_LOGIN`. O padrão é **desativado** para preservar o acesso atual enquanto a permissão de assinatura de tokens não estiver autorizada. Não habilite essa opção antes de concluir o requisito IAM abaixo.

A revisão automática de aprovação bloqueou a alteração IAM por exigir autorização explícita do usuário. Nenhuma permissão foi concedida. A nova função pode ser publicada e testada sem ativar o fluxo, mas não consegue concluir a assinatura sem a permissão.

## Transferência de sessão

1. O navegador autentica no domínio central e envia o ID token para a API de sessão na mesma origem.
2. A API valida a conta, a loja e o domínio reservado e retorna o destino correto.
3. `tenantLoginTransfer` emite um código aleatório de 256 bits, válido por 60 segundos. O Firestore recebe apenas o hash do código, com UID, origem, destino e prazo. Clientes não têm permissão de ler ou escrever essa coleção.
4. O código segue por formulário **POST** até o subdomínio, nunca por query string. Não são enviados senha ou ID token nesse formulário.
5. O servidor do destino valida a origem central e resgata o código. O resgate é transacional e de uso único, confere novamente usuário, revogação, loja e vínculo de domínio.
6. O Firebase Admin assina um custom token. Ele fica temporariamente em cookie HttpOnly, restrito ao destino, por até 60 segundos.
7. A página `/restaurantes/continuar` obtém o token por uma requisição da mesma origem, apaga o cookie temporário, autentica o SDK Firebase local e cria o cookie de sessão do subdomínio.

Cookies de sessão continuam HttpOnly, SameSite Strict e sem `Domain`: não são compartilhados entre lojas. Respostas de transferência usam `no-store` e não expõem credenciais em URLs. Códigos expirados são recusados mesmo que os documentos ainda existam; uma política de TTL pode ser configurada para limpar documentos vencidos.

Ao sair, a aplicação limpa a sessão do restaurante e conclui a saída na origem central usada no login, incluindo o estado persistido do SDK. A limpeza central exige navegação POST a partir de um subdomínio permitido e marcador HttpOnly temporário; não é executada por uma simples URL GET externa.

## Requisito IAM — pendente de autorização

O runtime usa a conta `1066496387642-compute@developer.gserviceaccount.com`. O Firebase Admin precisa assinar tokens com essa conta. A concessão necessária é:

- Recurso: somente a própria conta de serviço acima.
- Papel: `roles/iam.serviceAccountTokenCreator`.
- Membro: `serviceAccount:1066496387642-compute@developer.gserviceaccount.com`.

Essa é uma permissão sensível, pois permite assinar tokens de autenticação. Não é necessário conceder o papel ao projeto inteiro, aos usuários do navegador ou a outras contas. Preserve o restante da política IAM e seu etag ao aplicar uma concessão autorizada.

## Configuração após autorização

Para desenvolvimento, após autorizar a assinatura e confirmar a publicação da função:

```dotenv
AUTH_TENANT_SUBDOMAIN_LOGIN=true
```

Reinicie o Next.js para aplicar a variável. No Chrome, `*.localhost` resolve para o computador local. Caso o navegador ou o sistema não resolva, configure os nomes no ambiente local.

Para produção, configure também no Next.js e na função Firebase:

```dotenv
AUTH_APP_ORIGIN=https://cardap.example.com
AUTH_TENANT_DOMAIN=example.com
```

A aplicação usa `https://{slug}.example.com`. Configure DNS wildcard e certificado TLS para esse domínio. A função deve receber os mesmos valores, por exemplo por `firebase/employee-access/.env.cardap-e0bf0`, sem adicionar esse arquivo ao Git. No Electron, use `CARDAP_TENANT_DOMAIN=example.com` quando o endereço configurado for um subdomínio central como `cardap.example.com`.

## Electron

A versão 0.2.2 permite navegar somente dentro da família de domínios configurada, com o mesmo protocolo e porta. Hosts externos, protocolos inesperados e subdomínios mais profundos são recusados. O processo nativo continua validando a sessão e o restaurante no Firebase antes de consumir a fila de impressão. Versões antigas mostram a necessidade de atualização antes de iniciar a transferência.

## Publicação e verificações

```sh
firebase deploy --only functions:employee-access:tenantLoginTransfer --project cardap-e0bf0 --non-interactive
node --test firebase/employee-access/login-transfer.test.cjs
npm --prefix desktop/printing test
npm run typecheck
```

Não foram criadas contas de teste em produção nem alterados os slugs dos restaurantes existentes.
