"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { workCategories, workOrder, workSummary, type WorkCategoryId, type WorkItem } from "@/data/work-tasks";
import TasksCards from "./TasksCards";
import TasksOptions from "./TasksOptions";

type TasksMode = "signals" | "all";
type WorkPopover = {
  category: WorkCategoryId;
  anchor: HTMLButtonElement;
  open: boolean;
  pinned: boolean;
  expanded: boolean;
  top: number;
};

export default function TasksWidget({ afterPanel }: { afterPanel: boolean }) {
  const id = useId();
  const controls = { signals: `${id}-signals`, work: `${id}-work`, all: `${id}-all` };
  const [mode, setMode] = useState<TasksMode | null>(null);
  const [work, setWork] = useState<WorkPopover | null>(null);
  const activeWork = work?.open ? work : null;
  const rootRef = useRef<HTMLElement>(null);
  const hideRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<TasksMode | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelWorkClose = useCallback(() => window.clearTimeout(closeTimer.current), []);
  useEffect(() => cancelWorkClose, [cancelWorkClose]);

  const closeWork = useCallback(() => {
    cancelWorkClose();
    setWork(current => current?.open ? { ...current, open: false } : current);
  }, [cancelWorkClose]);

  const scheduleWorkClose = () => {
    cancelWorkClose();
    closeTimer.current = window.setTimeout(() => {
      setWork(current => current?.open && !current.pinned ? { ...current, open: false } : current);
    }, 220);
  };

  function openWork(category: WorkCategoryId, anchor: HTMLButtonElement, pinned: boolean, expanded: boolean) {
    const root = rootRef.current;
    if (!root || root.closest("[data-clicks-locked='true']")) return;
    cancelWorkClose();
    if (activeWork?.anchor === anchor) {
      if (!pinned) return;
      if (activeWork.pinned) closeWork();
      else setWork({ ...activeWork, pinned: true });
      return;
    }

    const row = anchor.getBoundingClientRect();
    const items: WorkItem[] = workCategories[category].items;
    const listHeight = 20 + items.reduce((height, item) => height + (item.caption ? 64 : 40), 0);
    const spotlight = root.closest(".dashboard-page")?.querySelector(".spotlight");
    const visibleBottom = spotlight?.getBoundingClientRect().top ?? window.innerHeight;
    const top = Math.max(0, Math.min(row.top - 7, Math.max(row.bottom, visibleBottom) - listHeight));
    setWork({ category, anchor, pinned, expanded, top: top - root.getBoundingClientRect().top, open: true });
    if (mode === "signals") setMode(null);
  }

  const dismiss = useCallback((restoreFocus: boolean) => {
    closeWork();
    returnFocus.current = restoreFocus ? mode : null;
    setMode(null);
  }, [closeWork, mode]);

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
    if (!mode && !activeWork) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const root = rootRef.current;
      if (!(target instanceof Element) || !root) return;
      const control = target.closest("[data-tasks-trigger]");
      if (control && root.contains(control)) return;
      const layer = target.closest("[data-tasks-layer][data-open='true']");
      if (layer && root.contains(layer)) return;
      dismiss(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeWork) {
          closeWork();
          activeWork.anchor.focus({ preventScroll: true });
        } else dismiss(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, activeWork, closeWork, dismiss]);

  function renderWorkRow(category: WorkCategoryId, expanded: boolean) {
    const { title, count, amount, important } = workSummary(category);
    return (
      <button
        key={category}
        className="tasks-cards-row"
        type="button"
        data-tasks-trigger={category}
        aria-expanded={activeWork?.category === category && activeWork.expanded === expanded}
        aria-controls={controls.work}
        onPointerEnter={event => {
          if (event.pointerType !== "touch") openWork(category, event.currentTarget, false, expanded);
        }}
        onPointerLeave={scheduleWorkClose}
        onClick={event => openWork(category, event.currentTarget, true, expanded)}
      >
        <span className="tasks-cards-row-label">{title}</span>
        <span className="tasks-cards-amount">{amount}</span>
        <span className={important ? "tasks-cards-count tasks-cards-count-important" : "tasks-cards-count"}>{count}</span>
      </button>
    );
  }

  return (
    <section
      ref={rootRef}
      className={`tasks tasks-flow${afterPanel ? " tasks-after-panel" : ""}`}
      aria-labelledby="tasks-title"
    >
      <TasksCards
        mode={mode}
        onToggle={next => {
          closeWork();
          setMode(current => current === next ? null : next);
        }}
        controls={controls}
        renderWorkRow={category => renderWorkRow(category, false)}
        workOpen={Boolean(activeWork)}
      />
      <div className="tasks-flow-overlay" data-tasks-layer="signals" data-open={mode === "signals"} inert={mode !== "signals"} aria-hidden={mode !== "signals"}>
        <TasksOptions id={controls.signals} />
      </div>
      <div
        className="tasks-flow-overlay"
        data-tasks-layer="work"
        data-expanded={work?.expanded}
        data-open={Boolean(activeWork)}
        style={{ top: work?.top }}
        inert={!activeWork}
        aria-hidden={!activeWork}
        onPointerEnter={cancelWorkClose}
        onPointerLeave={scheduleWorkClose}
      >
        <TasksOptions id={controls.work} items={workCategories[work?.category ?? "pay"].items} />
      </div>
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
          {workOrder.map(category => <li key={category}>{renderWorkRow(category, true)}</li>)}
        </ul>
        <button ref={hideRef} className="tasks-expanded-close" type="button" onClick={() => dismiss(true)}>
          Скрыть
          <img src="/assets/figma/tasks-flow/chevron-up.svg" width="20" height="20" alt="" />
        </button>
      </div>
    </section>
  );
}
