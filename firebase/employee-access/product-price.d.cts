import type { MenuProductInput } from "../../lib/menu/types";
import type { SelectionItem, PricedLine } from "../../lib/checkout/types";
export function priceLine(
  product: MenuProductInput,
  input: SelectionItem,
  fail: (code: string, message: string) => never,
): PricedLine;
