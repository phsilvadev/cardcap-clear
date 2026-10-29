import { previewFields } from "./settings-sections";

export default function HoursSettingsFields({
  values,
  onChange,
}: {
  values: Record<string, string | boolean>;
  onChange: (field: string, value: string) => void;
}) {
  const openingDay = String(values.openingDay ?? "");
  const closingDay = String(values.closingDay ?? "");
  const openingTime = String(values.openingTime ?? "");
  const closingTime = String(values.closingTime ?? "");
  const complete = openingDay && closingDay && openingTime && closingTime;
  const overnight = Boolean(complete && closingTime < openingTime);
  const groups = [
    {
      id: "days",
      title: "Dias de atendimento",
      description:
        "Escolha o primeiro e o último dia do período de funcionamento.",
      fields: previewFields.hours.filter((field) => field.type === "select"),
    },
    {
      id: "times",
      title: "Horário de atendimento",
      description:
        "Este horário será usado para todos os dias do período selecionado.",
      fields: previewFields.hours.filter((field) => field.type === "time"),
    },
  ];
  return (
    <div className="hours-settings-fields">
      {groups.map((group) => (
        <fieldset className="hours-settings-group" key={group.id}>
          <legend>{group.title}</legend>
          <p className="hours-field-hint">{group.description}</p>
          <div className="settings-fields-grid">
            {group.fields.map((field) => {
              const id = `settings-hours-${field.name}`;
              return (
                <label className="flow-field" htmlFor={id} key={field.name}>
                  {field.name === "openingDay"
                    ? "Primeiro dia"
                    : field.name === "closingDay"
                      ? "Último dia"
                      : field.name === "openingTime"
                        ? "Abertura"
                        : "Fechamento"}
                  {field.type === "select" ? (
                    <select
                      id={id}
                      required
                      value={String(values[field.name] ?? "")}
                      onChange={(event) =>
                        onChange(field.name, event.target.value)
                      }
                    >
                      <option value="">Selecione o dia</option>
                      {field.options?.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type="time"
                      required
                      value={String(values[field.name] ?? "")}
                      onChange={(event) =>
                        onChange(field.name, event.target.value)
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div
        className="hours-summary"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <div>
          <strong>Resumo do funcionamento</strong>
          <p>
            {complete
              ? openingTime === closingTime
                ? "Escolha horários diferentes para abertura e fechamento."
                : `${openingDay === closingDay ? openingDay : `${openingDay} a ${closingDay}`}, das ${openingTime} às ${closingTime}${overnight ? " do dia seguinte" : ""}.`
              : "Selecione os dias e os horários para visualizar o período de atendimento."}
          </p>
        </div>
      </div>
    </div>
  );
}
