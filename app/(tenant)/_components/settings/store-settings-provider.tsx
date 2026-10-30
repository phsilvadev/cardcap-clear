"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseFunctions,
} from "@/lib/firebase/client";
import type { StoreProfileSection } from "@/firebase/employee-access/store-profile-schema.cjs";
type Profile = Record<string, unknown>;
type Context = {
  data: Profile | null;
  loading: boolean;
  error: string;
  setReceivingOrders: (receivingOrders: boolean) => Promise<void>;
  save: (
    section: StoreProfileSection,
    values: Record<string, unknown>,
  ) => Promise<void>;
};
const Context = createContext<Context>({
  data: null,
  loading: true,
  error: "",
  setReceivingOrders: async () => {
    throw new Error("Entre com a conta do proprietário.");
  },
  save: async () => {
    throw new Error("Entre com a conta do proprietário.");
  },
});
export const useStoreSettings = () => useContext(Context);
export default function StoreSettingsProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let stop = () => {};
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      stop();
      setData(null);
      setLoading(true);
      if (user?.uid !== storeId) {
        setError("Entre com a conta do proprietário para configurar a loja.");
        setLoading(false);
        return;
      }
      stop = onSnapshot(
        doc(getFirebaseDb(), "tenants", storeId),
        (snapshot) => {
          const next = snapshot.data();
          if (!next || next.ownerUid !== storeId) {
            setData(null);
            setError("Não foi possível confirmar o cadastro desta loja.");
            setLoading(false);
            return;
          }
          setData(next);
          setError("");
          setLoading(false);
          window.dispatchEvent(new Event("cardap:store-updated"));
        },
        () => {
          setError(
            "Não foi possível carregar as configurações. Confira sua conexão.",
          );
          setLoading(false);
        },
      );
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, [storeId]);
  async function save(
    section: StoreProfileSection,
    values: Record<string, unknown>,
  ) {
    if (getFirebaseAuth().currentUser?.uid !== storeId)
      throw new Error("Entre com a conta do proprietário.");
    const { data: result } = await httpsCallable<
      {
        storeId: string;
        section: StoreProfileSection;
        values: Record<string, unknown>;
      },
      { fields: Profile }
    >(
      getFirebaseFunctions(),
      "tenantSaveProfile",
    )({ storeId, section, values });
    if (getFirebaseAuth().currentUser?.uid !== storeId)
      throw new Error("A sessão mudou. Entre novamente na loja.");
    setData((current) => ({ ...current, ...result.fields }));
    window.dispatchEvent(new Event("cardap:store-updated"));
  }
  async function setReceivingOrders(receivingOrders: boolean) {
    if (getFirebaseAuth().currentUser?.uid !== storeId)
      throw new Error("Entre com a conta do proprietário.");
    const { data: result } = await httpsCallable<
      { storeId: string; receivingOrders: boolean },
      { receivingOrders: boolean }
    >(
      getFirebaseFunctions(),
      "tenantSetReceivingOrders",
    )({ storeId, receivingOrders });
    if (getFirebaseAuth().currentUser?.uid !== storeId)
      throw new Error("A sessão mudou. Entre novamente.");
    setData((current) =>
      current
        ? { ...current, receivingOrders: result.receivingOrders }
        : current,
    );
  }
  return (
    <Context.Provider
      value={{ data, loading, error, save, setReceivingOrders }}
    >
      {children}
    </Context.Provider>
  );
}
