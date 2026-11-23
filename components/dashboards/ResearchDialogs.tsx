"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { researchHref } from "@/data/research";
import type { ResearchTask } from "@/lib/research-progress";

const assets = "/assets/figma/research/";

export function ResearchDialog({ title, children, art, close, reveal = false, variant }: {
  title: string;
  children: ReactNode;
  art?: string;
  reveal?: boolean;
  variant?: "snils";
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return (
    <dialog ref={ref} aria-label={title} className="research-dialog" data-art={Boolean(art)} data-reveal={reveal} data-variant={variant}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.currentTarget === event.target) close(); }}>
      <div className="research-dialog-body">
        <button className="research-dialog-close icon-button" type="button" aria-label="Закрыть" onClick={close}><img src={assets + (variant === "snils" ? "snils-close.svg" : "close.svg")} alt="" /></button>
        {art && <img className="research-dialog-art" src={assets + art} alt="" />}
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function TaskIntro({ task, close }: {
  task: ResearchTask; close: () => void;
}) {
  const risk = task === "risk";
  return (
    <ResearchDialog title={risk ? "Оцените риски для вашего бизнеса" : "Заполните СНИЛС"} art={risk ? "risk-intro.png" : "snils-intro.png"} close={close}>
      <p>{risk ? "Узнайте, как сервис Индикатор риска поможет защитить бизнес от блокировок по 115-ФЗ" : "Это позволит вам подписывать быстрее платежи и документы с помощью УКЭП"}</p>
      {risk && <p>За это начислим 500 баллов в Альфа-Выгодно — это 500 ₽.</p>}
      <Link className="research-action" href={researchHref(risk ? "risk" : "profile")} onClick={close}>
        {risk ? "Узнать больше" : "В профиль"}
      </Link>
    </ResearchDialog>
  );
}

export function SnilsForm({ save, close }: { save: () => void; close: () => void }) {
  const [digits, setDigits] = useState("48273165910");
  return (
    <ResearchDialog title="Добавление СНИЛС" close={close} variant="snils" reveal>
      <p>Введите номер документа</p>
      <form onSubmit={event => { event.preventDefault(); if (digits.length === 11) save(); }}>
        <label className="research-field">
          <span>СНИЛС</span>
          <input autoFocus inputMode="numeric" autoComplete="off" value={digits} onChange={event => setDigits(event.target.value.replace(/\D/g, "").slice(0, 11))} />
        </label>
        <div className="research-actions">
          <button className="research-action" type="submit" disabled={digits.length !== 11}>Сохранить</button>
          <button className="research-action secondary" type="button" onClick={close}>Отменить</button>
        </div>
      </form>
    </ResearchDialog>
  );
}

export function ResearchComplete({ close }: { close: () => void }) {
  return (
    <ResearchDialog title="Задание выполнено" art="complete.png" close={close} reveal>
      <p>Продолжайте, чтобы узнать, какие ещё инструменты банка упростят работу вашего бизнеса</p>
      <div className="research-actions">
        <Link className="research-action" href="/" onClick={close}>На Главную</Link>
        <button className="research-action secondary" type="button" onClick={close}>Понятно</button>
      </div>
    </ResearchDialog>
  );
}
