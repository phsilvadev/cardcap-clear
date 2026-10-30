"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import {
  normalizeOperations,
  defaultOperations,
  type StoreOperations,
} from "@/lib/operations";
const Context = createContext({
  operations: defaultOperations,
  ready: false,
  error: "",
});
export const useStoreOperations = () => useContext(Context);
export default function OperationsProvider({
  storeId,
  initial,
  children,
}: {
  storeId: string;
  initial: StoreOperations;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [operations, setOperations] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let stop = () => {};
    const authStop = onAuthStateChanged(getFirebaseAuth(), (user) => {
      stop();
      setReady(false);
      if (user?.uid !== storeId) {
        setOperations(defaultOperations);
        setError(
          "Entre com a conta do proprietário para configurar a operação.",
        );
        return;
      }
      stop = onSnapshot(
        doc(getFirebaseDb(), "tenants", storeId),
        (snapshot) => {
          setOperations(normalizeOperations(snapshot.data()?.operations));
          setReady(true);
          setError("");
        },
        () => {
          setReady(false);
          setError(
            "Não foi possível atualizar a operação. Confira sua conexão e entre novamente se necessário.",
          );
        },
      );
    });
    return () => {
      authStop();
      stop();
    };
  }, [storeId]);
  const disabled =
    ready &&
    ((pathname.includes("/garcons") && !operations.salon) ||
      (pathname.includes("/entregadores") && !operations.ownDelivery));
  useEffect(() => {
    if (disabled) router.replace("/dashboard?view=settings&section=operations");
  }, [disabled, router]);
  if (disabled) return null;
  return (
    <Context.Provider value={{ operations, ready, error }}>
      {children}
    </Context.Provider>
  );
}
