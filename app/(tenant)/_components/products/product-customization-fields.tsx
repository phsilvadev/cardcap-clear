import type { useProductCustomization } from "@/app/(tenant)/_hooks/use-product-customization";

type Control = ReturnType<typeof useProductCustomization>;
type OptionRowProps = {
  name: string;
  price: string;
  label: string;
  showPrice?: boolean;
  minPrice?: string;
  onName: (value: string) => void;
  onPrice: (value: string) => void;
  onRemove: () => void;
};

export const OptionRow = ({
  name,
  price,
  label,
  showPrice = true,
  minPrice = "0",
  onName,
  onPrice,
  onRemove,
}: OptionRowProps) => (
  <div className="product-option-row">
    <div className="form-grid">
      <label>
        {label}
        <input
          required
          minLength={2}
          maxLength={60}
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="Nome livre"
        />
      </label>
      {showPrice && (
        <label>
          Preço (R$)
          <input
            required
            type="number"
            min={minPrice}
            max="999999.99"
            step="0.01"
            value={price}
            onChange={(event) => onPrice(event.target.value)}
          />
        </label>
      )}
    </div>
    <button
      type="button"
      className="text-button"
      onClick={onRemove}
      aria-label={`Remover ${name || label}`}
    >
      Remover opção
    </button>
  </div>
);

const ProductCustomizationFields = ({ control }: { control: Control }) => (
  <>
    <section
      className="product-form-section"
      aria-labelledby="product-complements-title"
    >
      <h3 id="product-complements-title">Complementos e escolhas</h3>
      <p>
        Crie grupos livres, como tamanhos, molhos, bordas ou acompanhamentos. Os
        valores são acréscimos ao preço do produto.
      </p>
      {control.groups.map((group, index) => (
        <div className="product-option-group" key={group.id}>
          <h3>{group.name || `Grupo ${index + 1}`}</h3>
          <p>
            {group.options.length} opções · Mínimo {group.min} · Máximo{" "}
            {group.max}
            {group.repeat ? " · Permite repetição" : ""}
          </p>
          <div className="product-option-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => control.editGroup(group.id)}
            >
              Editar grupo
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => control.removeGroup(group.id)}
            >
              Remover grupo
            </button>
          </div>
        </div>
      ))}
      <button
        className="button secondary"
        type="button"
        disabled={control.groups.length >= 5 || control.totalOptions >= 20}
        onClick={control.addGroup}
      >
        Adicionar grupo
      </button>
      <p>
        Até 5 grupos, com até 10 opções por grupo. Use R$ 0,00 para opções sem
        acréscimo.
      </p>
    </section>
    <section
      className="product-form-section"
      aria-labelledby="product-division-title"
    >
      <h3 id="product-division-title">Divisão em partes</h3>
      <label className="product-check">
        <input
          type="checkbox"
          checked={control.divisible}
          onChange={(event) => control.toggleDivision(event.target.checked)}
        />
        Permitir metade de uma opção e metade de outra, ou mais partes
      </label>
      {control.divisible && (
        <>
          <label>
            Máximo de partes
            <input
              required
              type="number"
              min="2"
              max="8"
              step="1"
              value={control.maxParts}
              onChange={(event) => control.setMaxParts(event.target.value)}
            />
          </label>
          <label>
            Como cobrar
            <select
              value={control.pricing}
              onChange={(event) =>
                control.setPricing(event.target.value as Control["pricing"])
              }
            >
              <option value="highest">Preço da opção mais cara</option>
              <option value="proportional">
                Proporcional às partes escolhidas
              </option>
              <option value="fixed">Preço base fixo do produto</option>
            </select>
          </label>
          <p>
            As partes têm tamanhos iguais. Uma opção pode ocupar mais de uma
            parte: por exemplo, 3 de 4 partes de um sabor e 1 de outro.
          </p>
          <p>
            {control.pricing === "fixed"
              ? "A combinação mantém o preço base. Complementos são cobrados à parte."
              : "Informe o preço do produto inteiro para cada opção. Com duas metades de R$ 40 e R$ 50, a cobrança será de " +
                (control.pricing === "highest" ? "R$ 50." : "R$ 45.")}
          </p>
          {control.parts.map((part, index) => (
            <OptionRow
              key={part.id}
              name={part.name}
              price={part.price}
              label={`Opção de divisão ${index + 1}`}
              minPrice="0.01"
              showPrice={control.pricing !== "fixed"}
              onName={(name) => control.updatePart(part.id, { name })}
              onPrice={(price) => control.updatePart(part.id, { price })}
              onRemove={() => control.removePart(part.id)}
            />
          ))}
          <button
            className="button secondary"
            type="button"
            disabled={control.parts.length >= 10 || control.totalOptions >= 20}
            onClick={control.addPart}
          >
            Adicionar opção de divisão
          </button>
          <p>
            Cadastre de 2 a 10 opções que podem ser combinadas neste produto.
          </p>
        </>
      )}
    </section>
    <p className="product-form-hint">
      {control.totalOptions}/20 opções cadastradas, somando complementos e
      divisão.
    </p>
  </>
);

export default ProductCustomizationFields;
