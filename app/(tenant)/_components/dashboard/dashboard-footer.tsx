import BrandLogo from "@/components/brand-logo";
export default function DashboardFooter() {
  return (
    <footer className={"dashboard-footer"}>
      <span className={"wordmark"}>
        <BrandLogo />
      </span>
      <p>{"Área do restaurante · Prévia de gestão"}</p>
    </footer>
  );
}
