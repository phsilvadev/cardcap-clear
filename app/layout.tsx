import type { ReactNode } from "react";
import localFont from "next/font/local";
import "@/app/globals.css";
const outfit = localFont({
  src: "./fonts/Outfit.ttf",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});
const libre = localFont({
  src: "./fonts/LibreBaskerville-Italic.ttf",
  variable: "--font-libre",
  weight: "400 700",
  style: "italic",
  display: "swap",
  preload: false,
});
const fredoka = localFont({
  src: "./fonts/Fredoka.ttf",
  variable: "--font-fredoka",
  weight: "300 700",
  display: "swap",
  preload: false,
});
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${libre.variable} ${fredoka.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
