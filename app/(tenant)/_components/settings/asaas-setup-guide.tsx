import AsaasVideoTutorial from "./asaas-video-tutorial";

const steps = [
  {
    title: "Crie sua conta no Asaas",
    text: "Acesse o site oficial, escolha Criar conta grátis e informe seu e-mail e uma senha. Depois, siga as etapas do cadastro com os dados do responsável e do negócio.",
  },
  {
    title: "Complete o cadastro e envie os documentos",
    text: "No painel do Asaas, abra o menu do usuário e acesse Minha conta → Documentos. Envie o que for solicitado e acompanhe a análise pela própria plataforma.",
  },
  {
    title: "Obtenha o Wallet ID da sua conta",
    text: "O Wallet ID é o identificador da sua carteira Asaas. Consulte esse identificador no painel da sua conta. Se não encontrar, peça orientação ao suporte do Asaas pela Central de Ajuda.",
  },
  {
    title: "Informe o identificador aqui no Cardap",
    text: "Copie o Wallet ID da conta do seu restaurante e cole no campo abaixo. Confira se o identificador pertence à conta que deverá receber os pagamentos.",
  },
];

export default function AsaasSetupGuide() {
  return (
    <section className="asaas-setup-guide" aria-labelledby="asaas-guide-title">
      <div className="asaas-guide-heading">
        <span className="asaas-guide-eyebrow">Primeiros passos</span>
        <h3 id="asaas-guide-title">Como preparar sua conta Asaas</h3>
        <p>
          Ainda não tem uma conta? Siga estas etapas antes de preencher os dados
          de recebimento.
        </p>
      </div>
      <div className="asaas-guide-actions">
        <AsaasVideoTutorial />
        <a
          className="flow-button"
          href="https://www.asaas.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Criar minha conta Asaas <span aria-hidden="true">↗</span>
        </a>
        <a
          href="https://central.ajuda.asaas.com/hc/pt-br/articles/31406336360987-Como-criar-minha-conta-no-Asaas"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver o guia oficial <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ol className="asaas-guide-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="asaas-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="asaas-guide-help">
        <p>
          Já tem uma conta? Confira seu cadastro e siga a partir da etapa 3.
          Este formulário pede apenas o Wallet ID; não informe sua senha nem sua
          chave de API.
        </p>
        <a
          href="https://central.ajuda.asaas.com/hc/pt-br"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preciso de ajuda com minha conta Asaas{" "}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
