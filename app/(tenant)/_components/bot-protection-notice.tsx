export default function BotProtectionNotice({
  className = "",
}: {
  className?: string;
}) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY?.trim()) return null;
  return (
    <p className={`restaurant-login-note ${className}`}>
      Validação de segurança pelo Google reCAPTCHA. Aplicam-se a{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "underline" }}
      >
        Política de Privacidade
      </a>{" "}
      e os{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "underline" }}
      >
        Termos de Serviço
      </a>{" "}
      do Google.
    </p>
  );
}
