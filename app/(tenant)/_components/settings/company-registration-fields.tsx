export default function CompanyRegistrationFields({
  values,
  onChange,
}: {
  values: Record<string, string | boolean>;
  onChange: (field: string, value: string | boolean) => void;
}) {
  return (
    <fieldset className="delivery-modalities company-registration">
      <legend>Seu restaurante tem CNPJ?</legend>
      <p className="delivery-field-hint">
        Escolha a opção que representa o cadastro da sua loja.
      </p>
      <div className="delivery-modality-grid">
        {[
          {
            value: true,
            title: "Tenho CNPJ",
            description: "Quero informar os dados da minha empresa.",
          },
          {
            value: false,
            title: "Ainda não tenho CNPJ",
            description: "Vou informar esse dado em outro momento.",
          },
        ].map((option) => (
          <label
            className="delivery-modality"
            data-selected={values.hasCnpj === option.value}
            key={String(option.value)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {option.value ? (
                <>
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-6h4v6" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </>
              )}
            </svg>
            <span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
            <input
              type="radio"
              name="company-has-cnpj"
              required
              checked={values.hasCnpj === option.value}
              onChange={() => onChange("hasCnpj", option.value)}
            />
          </label>
        ))}
      </div>
      {values.hasCnpj === false && (
        <p className="company-registration-note">
          Sua escolha ficará salva. A plataforma poderá solicitar o CNPJ
          futuramente e avisará quando for necessário complementar o cadastro.
        </p>
      )}
    </fieldset>
  );
}
