"use client";

/* Модалка «Имя клиента» — макет HL4PatufFZkyPKtx3LGivP, фрейм 136:21612:
   инстанс Company Details (hidden) и сам диалог 392×186 (get_metadata
   142:25944, get_design_context: gradient black→#666, border 1px white,
   radius 29, padding 20, gap 16; заголовок 14/18 regular, инпут 16/20 на
   rgba(255,255,255,.14) radius 16, кнопка 50 высотой, 14/18 medium black).

   Открытие — клавиша «/» (как просил пользователь) на дашбордах. Esc —
   закрыть, Enter в поле — сохранить, клик по фону — закрыть.
   Появление/скрытие — scale .92→1 + opacity в стиле самой тёмной панели. */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getClientFullName, setClientFullName } from "@/lib/client-name";

const DASHBOARD_ROUTES = new Set(["/", "/accountant"]);

export default function ClientNameModal() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const open = phase !== "closed";

  const canOpen = pathname !== null && DASHBOARD_ROUTES.has(pathname);

  const requestClose = useCallback(() => {
    setPhase("closing");
  }, []);

  /* «/» открывает модалку, если фокус не в поле ввода/редакторе */
  useEffect(() => {
    if (!canOpen || open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isSlash = event.key === "/" || event.code === "Slash";
      if (!isSlash || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as Element | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      setValue(getClientFullName());
      setPhase("open");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canOpen, open]);

  /* Esc и повторное «/» закрывают (если фокус не в поле — тогда «/» печатается),
     блокировка скролла страницы; closing → unmount. Автофокуса нет (просьба Ильи). */
  useEffect(() => {
    if (phase === "closed") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      const isSlash = event.key === "/" || event.code === "Slash";
      if (phase !== "open" || !isSlash || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as Element | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("name-modal-open");
    let closeId = 0;
    if (phase === "closing") {
      closeId = window.setTimeout(() => setPhase("closed"), 160); /* = длительность закрытия у Аниматора */
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("name-modal-open");
      if (closeId) window.clearTimeout(closeId);
    };
  }, [phase, requestClose]);

  const save = useCallback(() => {
    const next = value.trim();
    if (!next) return;
    setClientFullName(next);
    requestClose();
  }, [value, requestClose]);

  if (!open) return null;

  return (
    <div
      className={`name-modal-backdrop${phase === "closing" ? " is-closing" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="name-modal" role="dialog" aria-modal="true" aria-labelledby="client-name-title">
        <div className="name-modal-fields">
          <label className="name-modal-title" id="client-name-title" htmlFor="client-name-input">
            Имя клиента
          </label>
          <input
            ref={inputRef}
            id="client-name-input"
            className="name-modal-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
            placeholder="Фамилия Имя Отчество"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button className="name-modal-save" type="button" onClick={save}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
