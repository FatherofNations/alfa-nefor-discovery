"use client";
/* Порядок пунктов левого меню дашборда (главный и бухгалтер).
   Логика без анимации: движение подключает Аниматор поверх (useMenuDragMotion).

   Модель: у меню три зоны перетаскиваемых пунктов — "main" (основной раздел),
   "folder" (внутри «Ещё») и "extra" (раздел под нижним разделителем).
   «Все сервисы» и «Альфа-Выгодно» в зоны не входят: они рендерятся отдельно
   с data-menu-fixed, их нельзя взять, и на их место нельзя бросить пункт.

   Хранение — модульная переменная: переживает клиентские переходы и
   переключение дашбордов, сбрасывается при перезагрузке страницы.
   localStorage не используется.

   Разметка, которую читает этот файл (и хук Аниматора):
     [data-menu-root]                контейнер меню (вешается ref из useMenuDnd)
     [data-menu-zone="main|folder|extra"]  контейнер зоны
     [data-menu-id="…"]              пункт (у неподвижных ещё data-menu-fixed)
     [data-menu-folder]              кнопка-переключатель «Ещё»
     [data-menu-folder-body]         контейнер вложенных пунктов, data-open="true|false"
     [data-menu-drop-line]           метка места вставки (позиционируется отсюда)
   Состояния, которые ставит этот файл:
     root[data-menu-dragging]        идёт перетаскивание (мышь/тач)
     item.is-dragging                исходный пункт на время перетаскивания (50%)
     [data-menu-ghost]               плавающая копия в body; --menu-drag-x/y — сдвиг от точки захвата
     item.is-grabbed, aria-pressed   взятый с клавиатуры пункт
     folder[data-drop-target]        пункт сейчас бросят внутрь «Ещё» (папка раскрыта, метка под заголовком)
*/

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import "@/styles/menu-dnd.css";

export type MenuZone = "main" | "folder" | "extra";
export type MenuState = { main: string[]; folder: string[]; extra: string[]; folderOpen: boolean };
export type MenuId = "entrepreneur" | "accountant";

/* "extra" больше не используется: под «Ещё» стоят только неподвижные пункты
   с пунктирной обводкой (data-menu-fixed="bottom"), туда ничего не бросить. */
const ZONES: readonly MenuZone[] = ["main", "folder"];

const INITIAL: Record<MenuId, MenuState> = {
  entrepreneur: {
    main: ["pay", "feed", "progress"],
    folder: [],
    extra: [],
    folderOpen: false,
  },
  accountant: {
    main: ["pay", "feed", "progress", "import", "statement", "accounts", "contragents", "certificates", "invoices", "cards"],
    folder: [],
    extra: [],
    folderOpen: false,
  },
};

const clone = (s: MenuState): MenuState => ({ main: [...s.main], folder: [...s.folder], extra: [...s.extra], folderOpen: s.folderOpen });

const states: Record<MenuId, MenuState> = { entrepreneur: clone(INITIAL.entrepreneur), accountant: clone(INITIAL.accountant) };
const listeners: Record<MenuId, Set<() => void>> = { entrepreneur: new Set(), accountant: new Set() };

function setState(menu: MenuId, next: MenuState) {
  states[menu] = next;
  listeners[menu].forEach((l) => l());
}

export function getMenuState(menu: MenuId): MenuState {
  return states[menu];
}

export function findItem(s: MenuState, id: string): { zone: MenuZone; index: number } | null {
  for (const zone of ZONES) {
    const index = s[zone].indexOf(id);
    if (index !== -1) return { zone, index };
  }
  return null;
}

/* Единственная точка изменения порядка. toIndex считается в зоне БЕЗ
   переносимого пункта и зажимается в границы. Неподвижные пункты сюда не
   попадают (их нет в зонах), поэтому move для них — no-op. */
