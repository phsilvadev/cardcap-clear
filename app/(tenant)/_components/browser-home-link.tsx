"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const isDesktop = () => Boolean(window.cardapPrinter);
const serverSnapshot = () => false;

export default function BrowserHomeLink() {
  const desktop = useSyncExternalStore(subscribe, isDesktop, serverSnapshot);
  return desktop ? null : (
    <a href="/">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m2 10 10-8 10 8M4 9v12h6v-7h4v7h6V9" />
      </svg>
      Voltar ao início
    </a>
  );
}
