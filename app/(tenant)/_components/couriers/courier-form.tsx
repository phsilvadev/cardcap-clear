import Dialog from "@/app/(tenant)/_components/products/product-dialog";
import {
  courierVehicles,
  type useCouriers,
} from "@/app/(tenant)/_hooks/use-couriers";
import type { CourierVehicle } from "@/lib/types";
export default function CourierForm({
  control,
}: {
  control: ReturnType<typeof useCouriers>;
}) {
  return (
    <Dialog
      id="courier-form"
      title={control.editingId ? "Editar entregador" : "Cadastrar entregador"}
      open={control.formOpen}
      onClose={control.closeForm}
    >
      {control.formOpen && (
        <form className="dashboard-product-form" onSubmit={control.submit}>
          <label>
            Nome do entregador
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={control.draft.name}
              onChange={(event) =>
                control.updateDraft({ name: event.target.value })
              }
              placeholder="Nome completo"
            />
          </label>
          <label>
            Telefone / WhatsApp
            <input
              required
              type="tel"
              maxLength={16}
              autoComplete="tel"
              value={control.draft.phone}
              onChange={(event) =>
                control.updateDraft({ phone: event.target.value })
              }
              placeholder="(11) 99999-9999"
            />
          </label>
          <label>
            Veículo
            <select
              value={control.draft.vehicle}
              onChange={(event) =>
                control.updateDraft({
                  vehicle: event.target.value as CourierVehicle,
                })
              }
            >
              {Object.entries(courierVehicles).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="product-check">
            <input
              type="checkbox"
              checked={control.draft.available}
              onChange={(event) =>
                control.updateDraft({ available: event.target.checked })
              }
            />
            Disponível para receber entregas
          </label>
          {control.formError && <p role="alert">{control.formError}</p>}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              onClick={control.closeForm}
            >
              Cancelar
            </button>
            <button type="submit" className="button primary">
              {control.editingId ? "Salvar alterações" : "Cadastrar entregador"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
