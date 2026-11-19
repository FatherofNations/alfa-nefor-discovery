const TEMPLATE_PAYMENT_KEY = "__alfaTemplatePaymentKept";
let keptInMemory = false;

export function hasKeptTemplatePayment(): boolean {
  try {
    return window.sessionStorage.getItem(TEMPLATE_PAYMENT_KEY) === "1";
  } catch {
    return keptInMemory;
  }
}

export function setTemplatePaymentKept(kept: boolean): void {
  keptInMemory = kept;
  try {
    if (kept) window.sessionStorage.setItem(TEMPLATE_PAYMENT_KEY, "1");
    else window.sessionStorage.removeItem(TEMPLATE_PAYMENT_KEY);
  } catch {
    // Вкладка сохраняет выбор в памяти, если хранилище недоступно.
  }
}
