const modalities = [
  {
    name: "acceptsDelivery",
    title: "Entrega",
    description: "Leve os pedidos até o endereço do cliente.",
  },
  {
    name: "acceptsPickup",
    title: "Retirada na loja",
    description: "O cliente busca o pedido no restaurante.",
  },
] as const;

export default function DeliverySettingsFields({
  values,
  onChange,
}: {
  values: Record<string, string | boolean>;
  onChange: (field: string, value: string | boolean) => void;
}) {
  return (
    <div className="delivery-settings-fields">
      <fieldset className="delivery-modalities">
        <legend>Como você atende seus clientes?</legend>
        <p className="delivery-field-hint">
          Você pode oferecer uma ou as duas modalidades.
        </p>
        <div className="delivery-modality-grid">
          {modalities.map((item) => (
            <label
              key={item.name}
              className="delivery-modality"
              data-selected={values[item.name] === true}
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
                {item.name === "acceptsDelivery" ? (
                  <>
                    <path d="M1 3h14v13H1zM15 8h4l3 4v4h-7M4 16h8" />
                    <circle cx="5" cy="18" r="2" />
                    <circle cx="18" cy="18" r="2" />
                  </>
                ) : (
                  <>
                    <path d="M5 7h14l1 14H4L5 7ZM9 7V5a3 3 0 0 1 6 0v2" />
                  </>
                )}
              </svg>
              <span className="delivery-modality-copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <input
                type="checkbox"
                checked={values[item.name] === true}
                onChange={(event) => onChange(item.name, event.target.checked)}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="delivery-pricing">
        <legend>Prazo e taxa de entrega</legend>
        <p className="delivery-field-hint">
          Defina as informações que serão apresentadas ao cliente.
        </p>
        <div className="settings-fields-grid">
          <label
            className="flow-field"
            htmlFor="settings-delivery-deliveryTime"
          >
            Tempo estimado
            <input
              id="settings-delivery-deliveryTime"
              maxLength={30}
              placeholder="Ex.: 30–45 min"
              value={String(values.deliveryTime ?? "")}
              onChange={(event) => onChange("deliveryTime", event.target.value)}
            />
            <small>Informe o intervalo previsto para a entrega.</small>
          </label>
          <label className="flow-field" htmlFor="settings-delivery-deliveryFee">
            Taxa de entrega (R$)
            <input
              id="settings-delivery-deliveryFee"
              type="number"
              min={0}
              max={999}
              step="0.01"
              placeholder="0,00"
              value={String(values.deliveryFee ?? "")}
              onChange={(event) => onChange("deliveryFee", event.target.value)}
            />
            <small>Use R$ 0,00 para oferecer entrega grátis.</small>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
