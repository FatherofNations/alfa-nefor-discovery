import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { money } from "@/data/payments";
import { creditLineOverdueAmount, researchHref } from "@/data/research";
import { useResearchProgress, type ResearchTask } from "@/lib/research-progress";
import { TaskIntro } from "./ResearchDialogs";

type Mode = "signals" | "all";
export type TaskPopoverTrigger = Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onPointerEnter" | "onPointerLeave" | "onPointerDown" | "onClick">;

type TasksCardsProps = {
  mode: Mode | null;
  signalTrigger: TaskPopoverTrigger;
  controls: Record<Mode, string>;
  workOpen: boolean;
  onSlide: () => void;
  workList: ReactNode;
};

const existingAsset = (name: string) => `/assets/figma/tasks-v2-${name}`;
const flowAsset = (name: string) => `/assets/figma/tasks-flow/cards/${name}`;

function Progress() {
  return (
    <span className="tasks-cards-progress">
      <img className="tasks-cards-progress-stroke" src={existingAsset("imgStroke.svg")} alt="" />
      <img className="tasks-cards-progress-fill" src={existingAsset("imgProgress.svg")} alt="" />
    </span>
  );
}

function Highlight() {
  return (
    <span className={"tasks-cards-highlight tasks-cards-highlight-signals"} aria-hidden="true">
      <span><img src={flowAsset("signals-highlight.svg")} alt="" /></span>
    </span>
  );
}

function Count({ children, important = false }: { children: number; important?: boolean }) {
  return (
    <span className={important ? "tasks-cards-count tasks-cards-count-important" : "tasks-cards-count"}>
      {children}
    </span>
  );
}

function Reward({ amount, received = false }: { amount: number; received?: boolean }) {
  const points = (
    <span className="tasks-cards-reward">
      {received ? amount : `+${amount}`}
      <img src={received ? researchAsset("widget-points-received.svg") : flowAsset("reward.svg")} alt="баллов" />
    </span>
  );
  return received ? <p className="tasks-cards-completed-status">{points}{" "}получено</p> : points;
}

function TaskCard({ title, children, graphic, completed = false, className, onOpen }: {
  title: string;
  children: ReactNode;
  graphic: ReactNode;
  completed?: boolean;
  className?: string;
  onOpen?: () => void;
}) {
  const classes = `tasks-cards-task${className ? ` ${className}` : ""}`;
  const body = <>
    <div className="tasks-cards-task-text">
      <p className="tasks-cards-task-title">{title}</p>
      <div className="tasks-cards-task-caption">{children}</div>
    </div>
    <div className="tasks-cards-graphic">{graphic}</div>
  </>;
  return onOpen ? <button className={`${classes} research-task-button`} type="button" onClick={onOpen}>{body}</button>
    : <article className={classes} data-completed={completed || undefined}>{body}</article>;
}

const widgetArt: Record<string, number> = {
  "Подключить индикатор риска": 1,
  "Пополнить счёт": 2,
  "Подписаться на платежи": 3,
  "Открыть налоговую копилку": 4,
  "Перевести на счёт физлица": 5,
  "Изучить зарплатный проект": 6,
  "Применить интернет-эквайринг": 7,
  "Установить приложение": 8,
};

const researchAsset = (name: string) => `/assets/figma/research/${name}`;

function Glyph({ name }: { name: string }) {
  return <span className="tasks-cards-glyph"><img src={researchAsset(name)} alt="" /></span>;
}

