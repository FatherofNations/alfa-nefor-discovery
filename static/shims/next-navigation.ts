/* Статический роутер для сборки под открытие файла с диска (file://).
   Маршруты живут в hash (#/accountant и т.п.), поэтому навигация работает без
   HTTP-сервера и без серверных запросов. Интерфейс повторяет useRouter /
   usePathname из next/navigation, которыми пользуются компоненты. */

import { useMemo, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentPath = "/";

function readPath(): string {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash.replace(/^#/, "");
  const path = hash.split("?")[0];
  return path || "/";
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function navigateStatic(to: string, replace: boolean, scroll = true): void {
  const path = to.split("?")[0] || "/";
  if (path === currentPath && !replace) return;
  currentPath = path;
  try {
    if (replace) window.history.replaceState(null, "", `#${to}`);
    else window.history.pushState(null, "", `#${to}`);
  } catch {
    window.location.hash = to;
  }
  if (scroll) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  emit();
}

export function syncStaticPath(): void {
  const next = readPath();
  if (next === currentPath) return;
  currentPath = next;
  emit();
}

export function subscribeStaticPath(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePathname(): string {
  return useSyncExternalStore(subscribeStaticPath, () => currentPath, () => "/");
}

export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string, options?: { scroll?: boolean }) => navigateStatic(String(href), false, options?.scroll),
      replace: (href: string, options?: { scroll?: boolean }) => navigateStatic(String(href), true, options?.scroll),
      prefetch: () => {},
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => {},
    }),
    [],
  );
}

if (typeof window !== "undefined") {
  currentPath = readPath();
  window.addEventListener("hashchange", syncStaticPath);
  window.addEventListener("popstate", syncStaticPath);
}
