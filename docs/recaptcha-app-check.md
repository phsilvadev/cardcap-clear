# reCAPTCHA e Firebase App Check

O servidor web requer Node.js 22 ou superior para o SDK oficial de validação.

A integração está preparada, mas **não está ativa enquanto a chave estiver vazia e a exigência estiver desativada**. Não foi habilitada nenhuma exigência global no projeto Firebase.

## O que o código faz

- Inicializa App Check antes de Authentication, Firestore, Storage e Functions no navegador. Aceita reCAPTCHA Enterprise (padrão) ou v3.
- Login e cadastro aguardam a prova de App Check antes de enviar as credenciais. Falhas na verificação interrompem a operação e apresentam uma mensagem de erro.
- O SDK Firebase inclui automaticamente App Check nas chamadas aos seus serviços. As operações autenticadas continuam exigindo autorização por restaurante.
- A API `/api/auth/session` recebe a prova em `X-Firebase-AppCheck`. Quando `FIREBASE_APPCHECK_ENFORCE=true`, exige validação criptográfica pelo Firebase Admin, com aplicativo correto e prazo de validade. Um campo `captcha=true` enviado pelo navegador não serve como prova.
- O token verificado é mantido em cookie HttpOnly, limitado ao prazo de validade, para encaminhamento nas verificações REST da sessão. Logout e redirecionamento de sessão inválida limpam esse cookie.
- A verificação do Admin usa as chaves públicas do App Check. Não requer baixar chave de conta de serviço nem conceder permissão para assinar tokens.

## Ativação do web app

1. No projeto `cardap-e0bf0`, crie uma chave Web baseada em pontuação no reCAPTCHA Enterprise. Cadastre o domínio de produção conforme as regras do provedor. Deixe a opção de desafio por checkbox desmarcada. Para subdomínios de restaurantes, configure a cobertura pelo domínio base segundo o provedor; não desative a validação de domínios.
2. Em Firebase → App Check, registre o aplicativo web com essa chave e o provedor correspondente. A chave pública fica em `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`; `NEXT_PUBLIC_FIREBASE_APPCHECK_PROVIDER` deve ser `enterprise` ou `v3`.
3. Reinicie o desenvolvimento; em hospedagem, faça novo build e publique as variáveis no ambiente do servidor. As variáveis `NEXT_PUBLIC_*` são incorporadas ao build.
4. Teste login, cadastro, restauração de sessão, subdomínios e Cardap Impressão. Consulte as métricas do App Check.
5. Após confirmar as provas válidas, configure `FIREBASE_APPCHECK_ENFORCE=true` no servidor web. Esse parâmetro exige a prova na API de sessão; não ativa sozinho a exigência nos serviços Firebase.
6. Configure a exigência de App Check nos serviços Firebase após preparar todos os aplicativos que usam cada serviço. Nas funções callable, a exigência depende de `enforceAppCheck: true` na configuração da função e de nova publicação. As funções existentes não foram alteradas globalmente nesta etapa.
7. Para impedir também cadastro e login automatizados diretamente na API de autenticação, configure a proteção de e-mail/senha do Firebase Authentication/Identity Platform com reCAPTCHA Enterprise, começando em auditoria e depois passando para exigência. A integração web não substitui essa configuração do backend. Avalie os requisitos e a cobrança do Identity Platform antes da ativação.

**Aplicativos existentes:** o projeto também atende garçom, entregador e impressão. A exigência de serviços compartilhados deve aguardar o suporte a App Check nesses consumidores, incluindo o acesso nativo à fila de impressão. Ativar globalmente sem essa preparação pode interromper o acesso desses aplicativos.

## Desenvolvimento local

Não cadastre `localhost` na chave que será utilizada em produção. Para testes locais, configure a chave e `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true`, exclusivamente em localhost. O SDK gera um token de depuração no console do navegador; registre-o em Firebase → App Check → Gerenciar tokens de depuração. Não publique nem envie esse token pelo chat e não o adicione ao repositório. A opção implementada é ignorada fora de localhost e seus subdomínios.

## Escopo

Os formulários reais de entrada e cadastro usam a prova. Formulários internos que escrevem no Firebase passam a enviar App Check pelo SDK; só rejeitarão chamadas sem prova depois da exigência correspondente no backend. Busca de região, filtros e simulações de checkout não criam registros reais e não recebem um desafio por interação. Captcha reduz abuso automatizado; as regras de autorização e limites dos serviços continuam necessários.

Referências oficiais:

- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/app-check/custom-resource-backend
- https://firebase.google.com/docs/app-check/cloud-functions
- https://docs.cloud.google.com/identity-platform/docs/recaptcha-enterprise
