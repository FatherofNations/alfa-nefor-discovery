/* Сессия первого входа.
   Храним в sessionStorage: обычный reload (Cmd+R) состояние сохраняет и
   показывает дашборд, а hard reload (Cmd+Shift+R) сбрасывает — сервер видит
   `cache-control: no-cache` / `pragma: no-cache` и выставляет флаг hardReload
   (см. lib/reload-mode.ts), по которому гейт чистит сессию и уводит на /login.
   Тестовые прогоны могут по-прежнему подставить window.__alfaEntryState —
   это значение имеет приоритет. */
export type EntryRole = "entrepreneur" | "accountant";

type EntryState = { entered: boolean; role: EntryRole };

const STORAGE_KEY = "__alfaEntryState";
const host = (): Record<string, EntryState | undefined> | null =>
  typeof window === "undefined" ? null : (window as unknown as Record<string, EntryState | undefined>);

function readStorage(): Partial<EntryState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<EntryState>) : {};
  } catch {
    return {};
  }
}

function writeStorage(state: EntryState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* приватный режим — остаёмся на window-состоянии */
  }
}

function state(): EntryState {
  const windowHost = host();
  if (!windowHost) return { entered: false, role: "entrepreneur" };
  const injected = windowHost[STORAGE_KEY];
  if (injected) return injected;
  const stored = readStorage();
  const next: EntryState = { entered: stored.entered === true, role: stored.role === "accountant" ? "accountant" : "entrepreneur" };
  windowHost[STORAGE_KEY] = next;
  return next;
}

function persist(next: EntryState): void {
  const windowHost = host();
  if (windowHost) windowHost[STORAGE_KEY] = next;
  writeStorage(next);
}

export function hasEntered(): boolean {
  return state().entered;
}

export function markEntered(): void {
  const next = { ...state(), entered: true };
  persist(next);
}

export function resetEntry(): void {
  const next: EntryState = { entered: false, role: "entrepreneur" };
  persist(next);
}

export function setEntryRole(role: EntryRole): void {
  persist({ ...state(), role });
}

export function getEntryRole(): EntryRole {
  return state().role;
}
