"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasEntered, resetEntry } from "@/lib/entry-session";
import { setTemplatePaymentKept } from "@/lib/quick-actions";

/* Скелетон дашборда — прогрессивная загрузка ПО ВИДЖЕТАМ.

   Как в реальном продукте: скелетон не снимается целиком. Каждый виджет
   (сайдбар, шапка, табы, hero, «Мои дела», лента, у бухгалтера — qa, баланс,
   «Дела в работе», баннеры, табло, карточки, лента) приходит в свой момент:
   до этого его плитка рисуется скелетоном, после — скелетон этой плитки
   скрывается и показывается живой контент. Плитки совпадают по геометрии,
   поэтому раскладка не дёргается.

   Режимы:
   - обычный вход: каждый виджет появляется по расписанию из `widgets`;
   - ?skel=off — все сразу (скриншоты/QA);
   - ?skel=on  — расписание даже в headless (посмотреть переход);
   - ?skel=hold — держим скелетон (скриншот состояния загрузки);
   - headless-автоматизация — сразу всё, иначе parity ловил бы скелетон;
   - hard reload (Cmd+Shift+R) — чистим сессию и уводим на /login. */

export type SkeletonWidget = { key: string; delay: number };

type DashboardSkeletonGateProps = {
  fallback: ReactNode;
  children: ReactNode;
  /* Расписание появления виджетов (мс от маунта). */
  widgets: readonly SkeletonWidget[];
  /* hard reload — единственный случай, когда первый вход показывается заново. */
  hardReload?: boolean;
};

export default function DashboardSkeletonGate({
  fallback,
  children,
  widgets,
  hardReload = false,
}: DashboardSkeletonGateProps) {
  const router = useRouter();
  const [loadedCount, setLoadedCount] = useState(0);

  useLayoutEffect(() => {
    setLoadedCount(0);
    if (hardReload) {
      resetEntry();
      setTemplatePaymentKept(false);
      router.replace("/login");
      return;
    }

    const schedule = widgets;
    const keys = schedule.map((widget) => widget.key);
    const mode = new URLSearchParams(window.location.search).get("skel");

    /* новый маунт (в т.ч. клиентская навигация) — снимаем прошлые отметки */
    keys.forEach((key) => document.body.classList.remove(`sk-loaded-${key}`));

    if (mode === "hold") return;
    if (!hasEntered()) {
      router.replace("/login");
      return;
    }

    const automation =
      navigator.webdriver === true || /HeadlessChrome/i.test(navigator.userAgent);

    /* Держим локальный набор загруженных: ре-рендер делаем только когда
       готовы все виджеты (иначе каждый таймер перерисовывал бы дашборд). */
    const ready = new Set<string>();
    const activate = (batch: string[]) => {
      batch.forEach((key) => {
        if (ready.has(key)) return;
        ready.add(key);
        document.body.classList.add(`sk-loaded-${key}`);
      });
      if (ready.size === keys.length) setLoadedCount(keys.length);
    };

    if (mode === "off" || (automation && mode !== "on")) {
      activate(keys);
      return;
    }

    const timers = schedule.map(({ key, delay }) =>
      window.setTimeout(() => activate([key]), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hardReload, router, widgets]);

  const allLoaded = loadedCount >= widgets.length;

  return (
    <div className={`dash-gate${allLoaded ? " gate-ready" : ""}`} aria-busy={allLoaded ? undefined : true}>
      {!allLoaded && <div className="gate-skeleton">{fallback}</div>}
      <div className="gate-content">{children}</div>
    </div>
  );
}
