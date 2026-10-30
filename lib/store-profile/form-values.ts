import {
  fields,
  validCnpj,
  type StoreProfileSection,
} from "@/firebase/employee-access/store-profile-schema.cjs";
export function storeSettingsValues(
  section: StoreProfileSection,
  data: Record<string, unknown>,
) {
  const values: Record<string, string | boolean> = {};
  for (const field of fields[section]) {
    const value = data[field];
    values[field] =
      typeof value === "boolean"
        ? value
        : typeof value === "string"
          ? value
          : "";
  }
  if (section === "delivery") {
    values.acceptsDelivery = data.acceptsDelivery === true;
    values.acceptsPickup = data.acceptsPickup === true;
    values.deliveryFee = Number.isInteger(data.deliveryFeeCents)
      ? (Number(data.deliveryFeeCents) / 100).toFixed(2)
      : "";
  }
  if (section === "company" && typeof data.hasCnpj !== "boolean")
    values.hasCnpj = validCnpj(data.cnpj) ? true : "";
  return values;
}
