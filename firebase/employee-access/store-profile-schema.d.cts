export type StoreProfileSection =
  "details" | "company" | "address" | "hours" | "delivery" | "wallet";
export const fields: Record<StoreProfileSection, string[]>;
export function normalizeSection(
  section: StoreProfileSection,
  input: Record<string, unknown>,
): { values: Record<string, unknown>; issues: string[] };
export function sectionIssues(
  section: StoreProfileSection,
  data: Record<string, unknown>,
): string[];
export function profileComplete(data: Record<string, unknown>): boolean;
export function validCnpj(value: unknown): boolean;
