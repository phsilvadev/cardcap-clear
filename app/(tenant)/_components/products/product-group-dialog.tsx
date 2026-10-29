import Dialog from "@/app/(tenant)/_components/products/product-dialog";
import { OptionRow } from "@/app/(tenant)/_components/products/product-customization-fields";
import type { useProductCustomization } from "@/app/(tenant)/_hooks/use-product-customization";

const ProductGroupDialog = ({
  control,
}: {
  control: ReturnType<typeof useProductCustomization>;
}) => {
  const group = control.editingGroup;
  return (
    <Dialog
      id="product-group-dialog"
      title="Grupo de complementos"
      open={Boolean(group)}
      onClose={control.cancelGroup}
    >
      {group && (
        <form
          className="dashboard-product-form"
          onSubmit={(event) => {
            event.preventDefault();
            control.saveGroup();
          }}
        >
          <label>
            Nome do grupo
            <input
              required
              minLength={2}
              maxLength={60}
              value={group.name}
              onChange={(event) =>
                control.updateGroup(group.id, { name: event.target.value })
              }
              placeholder="Ex.: Adicionais"
            />
          </label>
          <div className="form-grid">
            <label>
              Mínimo de escolhas
              <input
                required
                type="number"
                min="0"
                max="20"
                step="1"
                value={group.min}
                onChange={(event) =>
                  control.updateGroup(group.id, { min: event.target.value })
                }
              />
            </label>
            <label>
              Máximo de escolhas
              <input
                required
                type="number"
                min="1"
                max="20"
                step="1"
                value={group.max}
                onChange={(event) =>
                  control.updateGroup(group.id, { max: event.target.value })
                }
              />
            </label>
          </div>
          <p>
            Mínimo zero torna o grupo opcional. Para exigir uma escolha, use
            mínimo 1.
          </p>
          <label className="product-check">
            <input
              type="checkbox"
              checked={group.repeat}
              onChange={(event) =>
                control.updateGroup(group.id, { repeat: event.target.checked })
              }
            />
            Permitir repetir a mesma opção
          </label>
          {group.options.map((option, optionIndex) => (
            <OptionRow
              key={option.id}
              name={option.name}
              price={option.price}
              label={`Opção ${optionIndex + 1}`}
              onName={(name) =>
                control.updateOption(group.id, option.id, { name })
              }
              onPrice={(price) =>
                control.updateOption(group.id, option.id, { price })
              }
              onRemove={() => control.removeOption(group.id, option.id)}
            />
          ))}
          <div className="product-option-actions">
            <button
              className="button secondary"
              type="button"
              disabled={
                group.options.length >= 10 || control.totalOptions >= 20
              }
              onClick={() => control.addOption(group.id)}
            >
              Adicionar opção
            </button>
          </div>
          {control.groupError && <p role="alert">{control.groupError}</p>}
          <div className="dialog-actions">
            <button
              className="button secondary"
              type="button"
              onClick={control.cancelGroup}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Salvar grupo
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default ProductGroupDialog;
