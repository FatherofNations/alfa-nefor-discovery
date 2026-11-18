"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import TasksCards from "./TasksCards";
import TasksOptions from "./TasksOptions";

type TasksMode = "signals" | "work" | "all";
const optionKinds = ["signals", "work"] as const;

const expandedRows = [
  { title: "Оплатить", amount: "1 234 567,00 ₽ ", count: 3, important: true },
  { title: "Подписать", amount: "21 207,04 ₽ ", count: 1 },
  { title: "В работе у банка", amount: "58 949,10 ₽ ", count: 3 },
  { title: "Доработать", amount: "1 207,74 ₽ ", count: 3 },
  { title: "Отклонённые", amount: "91 777,12 ₽ ", count: 3 },
  { title: "Черновики", amount: "2 381 567,06 ₽ ", count: 3 },
];

export default function TasksWidget({ afterPanel }: { afterPanel: boolean }) {
  const id = useId();
  const controls = { signals: `${id}-signals`, work: `${id}-work`, all: `${id}-all` };
  const [mode, setMode] = useState<TasksMode | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const hideRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<TasksMode | null>(null);

  const dismiss = useCallback((restoreFocus: boolean) => {
    returnFocus.current = restoreFocus ? mode : null;
    setMode(null);
  }, [mode]);

  useLayoutEffect(() => {
    if (mode === "all") {
      hideRef.current?.focus({ preventScroll: true });
    } else if (!mode && returnFocus.current) {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tasks-trigger="${returnFocus.current}"]`)
        ?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const root = rootRef.current;
      if (!(target instanceof Element) || !root) return;
      const control = target.closest("[data-tasks-trigger]");
      if (control && root.contains(control)) return;
      const layer = target.closest(`[data-tasks-layer="${mode}"]`);
      if (layer && root.contains(layer)) return;
      dismiss(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, dismiss]);

  return (
    <section
      ref={rootRef}
      className={`tasks tasks-flow${afterPanel ? " tasks-after-panel" : ""}`}
      aria-labelledby="tasks-title"
    >
      <TasksCards mode={mode} onToggle={(next) => setMode((current) => current === next ? null : next)} controls={controls} />
      {optionKinds.map((kind) => (
        <div
          key={kind}
          className="tasks-flow-overlay"
          data-tasks-layer={kind}
          data-open={mode === kind}
          inert={mode !== kind}
          aria-hidden={mode !== kind}
        >
          <TasksOptions kind={kind} id={controls[kind]} />
        </div>
      ))}
      <div
        id={controls.all}
        className="tasks-flow-overlay tasks-expanded"
        data-tasks-layer="all"
        data-open={mode === "all"}
        inert={mode !== "all"}
        aria-hidden={mode !== "all"}
        role="region"
        aria-label="Все дела"
      >
        <ul className="tasks-expanded-list">
          {expandedRows.map(({ title, amount, count, important }) => (
            <li className="tasks-expanded-row" key={title}>
              <span>{title}</span>
              <span className="tasks-expanded-amount">{amount}</span>
              <span className={`tasks-expanded-count${important ? " tasks-expanded-count-important" : ""}`}>{count}</span>
            </li>
          ))}
        </ul>
        <button ref={hideRef} className="tasks-expanded-close" type="button" onClick={() => dismiss(true)}>
          Скрыть
          <img src="/assets/figma/tasks-flow/chevron-up.svg" width="20" height="20" alt="" />
        </button>
      </div>
    </section>
  );
}
