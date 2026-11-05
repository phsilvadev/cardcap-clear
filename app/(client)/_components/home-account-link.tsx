type Account = { name: string; href: string };

export default function HomeAccountLink({
  restaurant,
}: {
  restaurant?: Account;
}) {
  return (
    <a
      href={restaurant?.href ?? "/restaurantes/login"}
      className="flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 text-white"
      aria-label={
        restaurant ? `Acessar painel de ${restaurant.name}` : undefined
      }
    >
      {restaurant ? "Painel do restaurante" : "Área do restaurante"}
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
        <path d="M7 7h10v10M7 17 17 7" />
      </svg>
    </a>
  );
}
