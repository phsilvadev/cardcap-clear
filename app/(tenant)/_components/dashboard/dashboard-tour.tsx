"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { StoreOperations } from "@/lib/operations";
import {
  TOUR_EVENT,
  tourSteps,
  tourStorageKey,
  tourCardPosition,
} from "@/lib/onboarding/tour";

import { useStoreOperations } from "./operations-provider";

export function TenantDashboardTour({ storeId }: { storeId: string }) {
  const { operations } = useStoreOperations();
  return <DashboardTour storeId={storeId} operations={operations} />;
}

type Highlight = { top: number; left: number; width: number; height: number };

export default function DashboardTour({
  storeId,
  operations,
}: {
  storeId: string;
  operations: StoreOperations;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [position, setPosition] = useState({ top: 16, left: 16 });
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const steps = tourSteps(operations);
  const step = index === null ? null : steps[index];
  const key = tourStorageKey(storeId);
  const sessionDismissed = useRef(false);

  const dismiss = useCallback(() => {
    sessionDismissed.current = true;
    try {
      localStorage.setItem(key, "dismissed");
    } catch {
      // The guide still works when browser storage is unavailable.
    }
    setIndex(null);
  }, [key]);

  useEffect(() => {
    sessionDismissed.current = false;
    const timer = window.setTimeout(() => {
      try {
        if (!localStorage.getItem(key) && !sessionDismissed.current)
          setIndex(0);
      } catch {
        // Avoid showing an automatic guide on every visit without storage.
      }
    }, 700);
    const restart = () => setIndex(0);
    window.addEventListener(TOUR_EVENT, restart);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(TOUR_EVENT, restart);
    };
  }, [key]);

  useEffect(() => {
    if (!step) {
      dialog.current?.close();
      return;
    }
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      element.close();
    };
  }, [Boolean(step)]);

  useEffect(() => {
    if (!step) return;
    const target = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!target) {
      setHighlight(null);
      return;
    }
    target.scrollIntoView({
      block: window.innerWidth <= 800 ? "start" : "center",
      inline: "nearest",
      behavior: "instant",
    });
    if (window.innerWidth <= 800)
      window.scrollBy({ top: -24, behavior: "instant" });
    function update() {
      if (!target || !card.current) return;
      const rect = target.getBoundingClientRect();
      setHighlight({
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10,
      });
      setPosition(
        tourCardPosition(
          rect,
          { width: window.innerWidth, height: window.innerHeight },
          card.current.getBoundingClientRect(),
        ),
      );
    }
    update();
    firstButton.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(update);
    observer.observe(target);
    if (card.current) observer.observe(card.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step?.target]);

  return (
    <dialog
      ref={dialog}
      className="dashboard-tour"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      {step && (
        <>
          {highlight && (
            <div
              className="tour-highlight"
              aria-hidden="true"
              style={highlight}
            />
          )}
          <div ref={card} className="tour-card" style={position}>
            <p className="tour-progress">
              Conheça o painel · {(index ?? 0) + 1} de {steps.length}
            </p>
            <h2 id="tour-title">{step.title}</h2>
            <p id="tour-description">{step.description}</p>
            <p className="tour-hint">Você pode rever este guia em Ajuda.</p>
            <div className="tour-actions">
              <button
                ref={firstButton}
                type="button"
                className="tour-skip"
                onClick={dismiss}
              >
                Pular tour
              </button>
              <div>
                {index !== null && index > 0 && (
                  <button
                    type="button"
                    className="tour-back"
                    onClick={() => setIndex(index - 1)}
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  className="tour-next"
                  onClick={() => {
                    if (index === steps.length - 1) dismiss();
                    else setIndex((current) => (current ?? 0) + 1);
                  }}
                >
                  {index === steps.length - 1 ? "Concluir" : "Avançar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
