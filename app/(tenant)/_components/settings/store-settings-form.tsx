"use client";
import { useStoreSettingsForm } from "@/app/(tenant)/_hooks/use-store-settings-form";
import type { StoreProfileSection } from "@/firebase/employee-access/store-profile-schema.cjs";
import { previewFields } from "./settings-sections";
import HoursSettingsFields from "./hours-settings-fields";
import DeliverySettingsFields from "./delivery-settings-fields";
import AsaasSetupGuide from "./asaas-setup-guide";
import CompanyRegistrationFields from "./company-registration-fields";
import SuccessAlert from "../feedback/success-alert";
const detailsFields = [
  { name: "name", label: "Nome da loja", maxLength: 80, required: true },
  { name: "description", label: "Descrição", maxLength: 300, required: true },
  {
    name: "category",
    label: "Categoria do restaurante",
    type: "select",
    required: true,
    options: [
      "restaurante",
      "lanchonete",
      "pizzaria",
      "cafeteria",
      "padaria",
      "doceria",
      "mercado",
      "outros",
    ],
  },
] as const;
export default function StoreSettingsForm({
  section,
}: {
  section: StoreProfileSection;
}) {
  const form = useStoreSettingsForm(section);
  const definitions =
    section === "details" ? detailsFields : previewFields[section];
  return (
    <form
      className="store-settings-form"
      data-section={section}
      onSubmit={(event) => {
        void form.submit(event);
      }}
    >
      {form.loading && (
        <p role="status" className="settings-section-note">
          Carregando dados da loja…
        </p>
      )}
      <fieldset
        className="store-settings-fields"
        disabled={form.loading || form.saving || !form.canEdit}
      >
        {section === "wallet" && (
          <>
            <AsaasSetupGuide />
            <p className="settings-section-note">
              O Wallet ID informado será salvo no cadastro da loja. A
              verificação da conta e dos recebimentos é feita pelo Asaas.
            </p>
          </>
        )}
        {section === "company" && (
          <CompanyRegistrationFields
            values={form.values}
            onChange={form.change}
          />
        )}
        {section === "delivery" ? (
          <DeliverySettingsFields values={form.values} onChange={form.change} />
        ) : section === "hours" ? (
          <HoursSettingsFields values={form.values} onChange={form.change} />
        ) : (
          <div className="settings-fields-grid">
            {definitions
              .filter(
                (field) =>
                  !(
                    section === "company" &&
                    ["cnpj", "legalName"].includes(field.name) &&
                    form.values.hasCnpj !== true
                  ),
              )
              .map((field) => {
                const id = `settings-${section}-${field.name}`;
                const type = "type" in field ? field.type : "text";
                const required =
                  field.required ||
                  (section === "company" &&
                    form.values.hasCnpj === true &&
                    ["cnpj", "legalName"].includes(field.name));
                return (
                  <label
                    key={field.name}
                    htmlFor={id}
                    className={`flow-field${field.name === "description" ? " store-settings-wide" : ""}`}
                  >
                    {field.label}
                    {type === "select" ? (
                      <select
                        id={id}
                        required={required}
                        value={String(form.values[field.name] ?? "")}
                        onChange={(event) =>
                          form.change(field.name, event.target.value)
                        }
                      >
                        <option value="">Selecione</option>
                        {("options" in field ? field.options : [])?.map(
                          (option) => (
                            <option key={option} value={option}>
                              {option.charAt(0).toLocaleUpperCase("pt-BR") +
                                option.slice(1)}
                            </option>
                          ),
                        )}
                      </select>
                    ) : field.name === "description" ? (
                      <textarea
                        id={id}
                        required
                        maxLength={300}
                        minLength={20}
                        value={String(form.values[field.name] ?? "")}
                        onChange={(event) =>
                          form.change(field.name, event.target.value)
                        }
                      />
                    ) : (
                      <input
                        id={id}
                        type={
                          type === "email"
                            ? "email"
                            : type === "tel"
                              ? "tel"
                              : "text"
                        }
                        required={required}
                        maxLength={
                          "maxLength" in field ? field.maxLength : undefined
                        }
                        placeholder={
                          "placeholder" in field ? field.placeholder : undefined
                        }
                        value={String(form.values[field.name] ?? "")}
                        onChange={(event) =>
                          form.change(field.name, event.target.value)
                        }
                      />
                    )}
                  </label>
                );
              })}
          </div>
        )}
        <div className="settings-save-row">
          <button type="submit" className="button primary">
            {form.saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </fieldset>
      {form.walletLocked && (
        <p className="settings-section-note">
          Para alterar a carteira de uma loja ativa, entre em contato com o
          suporte.
        </p>
      )}
      {form.error && (
        <p className="flow-status" role="alert">
          {form.error}
        </p>
      )}
      <SuccessAlert
        open={form.success}
        title="Dados salvos!"
        description="As informações desta seção foram atualizadas no cadastro da loja."
        onClose={form.closeSuccess}
      />
    </form>
  );
}
