"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseFunctions,
} from "@/lib/firebase/client";
function encode(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error());
    reader.onabort = () => reject(new Error());
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}
export function useStoreLogo(storeId?: string) {
  const [logo, setLogo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const locked = useRef(false);
  const selection = useRef(0);
  const mounted = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    let stopped = false;
    let unsubscribe = () => {};
    setLoading(true);
    setCanManage(false);
    void (async () => {
      try {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        if (stopped) return;
        if (!storeId || auth.currentUser?.uid !== storeId) throw new Error();
        unsubscribe = onSnapshot(
          doc(getFirebaseDb(), "tenants", storeId),
          (snapshot) => {
            if (stopped) return;
            const data = snapshot.data();
            if (data?.ownerUid !== storeId) {
              setError("Você não tem acesso à logo desta loja.");
              setLoading(false);
              return;
            }
            setCanManage(["configured", "active"].includes(data.status));
            const path = data.logoPath;
            const url = data.logoUrl;
            let valid = false;
            try {
              const parsed = new URL(url);
              valid =
                typeof path === "string" &&
                path.startsWith(`tenants/${storeId}/branding/`) &&
                parsed.origin === "https://firebasestorage.googleapis.com" &&
                parsed.pathname ===
                  `/v0/b/${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")}/o/${encodeURIComponent(path)}` &&
                Boolean(parsed.searchParams.get("token"));
            } catch {}
            setLogo(valid ? url : "");
            setLoading(false);
          },
          () => {
            if (!stopped) {
              setError(
                "Não foi possível carregar a logo. Confira sua conexão.",
              );
              setLoading(false);
            }
          },
        );
      } catch {
        if (!stopped) {
          setError("Entre com a conta do proprietário para gerenciar a logo.");
          setLoading(false);
        }
      }
    })();
    return () => {
      stopped = true;
      unsubscribe();
    };
  }, [storeId]);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const ticket = ++selection.current;
    const value = event.target.files?.[0];
    if (!value) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(value.type) ||
      value.size === 0 ||
      value.size > 2 * 1024 * 1024
    ) {
      setError("Escolha uma imagem JPG, PNG ou WebP de até 2 MB.");
      event.target.value = "";
      return;
    }
    try {
      const bitmap = await createImageBitmap(value);
      const valid = bitmap.width <= 4096 && bitmap.height <= 4096;
      bitmap.close();
      if (!valid) throw new Error();
      if (mounted.current && selection.current === ticket) {
        setFile(value);
        setPreview(URL.createObjectURL(value));
      }
    } catch {
      setError(
        "Não foi possível abrir a imagem. Use uma imagem válida de até 4096 × 4096 pixels.",
      );
      event.target.value = "";
    }
  }
  const discard = () => {
    selection.current++;
    setFile(null);
    setPreview("");
    if (input.current) input.current.value = "";
  };
  async function save(remove = false) {
    if (locked.current || !canManage || !storeId || (!remove && !file)) return;
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      const data = remove
        ? { storeId, remove: true }
        : { storeId, base64: await encode(file!), contentType: file!.type };
      const result = await httpsCallable<
        Record<string, unknown>,
        { logoUrl: string | null }
      >(
        getFirebaseFunctions(),
        "tenantSaveLogo",
      )(data);
      if (mounted.current) {
        setLogo(result.data.logoUrl || "");
        discard();
        setSuccess(true);
      }
    } catch {
      if (mounted.current)
        setError(
          "Não foi possível salvar a logo. Confira sua conexão e tente novamente.",
        );
    } finally {
      locked.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return {
    logo,
    preview,
    file,
    loading,
    canManage,
    saving,
    error,
    success,
    input,
    select,
    discard,
    save,
    closeSuccess: () => setSuccess(false),
  };
}
