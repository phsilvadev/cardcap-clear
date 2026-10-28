export function query<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T {
  const element = root.querySelector<T>(selector);
  if (!element)
    throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  return element;
}

export function queryAll<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): NodeListOf<T> {
  return root.querySelectorAll<T>(selector);
}

export function formValue(form: HTMLFormElement, name: string): string {
  return String(new FormData(form).get(name) ?? "");
}
