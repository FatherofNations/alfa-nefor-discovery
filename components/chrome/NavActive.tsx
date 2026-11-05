"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Активное состояние пункта меню — из макета «Карты» (Figma 129417:52083):
   серая пилюля neutral/300 + красная полоса 2×36 у левого края (см. .is-active
   в chrome.css). Разметка хрома остаётся серверной и статичной — класс
   навешивается по факту роута, как и заведено в этом проекте.

   Пункты без data-nav (страницы ещё не свёрстаны) остаются инертными. */

export default function ChromeNavActive() {
  const pathname = usePathname();

  useEffect(() => {
    const cells = document.querySelectorAll<HTMLAnchorElement>(
      ".chrome-cell[data-nav]"
    );
    cells.forEach((cell) => {
      const href = cell.dataset.nav ?? "";
      const active =
        pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
      cell.classList.toggle("is-active", active);
      if (active) cell.setAttribute("aria-current", "page");
      else cell.removeAttribute("aria-current");
    });
  }, [pathname]);

  return null;
}
