# Página de pré-lançamento

A página pública `/em-breve` apresenta a plataforma em construção e convida restaurantes a receber novidades. É uma lista de interesse, sem criar uma conta ou garantir acesso imediato. A página inicial existente continua disponível.

O formulário chama `publicJoinWaitlist`. O backend valida o e-mail e o consentimento e salva em `launchWaitlist`, com um ID derivado do e-mail normalizado. Reenvios não criam duplicatas nem alteram uma inscrição existente. O resultado público não revela se o e-mail já estava cadastrado. Há limite de cinco tentativas por IP a cada 15 minutos, App Check em produção e uma armadilha para robôs.

A coleção de inscritos e os controles de limite são privados: as regras existentes negam leitura e escrita direta de clientes. A Function usa o Admin SDK. Não habilite acesso público à coleção. O consentimento registra a versão `launch-news-v1`, apresentada na tela, e o horário do servidor.

## Publicação

Configure as variáveis públicas de Firebase e a chave de App Check/reCAPTCHA já usadas pelo projeto, registre o domínio de publicação e publique:

```sh
firebase deploy --only functions:publicJoinWaitlist,firestore:indexes --project cardap-e0bf0
```

A configuração de índices inclui TTL em `waitlistRateLimits.expiresAt` para limpar os contadores antigos. Publique também o aplicativo web pelo fluxo de hospedagem usado pelo projeto e divulgue a URL `/em-breve`.

As inscrições ficam salvas no Firestore. Esta implementação não envia campanhas nem uma mensagem automática de confirmação por e-mail. O envio de novidades exige integrar um serviço de e-mail e oferecer descadastramento antes de iniciar as campanhas.

## Verificações

```sh
node --test firebase/employee-access/waitlist.test.cjs
npx playwright test tests/launch.spec.ts
```

Os testes de interface usam transporte Firebase interceptado; os testes de backend exercitam o handler com armazenamento transacional em memória. Nenhuma inscrição real é criada durante esses testes.

## Manter somente a página de pré-lançamento acessível

O modo de pré-lançamento fica **ativo por padrão**, inclusive sem variável de ambiente. O Proxy aplica o bloqueio no servidor antes de validar sessões ou renderizar as páginas:

- `/em-breve` e as duas imagens usadas pela página ficam acessíveis.
- Os recursos internos do Next.js necessários para carregar CSS, fontes, JavaScript e imagens continuam funcionando.
- Qualquer outra página redireciona temporariamente para `/em-breve`, incluindo `/`, login, cadastro, lojas, checkout, painel e caminhos de tenants. Uma sessão existente não contorna o bloqueio.
- As APIs internas e requisições de escrita recebem HTTP 503, sem executar suas ações.
- O redirecionamento não é permanente nem armazenado em cache.

Para liberar o restante do site depois, configure no ambiente do servidor:

```dotenv
CARDAP_PRELAUNCH_ONLY=false
```

Reinicie/republique a aplicação após alterar a variável. Para voltar a bloquear, use `true` ou remova a variável. A suíte geral de testes define `false` para verificar o sistema completo; `tests/prelaunch.spec.ts` valida o modo restrito separadamente.

Este bloqueio se aplica ao site Next.js, não aos endereços independentes das Firebase Functions, Firestore, Storage ou aplicativos instalados. A Function `publicJoinWaitlist` continua disponível no Firebase para receber inscrições. As permissões e validações dos demais serviços permanecem em vigor.
