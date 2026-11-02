import Image from "next/image";
import "@/app/(tenant)/_styles/printer-rental.css";

export default function PrinterRental({
  contactUrl,
}: {
  contactUrl: string | null;
}) {
  return (
    <section className="printer-rental" aria-labelledby="printer-rental-title">
      <div className="printer-rental-art" aria-hidden="true">
        <Image
          src="/images/printer-rental.jpg"
          alt=""
          width={1280}
          height={1202}
          sizes="180px"
          className="printer-rental-photo"
        />
      </div>
      <div className="printer-rental-copy">
        <div className="printer-rental-heading">
          <span className="printer-rental-eyebrow">
            Equipamentos para sua loja
          </span>
          <span className="printer-rental-badge">Em breve</span>
        </div>
        <h2 id="printer-rental-title">Sua impressora, por aluguel.</h2>
        <p>
          Imprima as comandas do restaurante com uma impressora térmica alugada
          e o Cardap Impressão.
        </p>
        <ul className="printer-rental-benefits">
          <li>
            <span aria-hidden="true">✓</span> Impressão térmica
          </li>
          <li>
            <span aria-hidden="true">✓</span> Conectada ao computador
          </li>
        </ul>
        <details className="printer-rental-details">
          <summary>Ver condições do aluguel</summary>
          <p>
            Oferta em preparação, sujeita à disponibilidade. Valores, cobertura,
            instalação, manutenção e bobinas serão informados na proposta.
            Requer computador compatível com o Cardap Impressão. Foto de
            referência; modelo sujeito à disponibilidade.
          </p>
        </details>
      </div>
      <div className="printer-rental-actions">
        <span className="printer-rental-price">Condições sob consulta</span>
        {contactUrl ? (
          <a
            className="printer-rental-cta"
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tenho interesse <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="printer-rental-unavailable">
            Contato temporariamente indisponível.
          </span>
        )}
        <p>
          Converse pelo WhatsApp
          <br />e consulte a disponibilidade.
        </p>
      </div>
    </section>
  );
}
