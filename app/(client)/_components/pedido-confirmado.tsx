import Commerce from "./commerce";
export default function Content({ storeSlug }: { storeSlug: string }) {
  return <Commerce step="pedido-confirmado" storeSlug={storeSlug} />;
}