export default function TasksCards({ mode, signalTrigger, controls, workOpen, onSlide, workList }: TasksCardsProps) {
  const progress = useResearchProgress();
  const [intro, setIntro] = useState<ResearchTask | null>(null);
  const [edges, setEdges] = useState({ left: false, right: true });
  const carousel = useRef<HTMLDivElement>(null);
  const rewardRows = [
    ["Подключить индикатор риска", "Подписаться на платежи", "Перевести на счёт физлица", "Применить интернет-эквайринг"],
    ["Пополнить счёт", "Открыть налоговую копилку", "Изучить зарплатный проект", "Установить приложение"],
  ];
  if (progress.risk) {
    const queue = Array.from({ length: 8 }, (_, i) => rewardRows[i % 2][Math.floor(i / 2)]);
    queue.push(queue.shift()!);
    rewardRows[0] = queue.filter((_, i) => i % 2 === 0);
    rewardRows[1] = queue.filter((_, i) => i % 2 === 1);
  }
  const services = progress.snils ? ["Добавить сотрудника", "Изменить способ подписания", "Заполнить СНИЛС"] : ["Заполнить СНИЛС", "Добавить сотрудника", "Изменить способ подписания"];
  const serviceCaptions = ["Упростите подписание", "Дайте доступ коллеге", "Повысьте надёжность"];
  function move(direction: number) {
    const track = carousel.current;
    const first = track?.firstElementChild;
    if (!track || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollTo({ left: (Math.round(track.scrollLeft / step) + direction) * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return (
    <div className="tasks-cards" data-mode={mode} data-work-open={workOpen}>
      <header className="tasks-cards-header">
        <h2 id="tasks-title">Мои дела</h2>
        <div className="tasks-cards-controls">
          <Link className="tasks-cards-every-task" href={researchHref("rewards")}>
            <Progress />
            <span>Все задания</span>
          </Link>
          <div className="tasks-cards-arrows">
            <button type="button" aria-label="Предыдущие задания" onClick={() => move(-1)} disabled={!edges.left}>
              <img src={existingAsset(edges.left ? "imgFixer1.svg" : "imgFixer.svg")} alt="" />
            </button>
            <span className="tasks-cards-arrows-divider" aria-hidden="true">
              <img src={existingAsset("imgLine168.svg")} alt="" />
            </span>
            <button type="button" aria-label="Следующие задания" onClick={() => move(1)} disabled={!edges.right}>
              <img src={existingAsset(edges.right ? "imgFixer1.svg" : "imgFixer.svg")} alt="" />
            </button>
          </div>
        </div>
      </header>

      <div className="tasks-cards-body" data-fade-left={edges.left}>
        <div className="research-task-carousel" ref={carousel} aria-label="Задания" onScroll={event => {
          const track = event.currentTarget;
          const left = track.scrollLeft > 1;
          const right = track.scrollWidth - track.clientWidth - track.scrollLeft > 1;
          setEdges(current => current.left === left && current.right === right ? current : { left, right });
          onSlide();
        }}>
          <article className="tasks-cards-important">
            <div className="tasks-cards-important-plate" inert={mode === "all"} aria-hidden={mode === "all"}>
              <Highlight />
              <button
                className="tasks-cards-signal"
                type="button"
                data-tasks-trigger="signals"
                aria-expanded={mode === "signals"}
                aria-controls={controls.signals}
                {...signalTrigger}
              >
                <span className="tasks-cards-signal-copy">
                  <span className="tasks-cards-label">Просрочено</span>
                  <span className="tasks-cards-signal-text">
                    <span>Требуют внимания</span>
                    <span>Кредитная линия · {money(creditLineOverdueAmount, " ").replace(/,00$/, "")} ₽</span>
                  </span>
                </span>
                <Count important>{3}</Count>
              </button>
              <span className="tasks-cards-separator" aria-hidden="true" />
            </div>
            {workList}
            <span className="tasks-cards-stack" aria-hidden="true" />
          </article>

          {rewardRows[0].map((_, index) => {
            const service = services[index];
            const snils = service === "Заполнить СНИЛС";
            const snilsDone = snils && progress.snils;
            return <div className="tasks-cards-column" inert={workOpen || mode === "signals"} key={index}>
              {rewardRows.map(row => {
                const name = row[index];
                const risk = name === "Подключить индикатор риска";
                const completed = risk && progress.risk;
                const artwork = completed ? "widget-risk-complete.png" : `widget-${widgetArt[name]}.png`;
                return <TaskCard key={name} title={name} completed={completed}
                  className={name === "Применить интернет-эквайринг" ? "tasks-cards-task-acquiring" : undefined}
                  graphic={<img className="research-widget-art" src={researchAsset(artwork)} alt="" />}
                  onOpen={risk && !completed ? () => setIntro("risk") : undefined}>
                  <Reward amount={500} received={completed} />
                </TaskCard>;
              })}
              {service && <TaskCard title={service} completed={snilsDone}
                graphic={<Glyph name={snils ? (snilsDone ? "snils-complete.svg" : "snils.svg") : service === "Добавить сотрудника" ? "employee.svg" : "signature.svg"} />}
                onOpen={snils && !snilsDone ? () => setIntro("snils") : undefined}>
                {snilsDone ? <p className="tasks-cards-completed-status">Выполнено</p>
                  : <p>{serviceCaptions[["Заполнить СНИЛС", "Добавить сотрудника", "Изменить способ подписания"].indexOf(service)]}</p>}
              </TaskCard>}
            </div>;
          })}
        </div>
      </div>
      {intro && <TaskIntro task={intro} close={() => setIntro(null)} />}
    </div>
  );
}
