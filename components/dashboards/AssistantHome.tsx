"use client";

/* Главная «Альфа-Интеллекта» (Figma 169:26226): приветствие, три карточки задач и поле ввода.
   Вёрстка flex/grid; координаты макета 1600×900 — эталон для pixel-diff. */

import { useLayoutEffect, useRef } from "react";

type HomeCard = { icon: string; title: string; text: string; balanced?: boolean };

const HOME_CARDS: HomeCard[] = [
  { icon: "ai-home-flash.svg", title: "Согласуйте заявку", text: "Заявка на кредит ожидает решения" },
  { icon: "ai-home-warning.svg", title: "Приближается срок оплаты налог", text: "28 октября" },
  { icon: "ai-home-bag.svg", title: "3 платежа ожидают оплаты", text: "Оплатите квитанции до 26 октября 2026", balanced: true },
];

const FIG = "/assets/figma/";

export default function AssistantHome({ greetingName, active = true, switching = false }: { greetingName: string; active?: boolean; switching?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clear = () => { tracksRef.current.forEach((a) => a.cancel()); tracksRef.current = []; };
    const expose = () => { if (media.matches) clear(); };
    media.addEventListener("change", expose);
    if (!active) {
      tracksRef.current.forEach((a) => { if (a.playState === "running" || a.pending) a.pause(); });
    } else if (media.matches) {
      clear();
    } else {
      // A fast reversal starts from the visible pose, never resetting visible cards to zero.
      const layer = root.closest(".assistant-view-layer");
      const continuing = !!layer && Number(layer.getAttribute("data-from-opacity") ?? getComputedStyle(layer).opacity) > .001;
      const targets = Array.from(root.querySelectorAll(".ai-home-head, .ai-home-card, .ai-home-search"));
      const starts = targets.map((e) => { const c = getComputedStyle(e); return continuing
        ? { opacity: c.opacity, transform: c.transform }
        : { opacity: "0", transform: "translateY(10px)" }; });
      clear();
      tracksRef.current = targets.map((e, i) => {
        const a = e.animate([starts[i], { opacity: "1", transform: "none" }], {
          duration: 460, delay: continuing ? 0 : i === 0 ? 0 : 100 + (i - 1) * 60,
          easing: "cubic-bezier(.22,1,.36,1)", fill: "both",
        });
        // Release compositing roots at rest: preserve the developer's glass pixels exactly.
        a.onfinish = () => a.cancel();
        return a;
      });
    }
    return () => media.removeEventListener("change", expose);
  }, [active]);
  useLayoutEffect(() => {
    // Outgoing cards freeze only while visible; release every paused track once hidden.
    if (!active && !switching) { tracksRef.current.forEach((a) => a.cancel()); tracksRef.current = []; }
  }, [active, switching]);
  useLayoutEffect(() => () => { tracksRef.current.forEach((a) => a.cancel()); tracksRef.current = []; }, []);
  return (
    <div className="ai-home" ref={rootRef}>
      <img className="ai-home-bg" src={`${FIG}ai-home-bg.png`} alt="" aria-hidden="true" />
      <div className="ai-home-body">
        <header className="ai-home-head">
          <h2 className="ai-home-title"><span className="ai-home-dash" aria-hidden="true">—</span>{greetingName}, дела идут хорошо</h2>
          <p className="ai-home-sub">Подготовил актуальную сводку по вашему бизнесу: 3 задачи требуют внимания</p>
        </header>
        <div className="ai-home-cards">
          {HOME_CARDS.map((card) => (
            <article className="ai-home-card" key={card.title}>
              <span className="ai-home-card-glass" aria-hidden="true" />
              <img className="ai-home-card-shape" src={`${FIG}ai-home-card.svg`} alt="" aria-hidden="true" />
              <span className="ai-home-card-icon" aria-hidden="true"><img src={`${FIG}${card.icon}`} alt="" /></span>
              <div className={`ai-home-card-copy${card.balanced ? " is-balanced" : ""}`}>
                <strong>{card.title}</strong>
                <span>{card.text}</span>
              </div>
              <button className="ai-home-card-go" type="button" aria-label={`Открыть: ${card.title}`}>
                <img src={`${FIG}ai-home-arrow.svg`} alt="" />
              </button>
            </article>
          ))}
        </div>
      </div>
      <div className="ai-home-search">
        <label className="assistant-ask">
          <span className="assistant-ask-clip"><img src={`${FIG}paperclip-icon.svg`} alt="" /></span>
          <input placeholder="Спросите что угодно" aria-label="Вопрос Альфа-Интеллекту" />
        </label>
      </div>
    </div>
  );
}
