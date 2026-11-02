import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
test("interações antigas podem montar, limpar e montar sem repetir opções ou eventos", async ({
  page,
}) => {
  await page.setContent(
    '<form id="location-form"><input id="city"><select id="state"><option value="">Estado</option></select></form><p id="search-feedback"></p><button data-info="about">Sobre</button><dialog id="info-dialog"><h2 id="dialog-title"></h2><p id="dialog-description"></p></dialog>',
  );
  const dom = stripTypeScriptTypes(
    readFileSync("lib/dom.ts", "utf8"),
  ).replaceAll("export function", "function");
  const source = stripTypeScriptTypes(
    readFileSync("app/(client)/_lib/home.ts", "utf8"),
  )
    .replace(/^import[^;]+;\s*/, "")
    .replace("export default function initialize", "function initialize");
  await page.addScriptTag({
    content: `${dom}\n${source}\nwindow.initializeHome = initialize;`,
  });
  const result = await page.evaluate(() => {
    const globals = window as typeof window & {
      initializeHome: () => () => void;
    };
    const dialog = document.querySelector("dialog")!;
    let opened = 0;
    dialog.showModal = () => {
      opened++;
    };
    const first = globals.initializeHome();
    first();
    const second = globals.initializeHome();
    const count = document.querySelectorAll("#state option").length;
    (document.querySelector("[data-info]") as HTMLButtonElement).click();
    second();
    (document.querySelector("[data-info]") as HTMLButtonElement).click();
    return {
      count,
      opened,
      remaining: document.querySelectorAll("#state option").length,
    };
  });
  expect(result).toEqual({ count: 28, opened: 1, remaining: 1 });
});
