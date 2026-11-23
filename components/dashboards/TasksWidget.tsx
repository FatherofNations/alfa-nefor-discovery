"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { featuredWork, workCategories, workOrder, workSummary, type WorkCategoryId, type WorkItem } from "@/data/work-tasks";
import TasksCards, { type TaskPopoverTrigger } from "./TasksCards";
import TasksOptions from "./TasksOptions";

type TasksMode = "signals" | "all";

const moreCount = workOrder
  .filter(category => !featuredWork.some(featured => featured === category))
  .reduce((total, category) => total + workSummary(category).count, 0);
type WorkPopover = {
  category: WorkCategoryId;
  anchor: HTMLButtonElement;
  open: boolean;
  expanded: boolean;
  top: number;
};

function workPopoverTop(root: HTMLElement, anchor: HTMLButtonElement, category: WorkCategoryId) {
  const items: WorkItem[] = workCategories[category].items;
  const height = 20 + items.reduce((total, item) => total + (item.caption || item.route ? 64 : 40), 0);
  const spotlight = root.closest(".dashboard-page")?.querySelector(".spotlight");
  const bottom = spotlight?.getBoundingClientRect().top ?? window.innerHeight;
  const top = Math.max(0, Math.min(anchor.getBoundingClientRect().top - 7, bottom - height));
  return top - root.getBoundingClientRect().top;
}

export default function TasksWidget({ afterPanel }: { afterPanel: boolean }) {
  const id = useId();
  const controls = { signals: `${id}-signals`, work: `${id}-work`, all: `${id}-all` };
  const [mode, setMode] = useState<TasksMode | null>(null);
  const expanded = mode === "all";
  const [work, setWork] = useState<WorkPopover | null>(null);
  const activeWork = work?.open ? work : null;
  const rootRef = useRef<HTMLElement>(null);
  const hideRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<TasksMode | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const pointerType = useRef("");
  const openedByHover = useRef(false);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
  }, []);

  const closePopover = useCallback(() => {
    cancelClose();
    setWork(current => current?.open ? { ...current, open: false } : current);
    setMode(current => current === "signals" ? null : current);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  function leavePopover(device: string) {
    if (device === "touch" || !openedByHover.current || (!activeWork && mode !== "signals")) return;
    cancelClose();
    closeTimer.current = window.setTimeout(closePopover, 220);
  }

  function openPopover(category: WorkCategoryId | "signals", anchor: HTMLButtonElement, hover: boolean) {
    const root = rootRef.current;
    if (!root) return;

    openedByHover.current = hover;
    if (category === "signals") {
      closePopover();
      setMode("signals");
      return;
    }
    cancelClose();
    setWork({ category, anchor, expanded, top: workPopoverTop(root, anchor, category), open: true });
    setMode(current => current === "signals" ? null : current);
  }

  function popoverTrigger(category: WorkCategoryId | "signals", isOpen: boolean): TaskPopoverTrigger {
    return {
      onPointerEnter: event => {
        if (event.pointerType !== "touch") openPopover(category, event.currentTarget, true);
      },
      onPointerLeave: event => leavePopover(event.pointerType),
      onPointerDown: event => { pointerType.current = event.pointerType; },
      onClick: event => {
        if (event.detail !== 0 && pointerType.current !== "touch") return;
        if (isOpen) closePopover();
        else openPopover(category, event.currentTarget, false);
      },
    };
  }

  const visibleAnchor = activeWork?.anchor;
  const visibleCategory = activeWork?.category;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !visibleAnchor || !visibleCategory) return;
    const updatePosition = () => {
      const top = workPopoverTop(root, visibleAnchor, visibleCategory);
      setWork(current => current?.anchor === visibleAnchor && current.top !== top ? { ...current, top } : current);
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visibleAnchor, visibleCategory]);

  const dismiss = useCallback((restoreFocus: boolean) => {
    closePopover();
    returnFocus.current = restoreFocus ? mode : null;
    setMode(null);
  }, [closePopover, mode]);

  useLayoutEffect(() => {
    if (expanded) {
      hideRef.current?.focus({ preventScroll: true });
    } else if (!mode && returnFocus.current) {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tasks-trigger="${returnFocus.current}"]`)
        ?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [expanded, mode]);

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
          closePopover();
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
  }, [mode, activeWork, closePopover, dismiss]);

  function renderWorkRow(category: WorkCategoryId, full: boolean) {
    const { title, count, amount, important } = workSummary(category);
    const content = <>
      <span className="tasks-cards-row-label">{title}</span>
      <span className="tasks-cards-amount">{amount}</span>
      <span className={important ? "tasks-cards-count tasks-cards-count-important" : "tasks-cards-count"}>{count}</span>
    </>;
    if (!count) return <div className="tasks-cards-row" aria-disabled="true">{content}</div>;
    const isOpen = activeWork?.category === category && activeWork.expanded === full;
    return (
      <button
        key={category}
        className="tasks-cards-row"
        type="button"
        data-tasks-trigger={category}
        aria-expanded={isOpen}
        aria-controls={controls.work}
        {...popoverTrigger(category, isOpen)}
      >
        {content}
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
        signalTrigger={popoverTrigger("signals", mode === "signals")}
        controls={controls}
        workOpen={Boolean(activeWork)}
        onSlide={() => {
          if (mode || activeWork) dismiss(false);
        }}
        workList={
          <div
            id={controls.all}
            className="tasks-work"
            data-tasks-layer="all"
            data-open={expanded}
          >
            {[false, true].map(full => (
              <div key={String(full)} className="tasks-work-pane" data-current={full === expanded}
                data-full={full} inert={full !== expanded} aria-hidden={full !== expanded}
                role={full ? "region" : undefined} aria-label={full ? "Все дела" : undefined}>
                <ul className="tasks-work-list">
                  {(full ? workOrder : featuredWork).map((category, index) => (
                    <li key={category} className="tasks-work-item"
                      style={{ "--work-row-y": `${(full ? -2 : 118) + index * 40}px` } as CSSProperties}>
                      {renderWorkRow(category, full)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button ref={hideRef} className="tasks-cards-row tasks-work-toggle" type="button"
              data-tasks-trigger="all" aria-expanded={expanded} aria-controls={controls.all}
              onClick={() => {
                if (expanded) dismiss(true);
                else {
                  closePopover();
                  setMode("all");
                }
              }}>
              <span className="tasks-cards-row-label">
                {expanded ? "Скрыть" : "Ещё"}
                <img src={expanded ? "/assets/figma/tasks-flow/chevron-up.svg" : "/assets/figma/tasks-flow/cards/more-chevron.svg"} width="20" height="20" alt="" />
              </span>
              {!expanded && <span className="tasks-cards-count">{moreCount}</span>}
            </button>
          </div>
        }
      />
      <div className="tasks-flow-overlay" data-tasks-layer="signals" data-open={mode === "signals"} inert={mode !== "signals"} aria-hidden={mode !== "signals"}
        onPointerEnter={cancelClose} onPointerLeave={event => leavePopover(event.pointerType)}>
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
        onPointerEnter={cancelClose}
        onPointerLeave={event => leavePopover(event.pointerType)}
      >
        <TasksOptions id={controls.work} items={workCategories[work?.category ?? "sign"].items} />
      </div>
    </section>
  );
}
