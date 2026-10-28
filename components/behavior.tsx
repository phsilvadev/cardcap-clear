"use client";

import { useEffect } from "react";

// Inicializa as interações depois que o React hidrata o conteúdo da página.
export default function Behavior({
  initialize,
}: {
  initialize: () => void | (() => void);
}) {
  useEffect(() => initialize(), [initialize]);
  return null;
}
