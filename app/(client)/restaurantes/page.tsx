import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import "@/app/(client)/_styles/catalog.css";
import Content from "@/app/(client)/_components/restaurantes";

export const metadata: Metadata = {
  title: "Restaurantes da sua região — Cardap",
  description: "Encontre restaurantes da sua região e conheça seus cardápios.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (name: string) =>
    typeof params[name] === "string" ? (params[name] as string) : "";
  return (
    <Content
      city={value("city").trim().slice(0, 100)}
      state={value("state").trim().toUpperCase()}
    />
  );
}
