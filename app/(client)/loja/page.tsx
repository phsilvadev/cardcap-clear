import type { Metadata } from "next";
import "@/app/(client)/_styles/listing.css";
import "@/app/(client)/_styles/store.css";
import "@/app/(client)/_styles/catalog.css";
import Content from "@/app/(client)/_components/loja";

export const metadata: Metadata = {
  title: "Detalhe da loja — Cardap",
  description: "Conheça a loja e explore os produtos disponíveis no Cardap.",
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
      slug={value("store")}
      preview={value("preview") === "1"}
      city={value("city").trim().slice(0, 100)}
      state={value("state").trim().toUpperCase()}
    />
  );
}
