/* Сессия первого входа — в памяти документа (window), не в localStorage.
   Так любой полный reload (включая hard reload Ctrl+Shift+R) начинает с
   логина, а клиентские переходы внутри SPA состояние сохраняют. */
export type EntryRole = "entrepreneur" | "accountant";

type EntryState = { entered: boolean; role: EntryRole };

const KEY = "__alfaEntryState";

function state(): EntryState {
  if (typeof window === "undefined") return { entered: false, role: "entrepreneur" };
  const host = window as unknown as Record<string, EntryState | undefined>;
  if (!host[KEY]) host[KEY] = { entered: false, role: "entrepreneur" };
  return host[KEY] as EntryState;
}

export function hasEntered(): boolean {
  return state().entered;
}

export function markEntered(): void {
  state().entered = true;
}

export function resetEntry(): void {
  state().entered = false;
}

export function setEntryRole(role: EntryRole): void {
  state().role = role;
}

export function getEntryRole(): EntryRole {
  return state().role;
}
