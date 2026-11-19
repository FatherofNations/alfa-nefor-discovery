"use client";

/* Модалка «Имя клиента» — макет HL4PatufFZkyPKtx3LGivP, фрейм 136:21612:
   инстанс Company Details (hidden) и сам диалог 392×186 (get_metadata
   142:25944, get_design_context: gradient black→#666, border 1px white,
   radius 29, padding 20, gap 16; заголовок 14/18 regular, инпут 16/20 на
   rgba(255,255,255,.14) radius 16, кнопка 50 высотой, 14/18 medium black).

   Открытие — клавиша «/» на всех экранах. Esc —
   закрыть, Enter в поле — сохранить, клик по фону — закрыть.
   Появление/скрытие — scale .92→1 + opacity в стиле самой тёмной панели. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getClientFullName, setClientFullName } from "@/lib/client-name";
import { canUsePrototypeShortcut } from "@/lib/prototype-shortcuts";

export default function ClientNameModal() {
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [value, setValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const open = phase !== "closed";

  const requestClose = useCallback(() => {
    setPhase("closing");
  }, []);

  /* «/» открывает модалку, если фокус не в поле ввода/редакторе */
  useEffect(() => {
    if (open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isSlash = event.key === "/" || event.code === "Slash";
      if (!isSlash || event.repeat || !canUsePrototypeShortcut(event) || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      setValue(getClientFullName());
      setPhase("open");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    document.body.classList.add("name-modal-open");
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.classList.remove("name-modal-open");
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open]);

  /* Esc и повторное «/» закрывают диалог. В поле «/» вводится как текст. */
  useEffect(() => {
    if (phase === "closed") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const active = document.activeElement;
        const first = inputRef.current;
        const last = saveRef.current;
        if ((event.shiftKey ? active === first : active === last) || active === dialogRef.current
          || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      const isSlash = event.key === "/" || event.code === "Slash";
      if (phase !== "open" || !isSlash || event.repeat || !canUsePrototypeShortcut(event)) return;
      event.preventDefault();
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    let closeId = 0;
    if (phase === "closing") {
      closeId = window.setTimeout(() => setPhase("closed"), 160); /* = длительность закрытия у Аниматора */
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
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
      <div ref={dialogRef} className="name-modal" role="dialog" aria-modal="true" aria-labelledby="client-name-title" tabIndex={-1}>
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
        <button ref={saveRef} className="name-modal-save" type="button" onClick={save}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
