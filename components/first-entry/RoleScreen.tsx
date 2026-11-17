"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EntryHeader from "./EntryHeader";
import { setEntryRole } from "@/lib/entry-session";

/* Text stays static inside one animated bubble; line breaks preserve geometry. */
function BubbleText({ lines }: { lines: string[] }) {
  return <>{lines.map((line, i) => <span className="entry-line" key={i}>{line}</span>)}</>;
}

export default function RoleScreen() {
  const router = useRouter();
  const picked = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const exitAnimations = useRef<Animation[]>([]);
  useEffect(() => {
    router.prefetch("/setup");
    return () => {
      window.clearTimeout(leaveTimer.current);
      exitAnimations.current.forEach((a) => a.cancel());
    };
  }, [router]);


  const choose = () => {
    if (picked.current) return;
    picked.current = true;
    setEntryRole("entrepreneur");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/setup");
      return;
    }
    const page = pageRef.current;
    /* Preserve in-flight entrance values when a role is chosen very early. */
    page?.getAnimations({ subtree: true }).forEach((a) => { if (a.playState === "running") a.pause(); });
    exitAnimations.current = Array.from(page?.querySelectorAll(".entry-role-bg, .entry-header, .entry-role-heading, .entry-bubble, .entry-role-cards, .entry-role-sphere, .entry-role-sound") ?? []).map((el) => {
      const c = getComputedStyle(el);
      const frames = el.matches(".entry-role-bg")
        ? [{ opacity: c.opacity }, { opacity: 0 }]
        : [{ opacity: c.opacity, transform: c.transform, filter: c.filter }, { opacity: 0, transform: "translateY(-6px)", filter: "blur(2px)" }];
      return el.animate(frames, { duration: 240, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    });
    setLeaving(true);
    leaveTimer.current = window.setTimeout(() => router.push("/setup"), 260);
  };

  return (
    <div ref={pageRef} className={`entry-page entry-role${leaving ? " is-leaving" : ""}`}>
      <div className="entry-role-bg" aria-hidden="true" />
      <EntryHeader />
      <div className="entry-role-stage">
      <h1 className="entry-role-heading">— Выберите вид главной</h1>
      <div className="entry-bubble entry-bubble-1">
        <BubbleText
          lines={[
            "Меняется только набор виджетов — остальные",
            "возможности банка будут доступны как обычно",
          ]}
        />
      </div>
      <div className="entry-bubble entry-bubble-2">
        <BubbleText
          lines={[
            "Вид главной можно изменить в любой",
            "момент на главной странице",
          ]}
        />
      </div>

      <div className="entry-role-cards">
        <button className="entry-role-card entry-role-card-pred" type="button" onClick={choose}>
          <span className="entry-role-card-text">
            <strong>Предприниматель</strong>
            <span>Легкий интерфейс<br />для ведения бизнеса</span>
          </span>
          <img className="entry-role-photo" src="/assets/first-entry/role-pred.png" alt="" />
        </button>
        <img className="entry-role-connector" src="/assets/first-entry/connector.svg" alt="" />
        <button className="entry-role-card entry-role-card-buh" type="button" disabled>
          <span className="entry-role-card-text">
            <strong>Бухгалтер</strong>
            <span>Продвинутый интерфейс<br />для углубленной работы</span>
          </span>
          <img className="entry-role-photo" src="/assets/first-entry/role-buh.png" alt="" />
        </button>
      </div>

      <img className="entry-role-sphere" src="/assets/figma/neural-sphere.svg" alt="" />
      </div>
      <button className="entry-role-sound" type="button" aria-label="Включить звук">
        <img src="/assets/first-entry/ic-sound.svg" alt="" />
      </button>
    </div>
  );
}
