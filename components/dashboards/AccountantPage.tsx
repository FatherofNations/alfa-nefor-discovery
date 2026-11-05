"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BodyClass from "@/components/BodyClass";
import AppChrome from "@/components/chrome/AppChrome";
import AssistantBar from "@/components/chrome/AssistantBar";
import { ACCOUNTANT_HTML } from "./accountantHtml";
import { hasEntered, resetEntry, setEntryRole } from "@/lib/entry-session";

/* Дашборд бухгалтера — byte-perfect партиал из пресета @Main.
   Хром (AppChrome + SpotlightBar) и стили chrome.css/accountant.css здесь же,
   на отдельном роуте /accountant: у бухгалтера другой каркас (меню 248,
   шапка 56), поэтому основная главная не подмешивается. */

export default function AccountantPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.querySelector(".cur-content");
    if (!root) return;
    const onClick = (event: Event) => {
      const target = event.target as Element;
      /* табы «С чего начать»/«Сводка» — некликабельные: по нажатию ничего не
         меняется (ни активное состояние, ни текст) */
      const segBtn = target.closest(".cur-seg-btn");
      if (segBtn) {
        const buttons = [...document.querySelectorAll(".cur-seg-btn")];
        const hide = buttons.indexOf(segBtn) === 1;
        document.body.classList.toggle("cur-amounts-hidden", hide);
        document.querySelector<HTMLElement>(".cur-seg")?.style.setProperty("--seg-i", hide ? "1" : "0");
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const chip = document.querySelector<HTMLButtonElement>(".gate-content .chrome-person") ?? document.querySelector<HTMLButtonElement>(".chrome-person");
    if (!chip) return;
    const onChip = () => setMenuOpen((open) => !open);
    chip.addEventListener("click", onChip);
    return () => chip.removeEventListener("click", onChip);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if ((target as Element).closest?.(".chrome-person")) return;
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    menuRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  const goEntrepreneur = useCallback(() => {
    setMenuOpen(false);
    /* без этого чипса на главной предпринимателя оставалась «бухгалтерской»
       (неверная аватарка/подпись) — роль обязана переключиться */
    setEntryRole("entrepreneur");
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (!hasEntered()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const exit = document.querySelector<HTMLButtonElement>('.chrome-header [aria-label="Выйти"]');
    if (!exit) return;
    const onExit = () => {
      resetEntry();
      router.push("/login");
    };
    exit.addEventListener("click", onExit);
    return () => exit.removeEventListener("click", onExit);
  }, [router]);

  return (
    <>
      <BodyClass name="cur" />
      <AppChrome personLabel="Бухгалтер" />
      <main className="cur-main">
        <div className="cur-content" dangerouslySetInnerHTML={{ __html: ACCOUNTANT_HTML }} />
      </main>
      <AssistantBar label="Alpha Intellect" />

      {menuOpen && (
        <div className="role-menu cur-role" role="menu" aria-label="Вид главной" ref={menuRef} tabIndex={-1}>
          <div className="role-menu-top">
            <p className="role-menu-title">Вид главной</p>
            <div className="role-menu-list">
              <button className="role-option" type="button" role="menuitemradio" aria-checked={false} onClick={goEntrepreneur}>
                <span className="role-avatar"><img src="/assets/figma/role-entrepreneur.png" alt="" /></span>
                <span className="role-copy"><strong>Предприниматель</strong><span>Легкий интерфейс для ведения бизнеса</span></span>
              </button>
              <button className="role-option" type="button" role="menuitemradio" aria-checked onClick={() => setMenuOpen(false)}>
                <span className="role-avatar"><img src="/assets/figma/role-accountant.png" alt="" /></span>
                <span className="role-copy"><strong>Бухгалтер</strong><span>Продвинутый интерфейс для работы с финансами</span></span>
                <img className="role-check" src="/assets/figma/role-check.svg" alt="" />
              </button>
            </div>
          </div>
          <div className="role-banner">
            <img className="role-banner-img" src="/assets/figma/role-banner.png" alt="" />
            <div className="role-banner-text">
              <div className="role-banner-head"><strong>Персонализированный банк</strong><span className="role-beta">БЕТА</span></div>
              <p>Мы уже подстроили главную под ваши задачи и дальше шаг за шагом будем делать сервис ещё удобнее именно для вас</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