export function moveItem(menu: MenuId, id: string, toIndex: number, toZone: MenuZone): boolean {
  const cur = states[menu];
  const from = findItem(cur, id);
  if (!from) return false;
  const next = clone(cur);
  next[from.zone].splice(from.index, 1);
  const i = Math.max(0, Math.min(toIndex, next[toZone].length));
  next[toZone].splice(i, 0, id);
  if (toZone === "folder") next.folderOpen = true;
  const same = from.zone === toZone && from.index === i;
  if (same && next.folderOpen === cur.folderOpen) return false;
  setState(menu, next);
  return true;
}

export function setFolderOpen(menu: MenuId, open: boolean) {
  if (states[menu].folderOpen === open) return;
  setState(menu, { ...clone(states[menu]), folderOpen: open });
}

export function restoreMenu(menu: MenuId, snapshot: MenuState) {
  setState(menu, clone(snapshot));
}

export function useMenuOrder(menu: MenuId): MenuState {
  const subscribe = useCallback((l: () => void) => {
    listeners[menu].add(l);
    return () => { listeners[menu].delete(l); };
  }, [menu]);
  return useSyncExternalStore(subscribe, () => states[menu], () => INITIAL[menu]);
}

/* Линейный список позиций для клавиатуры: main → folder → extra. */
function stepKeyboard(menu: MenuId, id: string, dir: -1 | 1) {
  const s = states[menu];
  const from = findItem(s, id);
  if (!from) return;
  const sizes = ZONES.map((z) => s[z].length - (z === from.zone ? 1 : 0));
  const slots: { zone: MenuZone; index: number }[] = [];
  ZONES.forEach((z, zi) => { for (let i = 0; i <= sizes[zi]; i++) slots.push({ zone: z, index: i }); });
  const pos = slots.findIndex((p) => p.zone === from.zone && p.index === from.index);
  const target = slots[pos + dir];
  if (!target) return;
  /* Граница зон: «конец main» и «начало folder» — разные слоты, но визуально
     соседние; шаг через границу сразу переносит пункт в другую зону. */
  moveItem(menu, id, target.index, target.zone);
}

const DRAG_THRESHOLD = 4;
const TOUCH_HOLD_MS = 200;

type Target = { zone: MenuZone; index: number; el: HTMLElement | null; after: boolean; folder: boolean };

/* Вешает обработчики на корень меню делегированием: pointer-drag и клавиатуру.
   Возвращает ref для [data-menu-root]. */
