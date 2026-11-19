"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import BodyClass from "@/components/BodyClass";
import AppChrome from "@/components/chrome/AppChrome";
import AssistantBar from "@/components/chrome/AssistantBar";
import { ACCOUNTANT_CARDS_HTML, ACCOUNTANT_FEED_HTML, ACCOUNTANT_OVERVIEW_HTML } from "./accountantHtml";
import { hasEntered, prepareDashboardRoleChange, resetEntry } from "@/lib/entry-session";

/* Дашборд бухгалтера — byte-perfect партиал из пресета @Main.
   Хром (AppChrome + SpotlightBar) и стили chrome.css/accountant.css здесь же,
   на отдельном роуте /accountant: у бухгалтера другой каркас (меню 248,
   шапка 56), поэтому основная главная не подмешивается. */

// Предпочтение сохраняется при смене вида главной в пределах открытого документа.
let amountsHidden = false;
const amountListeners = new Set<() => void>();
const readAmountsHidden = () => amountsHidden;
const readInitialAmountsHidden = () => false;

function subscribeAmountsHidden(listener: () => void) {
  amountListeners.add(listener);
  return () => { amountListeners.delete(listener); };
}

function setAmountsHidden(hidden: boolean) {
  amountsHidden = hidden;
  for (const listener of amountListeners) listener();
}

export default function AccountantPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideAmounts = useSyncExternalStore(subscribeAmountsHidden, readAmountsHidden, readInitialAmountsHidden);

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
    router.push(prepareDashboardRoleChange("entrepreneur"), { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!hasEntered()) router.replace("/login");
  }, [router]);

  const logout = () => {
    resetEntry();
    router.push("/login");
  };

  return (
    <>
      <BodyClass name="cur" />
      <AppChrome personLabel="Бухгалтер" roleMenuOpen={menuOpen} onRoleClick={() => setMenuOpen((open) => !open)} onLogout={logout} />
      <main className="cur-main">
        <div className="cur-content" data-amounts-hidden={hideAmounts}>
          <div className="cur-static" dangerouslySetInnerHTML={{ __html: ACCOUNTANT_OVERVIEW_HTML }} />
          <section className="cur-tablo-section">
            <div className="cur-tablo">
              <div className="cur-tablo-tabs">
                <span className="cur-tab active">С чего начать</span>
                <span className="cur-tab">Сводка</span>
                <span className="cur-tab">Счета на главной</span>
                <span className="cur-tab">Обзор отрасли</span>
              </div>
              <div className="cur-tablo-ctrl">
                <div className="cur-seg">
                  <span className="cur-seg-hl" />
                  <button className="cur-seg-btn" type="button" aria-label="Показать суммы" aria-pressed={!hideAmounts} onClick={() => setAmountsHidden(false)}>
                    <img src="/assets/accountant/curTabloEye.svg" width="28" height="28" alt="" />
                  </button>
                  <button className="cur-seg-btn" type="button" aria-label="Скрыть суммы" aria-pressed={hideAmounts} onClick={() => setAmountsHidden(true)}>
                    <img src="/assets/accountant/curTabloEyeOff.svg" width="28" height="28" alt="" />
                  </button>
                </div>
                <span className="cur-tablo-gear"><img src="/assets/accountant/curTabloGear.svg" width="20" height="20" alt="" /></span>
              </div>
            </div>
            <div className="cur-cards" dangerouslySetInnerHTML={{ __html: ACCOUNTANT_CARDS_HTML }} />
          </section>
          <div className="cur-static" dangerouslySetInnerHTML={{ __html: ACCOUNTANT_FEED_HTML }} />
        </div>
      </main>
      <AssistantBar />

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
