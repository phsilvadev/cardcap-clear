"use client";
import { useEffect, useState, type FormEvent } from "react";
import HoursSettingsFields from "./hours-settings-fields";
import AsaasSetupGuide from "./asaas-setup-guide";
import DeliverySettingsFields from "./delivery-settings-fields";
import { previewFields, type PreviewSectionId } from "./settings-sections";

export default function SettingsPreviewForm({
  section,
  tenantSlug,
}: {
  section: PreviewSectionId;
  tenantSlug: string;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [message, setMessage] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const key = `cardap-demo-settings:${tenantSlug}:${section}`;
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        const safe = Object.fromEntries(
          previewFields[section].map((field) => {
            const value = (saved as Record<string, unknown>)[field.name];
            return [
              field.name,
              field.type === "checkbox"
                ? value === true
                : typeof value === "string"
                  ? value.slice(0, field.maxLength ?? 254)
                  : "",
            ];
          }),
        );
        setValues(safe);
      }
    } catch {
      setMessage("Não foi possível carregar a prévia salva neste navegador.");
    }
    setStorageReady(true);
  }, [key, section]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (section === "hours" && values.openingTime === values.closingTime) {
      setMessage("Os horários de abertura e fechamento devem ser diferentes.");
      return;
    }
    if (
      section === "delivery" &&
      !values.acceptsDelivery &&
      !values.acceptsPickup
    ) {
      setMessage("Selecione entrega ou retirada para continuar.");
      return;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(values));
      setMessage(
        "Prévia salva nesta sessão do navegador. Os dados da loja no Firebase não foram alterados.",
      );
    } catch {
      setMessage("Não foi possível salvar a prévia neste navegador.");
    }
  }
  if (!storageReady) return <p role="status">Carregando seção…</p>;
  return (
    <form
      className="settings-preview-form"
      data-section={section}
      onSubmit={submit}
    >
      {section === "wallet" && <AsaasSetupGuide />}
      {section === "wallet" && (
        <p className="settings-section-note">
          O Wallet ID identifica a carteira que receberá os pagamentos. Salvar
          esta prévia não altera a carteira real nem libera o cadastro de
          produtos.
        </p>
      )}
      {section === "delivery" ? (
        <DeliverySettingsFields
          values={values}
          onChange={(field, value) => {
            setMessage("");
            setValues((current) => ({ ...current, [field]: value }));
          }}
        />
      ) : section === "hours" ? (
        <HoursSettingsFields
          values={values}
          onChange={(field, value) => {
            setMessage("");
            setValues((current) => ({ ...current, [field]: value }));
          }}
        />
      ) : (
        <div className="settings-fields-grid">
          {previewFields[section].map((field) => {
            const id = `settings-${section}-${field.name}`;
            return (
              <label
                key={field.name}
                htmlFor={id}
                className={
                  field.type === "checkbox" ? "settings-check" : "flow-field"
                }
              >
                {field.type === "checkbox" ? (
                  <>
                    <input
                      id={id}
                      type="checkbox"
                      checked={values[field.name] === true}
                      onChange={(event) => {
                        setMessage("");
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.checked,
                        }));
                      }}
                    />
                    {field.label}
                  </>
                ) : (
                  <>
                    {field.label}
                    {field.type === "select" ? (
                      <select
                        id={id}
                        required={field.required}
                        value={String(values[field.name] ?? "")}
                        onChange={(event) => {
                          setMessage("");
                          setValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }));
                        }}
                      >
                        <option value="">Selecione</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type={field.type ?? "text"}
                        required={field.required}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={String(values[field.name] ?? "")}
                        onChange={(event) => {
                          setMessage("");
                          setValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }));
                        }}
                      />
                    )}
                  </>
                )}
              </label>
            );
          })}
        </div>
      )}
      <div className="settings-save-row">
        <button type="submit" className="flow-button">
          Salvar prévia desta seção
        </button>
      </div>
      <p className="flow-status" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
