import Image from "next/image";

export default function BrandLogo() {
  return (
    <Image
      className="cardap-brand-logo"
      src="/branding/cardap-logo.png"
      alt="Cardap"
      width={2171}
      height={724}
      sizes="140px"
    />
  );
}
