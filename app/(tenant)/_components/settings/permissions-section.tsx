export default function PermissionsSection() {
  return (
    <div className="settings-info-card">
      <h3>Perfis de acesso</h3>
      <p>
        Os perfis abaixo seguem a organização do Anow. Esta seção é informativa
        e não altera as permissões da loja.
      </p>
      <dl className="settings-permissions-list">
        <div>
          <dt>Proprietário</dt>
          <dd>Acesso autenticado à própria loja. Disponível neste painel.</dd>
        </div>
        <div>
          <dt>Gerente</dt>
          <dd>
            Perfil de equipe do Anow. Acesso ainda não integrado neste painel.
          </dd>
        </div>
        <div>
          <dt>Atendente</dt>
          <dd>
            Perfil de equipe do Anow. Acesso ainda não integrado neste painel.
          </dd>
        </div>
      </dl>
    </div>
  );
}
