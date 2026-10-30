export type StoreOperations = { salon: boolean; ownDelivery: boolean };
export const defaultOperations: StoreOperations = {
  salon: false,
  ownDelivery: false,
};
export function normalizeOperations(value: unknown): StoreOperations {
  const data = value as Partial<StoreOperations> | null | undefined;
  return {
    salon: data?.salon === true,
    ownDelivery: data?.ownDelivery === true,
  };
}
