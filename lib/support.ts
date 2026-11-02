export function supportWhatsAppPhone() {
  const raw = process.env.CARDAP_SUPPORT_WHATSAPP || "5586995747604";
  const phone = raw.replace(/\D/g, "");
  return /^\d{10,15}$/.test(phone) ? phone : null;
}

export function printerRentalWhatsAppUrl(storeName: string) {
  const phone = supportWhatsAppPhone();
  if (!phone) return null;
  const message = `Olá! Tenho interesse no aluguel de uma impressora térmica para meu restaurante.\nRestaurante: ${storeName}\nGostaria de saber os valores e a disponibilidade.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
