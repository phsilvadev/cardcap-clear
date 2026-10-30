export default function IntegrationsSection() {
  return (
    <section
      className="whatsapp-integration"
      aria-labelledby="whatsapp-integration-title"
    >
      <div className="whatsapp-integration-header">
        <div className="whatsapp-integration-identity">
          <span className="whatsapp-integration-icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
              <path d="M8.5 8.5c0 3.5 3.5 7 7 7l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2-2 1Z" />
            </svg>
          </span>
          <div>
            <h3 id="whatsapp-integration-title">WhatsApp</h3>
            <p>API não oficial</p>
          </div>
        </div>
        <span className="team-badge">Não configurado</span>
      </div>
      <p className="whatsapp-integration-description">
        Conecte o WhatsApp do restaurante para integrar a comunicação com seus
        clientes.
      </p>
      <div className="whatsapp-integration-status">
        <span className="whatsapp-integration-status-dot" aria-hidden="true" />
        <div>
          <strong>Configuração da conexão pendente</strong>
          <p>
            A conexão e o pareamento serão disponibilizados após a configuração
            do provedor da API.
          </p>
        </div>
      </div>
    </section>
  );
}
