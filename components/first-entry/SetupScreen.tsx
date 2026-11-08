"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { getEntryRole, markEntered } from "@/lib/entry-session";

const PHRASES = ["Настраиваю главный экран...", "Расставляю счета по местам..."];
// Our tuning, not an Apple preset. Fully readable hold starts after the last word settles.
const WORD_MS = 700, BLUR_MS = 480, STAGGER_MS = 60, HOLD_MS = 2500;
const EXIT_MS = 480, OVERLAP_MS = 200, INTRO_DELAY_MS = 180;

export default function SetupScreen() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [activePhrase, setActivePhrase] = useState(0);
  const phraseRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useLayoutEffect(() => {
    const role = getEntryRole();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const running = new Set<Animation>();
    const waits = new Set<() => void>();
    const motionWaits = new Set<() => void>();
    const groups = phraseRefs.current.filter((e): e is HTMLParagraphElement => !!e);
    setLeaving(false);
    setActivePhrase(0);
    groups.forEach((g) => { g.dataset.wordState = "hidden"; });
    const wait = (ms: number, motion = false) => new Promise<void>((resolve) => {
      if (!ms || disposed) { resolve(); return; }
      const done = () => { clearTimeout(timer); waits.delete(done); motionWaits.delete(done); resolve(); };
      const timer = window.setTimeout(done, ms);
      waits.add(done);
      if (motion) motionWaits.add(done);
    });
    const animate = async (index: number, enter: boolean, introDelay = 0) => {
      if (disposed) return;
      const group = groups[index];
      group.dataset.wordState = enter ? "visible" : "hidden";
      if (media.matches) return;
      const start = document.timeline.currentTime;
      await Promise.all(Array.from(group.querySelectorAll<HTMLElement>(".entry-setup-word")).map(async (word, i) => {
        word.style.willChange = "opacity, transform, filter";
        const delay = enter ? introDelay + i * STAGGER_MS : 0;
        const main = word.animate(enter ? [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "none" },
        ] : [
          { opacity: 1, transform: "none", filter: "none" },
          { opacity: 0, transform: "translateY(-7px)", filter: "blur(6px)" },
        ], { duration: enter ? WORD_MS : EXIT_MS, delay,
          easing: enter ? "cubic-bezier(.22,1,.36,1)" : "cubic-bezier(.4,0,.2,1)", fill: "both" });
        const tracks = [main];
        if (enter) tracks.push(word.animate([{ filter: "blur(8px)" }, { filter: "none" }], {
          duration: BLUR_MS, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "both",
        }));
        tracks.forEach((a) => { running.add(a); a.startTime = start; });
        await Promise.all(tracks.map((a) => a.finished.catch(() => {})));
        if (disposed) return;
        tracks.forEach((a) => { running.delete(a); a.cancel(); });
        word.style.removeProperty("will-change");
      }));
    };
    const reduce = () => {
      if (!media.matches) return;
      // Commit the current target instantly; only motion waits collapse, never reading holds.
      running.forEach((a) => { try { a.finish(); } catch {} });
      Array.from(motionWaits).forEach((done) => done());
    };
    media.addEventListener("change", reduce);
    void (async () => {
      await animate(0, true, INTRO_DELAY_MS);
      if (disposed) return;
      await wait(HOLD_MS);
      if (disposed) return;
      const outgoing = animate(0, false);
      await wait(media.matches ? 0 : OVERLAP_MS, true);
      if (disposed) return;
      setActivePhrase(1);
      await Promise.all([outgoing, animate(1, true)]);
      if (disposed) return;
      await wait(HOLD_MS);
      if (disposed) return;
      setLeaving(true);
      await wait(media.matches ? 0 : 260, true);
      if (disposed) return;
      markEntered();
      router.replace(role === "accountant" ? "/accountant" : "/");
    })();
    return () => {
      disposed = true;
      media.removeEventListener("change", reduce);
      Array.from(waits).forEach((done) => done());
      running.forEach((a) => a.cancel());
      running.clear();
      groups.forEach((g) => {
        g.dataset.wordState = "hidden";
        g.querySelectorAll<HTMLElement>(".entry-setup-word").forEach((w) => w.style.removeProperty("will-change"));
      });
    };
  }, [router]);

  return (
    <div className={`entry-page entry-setup${leaving ? " is-leaving" : ""}`} data-phrase={activePhrase === 1 ? "second" : "first"}>
      <div className="entry-setup-bg" aria-hidden="true" />
      <div className="entry-setup-orb">
        <span className="entry-setup-orb-inner"><img src="/assets/figma/neural-sphere.svg" alt="" /></span>
      </div>
      {PHRASES.map((text, index) => (
        <p key={text} ref={(node) => { phraseRefs.current[index] = node; }}
          className={`entry-setup-text${index === 1 ? " entry-setup-text--second" : ""}`}
          data-word-state="hidden" role="status" aria-live="polite" aria-atomic="true"
          aria-label={text} aria-hidden={activePhrase !== index}>
          <span aria-hidden="true">{text.split(/(\s+)/).map((part, i) => /^\s+$/.test(part)
            ? part : <span className="entry-setup-word" key={i}>{part}</span>)}</span>
        </p>
      ))}
    </div>
  );
}
