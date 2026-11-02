import { test, expect } from "@playwright/test";
import {
  tourCardPosition,
  tourSteps,
  tourStorageKey,
} from "../lib/onboarding/tour";

test("tour mostra somente as operações habilitadas", () => {
  expect(
    tourSteps({ salon: false, ownDelivery: false }).map((s) => s.target),
  ).toEqual(["settings", "menu", "orders"]);
  expect(
    tourSteps({ salon: true, ownDelivery: false }).map((s) => s.target),
  ).toEqual(["settings", "menu", "orders", "salon"]);
  expect(
    tourSteps({ salon: false, ownDelivery: true }).map((s) => s.target),
  ).toEqual(["settings", "menu", "orders", "deliveries"]);
  expect(tourSteps({ salon: true, ownDelivery: true })).toHaveLength(5);
  expect(tourStorageKey("loja-a")).not.toBe(tourStorageKey("loja-b"));
});

test("cartão fica ao lado do menu no desktop e abaixo no celular", () => {
  const target = { top: 200, bottom: 244, left: 24, right: 224 };
  expect(
    tourCardPosition(
      target,
      { width: 1440, height: 900 },
      { width: 360, height: 300 },
    ),
  ).toEqual({ left: 240, top: 200 });
  expect(
    tourCardPosition(
      target,
      { width: 390, height: 844 },
      { width: 358, height: 300 },
    ),
  ).toEqual({ left: 16, top: 260 });
});

test("cartão muda para cima quando não cabe abaixo e respeita telas pequenas", () => {
  expect(
    tourCardPosition(
      { top: 600, bottom: 644, left: 24, right: 224 },
      { width: 390, height: 844 },
      { width: 358, height: 300 },
    ),
  ).toEqual({ left: 16, top: 284 });
  const result = tourCardPosition(
    { top: 50, bottom: 94, left: -10, right: 190 },
    { width: 320, height: 400 },
    { width: 288, height: 368 },
  );
  expect(result).toEqual({ left: 16, top: 16 });
});
