import { courierVehicles } from "@/lib/employees/couriers";
import type { CourierVehicle } from "@/lib/types";
import Dialog from "@/app/(tenant)/_components/products/product-dialog";
import type { useEmployees } from "@/app/(tenant)/_hooks/use-employees";
import { employeeRoles, type EmployeeRole } from "@/lib/employees/types";

export default function EmployeeDialogs({
  control,
}: {
  control: ReturnType<typeof useEmployees>;
}) {
  return (
    <>
      <Dialog
        id="employee-create"
        title="Adicionar funcionário"
        open={control.formOpen}
        onClose={control.closeForm}
        preventClose={Boolean(control.busy)}
      >
        {control.formOpen && (
          <form className="dashboard-product-form" onSubmit={control.submit}>
            <fieldset
              className="employee-form-fields"
              disabled={Boolean(control.busy)}
            >
              <label>
                Nome completo
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  value={control.draft.name}
                  onChange={(event) =>
                    control.updateDraft({ name: event.target.value })
                  }
                  autoComplete="name"
                  placeholder="Nome do funcionário"
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={control.draft.email}
                  onChange={(event) =>
                    control.updateDraft({ email: event.target.value })
                  }
                  autoComplete="email"
                  placeholder="nome@exemplo.com"
                />
              </label>
              <label>
                Cargo
                <select
                  required
                  value={control.draft.role}
                  onChange={(event) =>
                    control.updateDraft({
                      role: event.target.value as EmployeeRole,
                    })
                  }
                >
                  {Object.entries(employeeRoles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {control.draft.role === "courier" && (
                <>
                  <label>
                    Telefone / WhatsApp
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      maxLength={16}
                      placeholder="(11) 99999-9999"
                      value={control.draft.phone ?? ""}
                      onChange={(event) =>
                        control.updateDraft({ phone: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Veículo
                    <select
                      value={control.draft.vehicle ?? "motorcycle"}
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
                  <p className="employee-help">
                    O entregador aparecerá na equipe de entregas. Este cadastro
                    operacional não cria uma conta de acesso.
                  </p>
                </>
              )}
            </fieldset>
            <p className="employee-help">
              O cadastro usa o serviço de funcionários do Anow. A sessão do
              proprietário será mantida.
            </p>
            {control.error && <p role="alert">{control.error}</p>}
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={Boolean(control.busy)}
                onClick={control.closeForm}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={Boolean(control.busy)}
              >
                {control.busy ? "Cadastrando…" : "Adicionar funcionário"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
      <Dialog
        id="employee-remove"
        title="Remover funcionário?"
        open={Boolean(control.removing)}
        onClose={control.cancelRemove}
        preventClose={Boolean(control.busy)}
      >
        <p>
          O vínculo de {control.removing?.name} com esta loja será removido. A
          conta de autenticação não será excluída.
        </p>
        {control.error && <p role="alert">{control.error}</p>}
        <div className="dialog-actions">
          <button
            className="button secondary"
            disabled={Boolean(control.busy)}
            type="button"
            onClick={control.cancelRemove}
          >
            Cancelar
          </button>
          <button
            className="button danger"
            disabled={Boolean(control.busy)}
            type="button"
            onClick={control.confirmRemove}
          >
            {control.busy ? "Removendo…" : "Confirmar remoção"}
          </button>
        </div>
      </Dialog>
      <Dialog
        id="employee-credentials"
        title="Funcionário cadastrado"
        open={Boolean(control.credentials)}
        onClose={control.clearCredentials}
      >
        {control.credentials && (
          <div className="dashboard-product-form employee-credentials">
            <p className="employee-help">
              Credenciais temporárias de {control.credentials.name}. Guarde os
              dados antes de fechar esta janela.
            </p>
            <label>
              E-mail de acesso
              <input readOnly value={control.credentials.email} />
            </label>
            <label>
              Senha temporária
              <input
                type={control.showPassword ? "text" : "password"}
                readOnly
                autoComplete="off"
                value={control.credentials.password}
              />
            </label>
            <button
              className="text-button"
              type="button"
              aria-pressed={control.showPassword}
              onClick={control.togglePassword}
            >
              {control.showPassword ? "Ocultar senha" : "Mostrar senha"}
            </button>
            {control.error && <p role="alert">{control.error}</p>}
            <p role="status">
              {control.notice === "Credenciais copiadas." ? control.notice : ""}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={control.copyCredentials}
              >
                Copiar credenciais
              </button>
              <button
                type="button"
                className="button primary"
                onClick={control.clearCredentials}
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        id="employee-access-link"
        title="Compartilhar acesso"
        open={Boolean(control.accessLink)}
        onClose={control.closeAccessLink}
      >
        {control.accessLink && (
          <div className="dashboard-product-form employee-credentials">
            <p className="employee-help">
              Copie o link e envie diretamente para {control.accessLink.name}{" "}
              definir uma senha. Nenhum e-mail foi enviado.
            </p>
            <label>
              Link para definir a senha
              <input
                type="text"
                readOnly
                autoComplete="off"
                value={control.accessLink.link}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <p className="employee-help">
              O link é temporário e de uso único. Compartilhe somente com esse
              funcionário.
            </p>
            {control.error && <p role="alert">{control.error}</p>}
            <p role="status">
              {control.notice === "Link copiado." ? control.notice : ""}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={control.closeAccessLink}
              >
                Fechar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={control.copyAccessLink}
              >
                Copiar link
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
