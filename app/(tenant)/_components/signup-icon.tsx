export default function SignupIcon({
  name,
}: {
  name: "user" | "store" | "mail" | "lock" | "eye" | "info" | "arrow";
}) {
  const paths = {
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2Z" />
      </>
    ),
    store: (
      <>
        <path d="m3 9 3-6h12l3 6M3 9h18M5 9v12h14V9M9 21v-7h6v7M3 9v2a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m3 5 9 8 9-8" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 11v6M12 7v.1" />
      </>
    ),
    arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