export function useMenuDnd(menu: MenuId) {
  const rootRef = useRef<HTMLElement | null>(null);
  const refocusId = useRef<string | null>(null);
  const state = useMenuOrder(menu);

  const grabRef = useRef<{ id: string; snapshot: MenuState } | null>(null);

  /* После перестановки React может пересоздать узел (смена родителя-зоны):
     возвращаем фокус на тот же пункт и, если он взят с клавиатуры, его состояние. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const id = refocusId.current ?? grabRef.current?.id ?? null;
    refocusId.current = null;
    if (!id) return;
    const el = root.querySelector<HTMLElement>(`[data-menu-id="${id}"]`);
    if (!el) return;
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    if (grabRef.current?.id === id) { el.classList.add("is-grabbed"); el.setAttribute("aria-pressed", "true"); }
  }, [state]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const live = root.querySelector<HTMLElement>("[data-menu-live]");
    const say = (t: string) => { if (live) live.textContent = t; };
    const line = root.querySelector<HTMLElement>("[data-menu-drop-line]");
    const label = (el: HTMLElement) => el.textContent?.trim() ?? "";

    /* ── pointer ── */
    let pending: { id: string; el: HTMLElement; x: number; y: number; pointerId: number; timer: number | null; touch: boolean } | null = null;
    let drag: { id: string; el: HTMLElement; ghost: HTMLElement; x: number; y: number; snapshot: MenuState; target: Target | null } | null = null;
    let suppressClick = false;

    const clearTarget = () => {
      if (line) line.hidden = true;
      root.querySelectorAll("[data-drop-target]").forEach((n) => n.removeAttribute("data-drop-target"));
    };

    const computeTarget = (clientY: number, dragId: string): Target | null => {
      const s = states[menu];
      const folderBtn = root.querySelector<HTMLElement>("[data-menu-folder]");
      if (folderBtn) {
        const r = folderBtn.getBoundingClientRect();
        /* Над «Ещё»: папка раскрывается, пункт встаёт первым внутрь (метка под заголовком). */
        if (clientY >= r.top && clientY <= r.bottom) {
          if (!s.folderOpen) setFolderOpen(menu, true);
          return { zone: "folder", index: 0, el: folderBtn, after: true, folder: true };
        }
      }
      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-id]:not([data-menu-fixed])"))
        .filter((el) => el.dataset.menuId !== dragId && el.getClientRects().length > 0 && !el.closest("[inert]"));
      if (!items.length) return { zone: "main", index: 0, el: null, after: false, folder: false };
      const fixed = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-fixed]:not([data-menu-fixed=\"bottom\"])"));
      const fixedBottom = fixed.length ? Math.max(...fixed.map((f) => f.getBoundingClientRect().bottom)) : -Infinity;
      if (clientY <= fixedBottom) {
        const first = items.find((el) => el.closest("[data-menu-zone]")?.getAttribute("data-menu-zone") === "main") ?? null;
        return { zone: "main", index: 0, el: first, after: false, folder: false };
      }
      let best = items[0], bestD = Infinity;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const d = clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
        if (d < bestD) { bestD = d; best = el; }
      }
      const zone = (best.closest("[data-menu-zone]")?.getAttribute("data-menu-zone") ?? "main") as MenuZone;
      const list = s[zone].filter((x) => x !== dragId);
      const r = best.getBoundingClientRect();
      const after = clientY > r.top + r.height / 2;
      const index = list.indexOf(best.dataset.menuId!) + (after ? 1 : 0);
      return { zone, index, el: best, after, folder: false };
    };

    const showTarget = (t: Target | null) => {
      clearTarget();
      if (!t) return;
      if (t.folder && t.el) t.el.setAttribute("data-drop-target", "");
      if (!line || !t.el) return;
      const rr = root.getBoundingClientRect();
      const r = t.el.getBoundingClientRect();
      line.style.top = `${(t.after ? r.bottom : r.top) - rr.top + root.scrollTop}px`;
      line.hidden = false;
    };

    const startDrag = () => {
      if (!pending) return;
      const { id, el, x, y } = pending;
      if (pending.timer) clearTimeout(pending.timer);
      pending = null;
      /* Плавающая копия (пример Figma 36176:48319): белая, r16, тень XS Flat;
         исходный пункт остаётся на месте с прозрачностью 50%. */
      const r = el.getBoundingClientRect();
      const ghost = el.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-menu-id");
      ghost.removeAttribute("id");
      ghost.setAttribute("aria-hidden", "true");
      ghost.setAttribute("data-menu-ghost", menu);
      ghost.classList.remove("is-active");
      ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;`;
      document.body.appendChild(ghost);
      drag = { id, el, ghost, x, y, snapshot: clone(states[menu]), target: null };
      el.classList.add("is-dragging");
      root.setAttribute("data-menu-dragging", "");
      document.body.style.userSelect = "none";
    };

    const endDrag = (commit: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.el.classList.remove("is-dragging");
      d.ghost.remove();
      root.removeAttribute("data-menu-dragging");
      document.body.style.userSelect = "";
      clearTarget();
      if (commit && d.target) moveItem(menu, d.id, d.target.index, d.target.zone);
      else restoreMenu(menu, d.snapshot);
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-menu-id]");
      if (!el || !root.contains(el) || el.hasAttribute("data-menu-fixed")) return;
      if ((e.target as HTMLElement).closest("[data-menu-no-drag]")) return;
      const touch = e.pointerType === "touch";
      pending = { id: el.dataset.menuId!, el, x: e.clientX, y: e.clientY, pointerId: e.pointerId, touch, timer: null };
      if (touch) pending.timer = window.setTimeout(startDrag, TOUCH_HOLD_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pending && e.pointerId === pending.pointerId) {
        const moved = Math.hypot(e.clientX - pending.x, e.clientY - pending.y) >= DRAG_THRESHOLD;
        if (moved) {
          if (pending.touch) { if (pending.timer) clearTimeout(pending.timer); pending = null; return; }
          startDrag();
        }
      }
      if (!drag) return;
      e.preventDefault();
      drag.ghost.style.setProperty("--menu-drag-x", `${e.clientX - drag.x}px`);
      drag.ghost.style.setProperty("--menu-drag-y", `${e.clientY - drag.y}px`);
      drag.target = computeTarget(e.clientY, drag.id);
      showTarget(drag.target);
    };

    const onPointerUp = () => {
      if (pending) { if (pending.timer) clearTimeout(pending.timer); pending = null; }
      if (drag) endDrag(true);
    };
    const onPointerCancel = () => {
      if (pending) { if (pending.timer) clearTimeout(pending.timer); pending = null; }
      if (drag) endDrag(false);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    };
    const onDragStart = (e: DragEvent) => { if (root.contains(e.target as Node)) e.preventDefault(); };

    /* ── клавиатура ── */
    const release = () => {
      root.querySelectorAll(".is-grabbed").forEach((n) => { n.classList.remove("is-grabbed"); n.removeAttribute("aria-pressed"); });
      grabRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-menu-id]");
      if (!el || el.hasAttribute("data-menu-fixed") || !root.contains(el)) return;
      const id = el.dataset.menuId!;
      const grab = grabRef.current;
      if (e.key === " ") {
        e.preventDefault();
        if (e.repeat || drag) return;
        if (grab) { release(); say(`${label(el)}: поставлен`); }
        else {
          grabRef.current = { id, snapshot: clone(states[menu]) };
          el.classList.add("is-grabbed");
          el.setAttribute("aria-pressed", "true");
          say(`${label(el)}: взят. Стрелки вверх и вниз — переместить, пробел — поставить, Escape — отменить`);
        }
        return;
      }
      if (!grab || grab.id !== id) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        stepKeyboard(menu, id, e.key === "ArrowUp" ? -1 : 1);
        const at = findItem(states[menu], id);
        if (at) say(`${label(el)}: ${at.zone === "folder" ? "в «Ещё», " : ""}позиция ${at.index + 1}`);
      } else if (e.key === "Escape") {
        e.preventDefault();
        const snap = grab.snapshot;
        release();
        refocusId.current = id;
        restoreMenu(menu, snap);
        say(`${label(el)}: перемещение отменено`);
      } else if (e.key === "Tab") {
        release();
      }
    };
    const onWindowKey = (e: KeyboardEvent) => {
      if (drag && e.key === "Escape") { e.preventDefault(); endDrag(false); }
    };
    const onFocusOut = (e: FocusEvent) => {
      const grab = grabRef.current;
      if (!grab) return;
      const next = e.relatedTarget as HTMLElement | null;
      if (next && next.closest(`[data-menu-id="${grab.id}"]`)) return;
      /* Фокус ушёл не из-за перерисовки (relatedTarget есть) — ставим пункт. */
      if (next) release();
    };
    /* Пробел на кнопке активирует её на keyup — гасим, пока пункт перетаскивается с клавиатуры. */
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-menu-id]");
      if (el && !el.hasAttribute("data-menu-fixed") && root.contains(el)) e.preventDefault();
    };

    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("dragstart", onDragStart);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onWindowKey);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      if (pending?.timer) clearTimeout(pending.timer);
      if (drag) endDrag(false);
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("dragstart", onDragStart);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onWindowKey);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [menu]);

  const toggleFolder = useCallback(() => setFolderOpen(menu, !states[menu].folderOpen), [menu]);
  return { rootRef, state, toggleFolder };
}
