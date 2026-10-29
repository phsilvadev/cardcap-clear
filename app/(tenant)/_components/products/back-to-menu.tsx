export default function BackToMenu() {
  return (
    <a className="menu-back" href="/dashboard/cardapio">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m12 19-7-7 7-7M5 12h14" />
      </svg>
      <span>Voltar ao cardápio</span>
    </a>
  );
}
