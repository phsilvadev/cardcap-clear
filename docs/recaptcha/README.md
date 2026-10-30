# Como configurar e ativar o reCAPTCHA no Cardap

Projeto Firebase: **cardap-e0bf0**. A integração do site já está preparada. Primeiro cadastre a chave; depois teste; por último ative a exigência. Nenhuma chave privada precisa ser enviada pelo chat.

## 1. Criar a chave no Google

1. Abra [reCAPTCHA no Google Cloud](https://console.cloud.google.com/security/recaptcha?project=cardap-e0bf0).
2. Confirme o projeto `cardap-e0bf0` no seletor superior. Se solicitado, habilite a API reCAPTCHA Enterprise.
3. Clique em **Criar chave** e use um nome como `Cardap Web`.
4. Escolha a plataforma **Web / Website** e a chave baseada em pontuação. Deixe o desafio por caixa de seleção desmarcado; esta integração usa verificação em segundo plano.
5. Cadastre seu domínio real de produção, sem protocolo, caminho ou porta. Configure também a cobertura dos subdomínios dos restaurantes conforme as opções do provedor. Mantenha a validação de domínios ligada.
6. Crie a chave e copie a **chave pública / site key**.

Não cadastre `localhost` na chave de produção. O desenvolvimento local usa o modo de depuração descrito no passo 4.

## 2. Registrar a chave no Firebase App Check

1. Abra [App Check do Firebase](https://console.firebase.google.com/project/cardap-e0bf0/appcheck).
2. Selecione o aplicativo **Web** correspondente ao `NEXT_PUBLIC_FIREBASE_APP_ID` do projeto. Não selecione os aplicativos móveis por engano.
3. Clique em **Registrar** (ou abra a configuração do provedor caso já esteja registrado).
4. Selecione **reCAPTCHA Enterprise** e informe a chave criada no passo 1.
5. Salve. Nesta etapa, mantenha a exigência dos serviços desativada para poder conferir as métricas.

## 3. Configurar o projeto web

No `.env.local`, preencha:

```dotenv
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_FIREBASE_APPCHECK_PROVIDER=enterprise
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=false
FIREBASE_APPCHECK_ENFORCE=false
```

A chave pública pode aparecer no navegador. Não coloque senhas, chaves de conta de serviço ou tokens de depuração nessas variáveis.

Reinicie o servidor de desenvolvimento com o comando que você já usa (`npm run dev`). Em uma hospedagem, configure as mesmas variáveis e faça um novo build: as variáveis `NEXT_PUBLIC_*` são incorporadas ao site durante a compilação. O servidor web usa Node.js 22 ou superior.

Se você já tiver uma chave **v3** registrada, use o provedor v3 também no Firebase e `NEXT_PUBLIC_FIREBASE_APPCHECK_PROVIDER=v3`. Não misture os dois tipos.

## 4. Testar no localhost

1. Com a chave já cadastrada, altere apenas no desenvolvimento local:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true
   ```

2. Reinicie o projeto e abra o site em `localhost`.
3. Abra o console do navegador. O SDK mostrará um **Firebase App Check debug token**.
4. Volte ao App Check, abra o menu do aplicativo web e selecione **Gerenciar tokens de depuração**.
5. Registre o token com um nome como `Meu computador de desenvolvimento`.
6. Recarregue a página e confira login, cadastro e restauração da sessão. Não é necessário cadastrar contas fictícias em produção para testar o visual.

O token de depuração é uma credencial de acesso: não publique, não envie pelo chat e não salve no repositório. A opção de depuração implementada só funciona em localhost e seus subdomínios. Em produção, mantenha a variável como `false`.

## 5. Ativar a validação da API de sessão do site

Depois dos testes, configure no servidor web:

```dotenv
FIREBASE_APPCHECK_ENFORCE=true
```

Reinicie ou publique a nova configuração. A API `/api/auth/session` passa a rejeitar requisições sem uma prova válida do aplicativo web correto. Confira se login, cadastro, sessão já existente, subdomínios e Cardap Impressão continuam funcionando.

Essa variável protege a API de sessão do site. **Ela não ativa sozinha a exigência no Firebase Authentication, Firestore, Storage ou Cloud Functions.**

## 6. Ativar a exigência nos serviços Firebase

Na aba **APIs / Serviços** do App Check, confira primeiro as métricas de requisições verificadas. A exigência de cada serviço é ativada nessa área quando o serviço oferece esse controle.

O mesmo projeto atende o site, o app do garçom, o app do entregador e o programa de impressão. Prepare e registre todos os consumidores de cada serviço antes de exigir App Check nele. Caso contrário, aplicativos ainda sem a prova podem perder acesso.

Para funções callable, a exigência é configurada no código com `enforceAppCheck: true` e exige nova publicação da função. Não ative isso indiscriminadamente: a fila nativa de impressão e as rotas de transferência de login também precisam ser adaptadas e testadas.

## 7. Proteger também o login e o cadastro diretamente no Firebase

Para impedir chamadas automatizadas diretamente à API de e-mail e senha, configure a proteção de reCAPTCHA Enterprise do **Firebase Authentication / Identity Platform**, além do App Check do site.

Consulte o [procedimento oficial de integração do Identity Platform](https://docs.cloud.google.com/identity-platform/docs/recaptcha-enterprise). Comece em modo de auditoria, acompanhe os resultados e só depois ative a exigência. Confira os requisitos e a cobrança exibidos pelo Google antes de habilitar esse produto. Os apps móveis também precisam ser compatíveis.

## Como saber se terminou

- A chave está registrada no aplicativo web correto no App Check.
- O ambiente tem a chave pública e o provedor correspondente.
- Login e cadastro funcionam nos domínios utilizados.
- As métricas mostram provas válidas.
- A API de sessão rejeita requisições sem prova quando a exigência está ativa.
- Os serviços Firebase foram habilitados individualmente, depois de testar os aplicativos que dependem deles.

O reCAPTCHA reduz abuso automatizado. O isolamento por restaurante e a autorização das operações continuam sendo validados pelo backend.

Detalhes da implementação: [recaptcha-app-check.md](../recaptcha-app-check.md).

Referência do provedor: [reCAPTCHA Enterprise com Firebase App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
