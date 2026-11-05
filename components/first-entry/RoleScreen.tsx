"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import EntryHeader from "./EntryHeader";
import { setEntryRole } from "@/lib/entry-session";

/* Ответ нейросети: текст приходит не целиком, а словами — каждое слово
   проявляется из блюра со своей задержкой (канон stream-reveal). Линии
   остаются блочными, поэтому ширина пузыря не скачет. */
function StreamedText({ lines, start }: { lines: string[]; start: number }) {
  let index = 0;
  return (
    <>
      {lines.map((line, lineIndex) => (
        <span className="entry-line" key={lineIndex}>
          {line.split(" ").map((word, wordIndex, words) => {
            const delay = start + index * 22;
            index += 1;
            return (
              <span className="entry-word" style={{ animationDelay: `${delay}ms` }} key={wordIndex}>
                {word}{wordIndex < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

export default function RoleScreen() {
  const router = useRouter();
  const picked = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const choose = (role: "entrepreneur" | "accountant") => {
    if (picked.current) return;
    picked.current = true;
    setEntryRole(role);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/setup");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => router.push("/setup"), 240);
  };

  return (
    <div className={`entry-page entry-role${leaving ? " is-leaving" : ""}`}>
      <div className="entry-role-bg" aria-hidden="true" />
      <EntryHeader />
      <div className="entry-role-stage">
      <h1 className="entry-role-heading">— Выберите вид главной</h1>
      <div className="entry-bubble entry-bubble-1">
        <StreamedText
          start={280}
          lines={[
            "Меняется только набор виджетов — остальные",
            "возможности банка будут доступны как обычно",
          ]}
        />
      </div>
      <div className="entry-bubble entry-bubble-2">
        <StreamedText
          start={760}
          lines={[
            "Вид главной можно изменить в любой",
            "момент на главной странице",
          ]}
        />
      </div>

      <div className="entry-role-cards">
        <button className="entry-role-card entry-role-card-pred" type="button" onClick={() => choose("entrepreneur")}>
          <span className="entry-role-card-text">
            <strong>Предприниматель</strong>
            <span>Легкий интерфейс<br />для ведения бизнеса</span>
          </span>
          <img className="entry-role-photo" src="/assets/first-entry/role-pred.png" alt="" />
        </button>
        <img className="entry-role-connector" src="/assets/first-entry/connector.svg" alt="" />
        <button className="entry-role-card entry-role-card-buh" type="button" onClick={() => choose("accountant")}>
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
