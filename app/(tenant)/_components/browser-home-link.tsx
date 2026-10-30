"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const isDesktop = () => Boolean(window.cardapPrinter);
const serverSnapshot = () => false;

export default function BrowserHomeLink() {
  const desktop = useSyncExternalStore(subscribe, isDesktop, serverSnapshot);
  return desktop ? null : <a href="/">Voltar ao início</a>;
}
