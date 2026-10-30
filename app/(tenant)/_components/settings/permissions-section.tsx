export default function PermissionsSection() {
  return (
    <div className="settings-info-card">
      <h3>Permissões do salão</h3>
      <p>
        O proprietário libera o acesso ao caixa para atendentes e gerentes.
        Registrar pagamentos e aplicar descontos são permissões separadas.
        Garçons solicitam a conta e confirmam a limpeza da mesa, sem registrar
        pagamentos.
      </p>
      <a className="button" href="/dashboard/salao">
        Gerenciar no salão
      </a>
      <p>
        Os funcionários autorizados acessam{" "}
        <a href="/equipe/salao">/equipe/salao</a> com o próprio e-mail e senha.
      </p>
    </div>
  );
}
