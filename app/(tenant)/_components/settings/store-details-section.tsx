import StoreLogoEditor from "./store-logo-editor";
import StoreSettingsForm from "./store-settings-form";
export default function StoreDetailsSection({ storeId }: { storeId?: string }) {
  return (
    <section className="panel settings-panel">
      <h2>Dados do restaurante</h2>
      <StoreLogoEditor storeId={storeId} />
      <StoreSettingsForm section="details" />
    </section>
  );
}
