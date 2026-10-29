"use client";
import { useEffect, useRef, useState } from "react";

type Topic = "account" | "wallet";
const walletVideo = process.env.NEXT_PUBLIC_ASAAS_WALLET_VIDEO_ID;
const videos = {
  account: {
    id: "zw0R_sgBDnA",
    title: "Como criar uma conta no Asaas",
    description:
      "Acompanhe o passo a passo de criação da conta no vídeo do Asaas.",
  },
  wallet: {
    id:
      walletVideo && /^[\w-]{11}$/.test(walletVideo) ? walletVideo : undefined,
    title: "Como obter o Wallet ID",
    description:
      "O Wallet ID identifica a carteira da conta que deverá receber os pagamentos.",
  },
};

export function useAsaasVideoTutorial() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<Topic>("account");
  const [loading, setLoading] = useState(true);
  const video = videos[topic];
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  const show = () => {
    setTopic("account");
    setLoading(true);
    setOpen(true);
  };
  const select = (next: Topic) => {
    if (topic !== next) {
      setLoading(true);
      setTopic(next);
    }
  };
  return {
    dialogRef,
    open,
    topic,
    video,
    loading,
    show,
    select,
    close: () => setOpen(false),
    loaded: () => setLoading(false),
  };
}
