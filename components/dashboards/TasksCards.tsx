import type { ReactNode } from "react";

type Mode = "signals" | "work" | "all";

type TasksCardsProps = {
  mode: Mode | null;
  onToggle: (mode: Mode) => void;
  controls: Record<Mode, string>;
};

const existingAsset = (name: string) => `/assets/figma/tasks-v2-${name}`;
const flowAsset = (name: string) => `/assets/figma/tasks-flow/cards/${name}`;

function Progress({ prize = false }: { prize?: boolean }) {
  return (
    <span className={prize ? "tasks-cards-progress tasks-cards-progress-prize" : "tasks-cards-progress"}>
      <img className="tasks-cards-progress-stroke" src={prize ? flowAsset("prize-stroke.svg") : existingAsset("imgStroke.svg")} alt="" />
      <img className="tasks-cards-progress-fill" src={prize ? flowAsset("prize-progress.svg") : existingAsset("imgProgress.svg")} alt="" />
      {prize && <strong>20%</strong>}
    </span>
  );
}

function Highlight({ name }: { name: "signals" | "prize" }) {
  return (
    <span className={`tasks-cards-highlight tasks-cards-highlight-${name}`} aria-hidden="true">
      <span><img src={flowAsset(`${name}-highlight.svg`)} alt="" /></span>
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

function RowContent({ title, amount, count, important = false }: {
  title: string;
  amount: string;
  count: number;
  important?: boolean;
}) {
  return (
    <>
      <span className="tasks-cards-row-label">{title}</span>
      <span className="tasks-cards-amount">{amount}</span>
      <Count important={important}>{count}</Count>
    </>
  );
}

function Reward({ amount }: { amount: number }) {
  return (
    <span className="tasks-cards-reward">
      +{amount}<img src={flowAsset("reward.svg")} alt="баллов" />
    </span>
  );
}

function TaskCard({ title, children, graphic, prize = false }: {
  title: string;
  children: ReactNode;
  graphic: ReactNode;
  prize?: boolean;
}) {
  return (
    <article className="tasks-cards-task">
      <div className="tasks-cards-task-text">
        <p className="tasks-cards-task-title">{title}</p>
        <div className="tasks-cards-task-caption">{children}</div>
      </div>
      <div className="tasks-cards-graphic">{graphic}</div>
      {prize && (
        <>
          <span className="tasks-cards-prize-art" aria-hidden="true">
            <img src={existingAsset("imgContent.png")} alt="" />
          </span>
          <Highlight name="prize" />
        </>
      )}
    </article>
  );
}

function Artwork({ name, type }: { name: string; type: "tariff" | "cashback" | "protection" }) {
  return <img className={`tasks-cards-artwork tasks-cards-artwork-${type}`} src={existingAsset(name)} alt="" />;
}

function Glyph({ name }: { name: string }) {
  return <span className="tasks-cards-glyph"><img src={existingAsset(name)} alt="" /></span>;
}

export default function TasksCards({ mode, onToggle, controls }: TasksCardsProps) {
  return (
    <div className="tasks-cards" data-mode={mode ?? undefined}>
      <header className="tasks-cards-header">
        <h2 id="tasks-title">Мои дела</h2>
        <div className="tasks-cards-controls">
          <button className="tasks-cards-every-task" type="button" disabled>
            <Progress />
            <span>Все задания</span>
          </button>
          <div className="tasks-cards-arrows">
            <button type="button" aria-label="Предыдущие задания" disabled>
              <img src={existingAsset("imgFixer.svg")} alt="" />
            </button>
            <span className="tasks-cards-arrows-divider" aria-hidden="true">
              <img src={existingAsset("imgLine168.svg")} alt="" />
            </span>
            <button type="button" aria-label="Следующие задания" disabled>
              <img src={existingAsset("imgFixer1.svg")} alt="" />
            </button>
          </div>
        </div>
      </header>

      <div className="tasks-cards-body">
        <article className="tasks-cards-important" inert={mode === "all"}>
          <div className="tasks-cards-important-plate">
            <Highlight name="signals" />
            <button
              className="tasks-cards-signal"
              type="button"
              data-tasks-trigger="signals"
              aria-expanded={mode === "signals"}
              aria-controls={controls.signals}
              onClick={() => onToggle("signals")}
            >
              <span className="tasks-cards-signal-copy">
                <span className="tasks-cards-label">Важное</span>
                <span className="tasks-cards-signal-text">
                  <span>Требуют внимания</span>
                  <span>Риск по ФЗ-115 , кредит · Ещё 1</span>
                </span>
              </span>
              <Count important>{3}</Count>
            </button>
            <span className="tasks-cards-separator" aria-hidden="true" />
            <div className="tasks-cards-rows">
              <button
                className="tasks-cards-row"
                type="button"
                data-tasks-trigger="work"
                aria-expanded={mode === "work"}
                aria-controls={controls.work}
                onClick={() => onToggle("work")}
              >
                <RowContent title="Оплатить" amount={"1\u202f234\u202f567,00\u202f₽\u2009"} count={3} important />
              </button>
              <div className="tasks-cards-row">
                <RowContent title="Доработать" amount={"1 207,00\u202f₽\u2009"} count={1} />
              </div>
              <div className="tasks-cards-row">
                <RowContent title="Подписать" amount={"1 207,00\u202f₽\u2009"} count={3} />
              </div>
              <button
                className="tasks-cards-row"
                type="button"
                data-tasks-trigger="all"
                aria-expanded={mode === "all"}
                aria-controls={controls.all}
                onClick={() => onToggle("all")}
              >
                <span className="tasks-cards-row-label">
                  Ещё<img src={flowAsset("more-chevron.svg")} alt="" />
                </span>
                <Count>{3}</Count>
              </button>
            </div>
          </div>
          <span className="tasks-cards-stack" aria-hidden="true" />
        </article>

        <div className="tasks-cards-column">
          <TaskCard title="Изучить условия тарифа" graphic={<Artwork type="tariff" name="imgOnboardingCardImage.png" />}>
            <Reward amount={500} />
          </TaskCard>
          <TaskCard title="Выбрать категории кэшбэка" graphic={<Artwork type="cashback" name="imgOnboardingCardImage1.png" />}>
            <Reward amount={500} />
          </TaskCard>
          <TaskCard title="Изучить условия тарифа" graphic={<Glyph name="imgFixer2.svg" />}>
            <p>Дайте коллеге доступ</p>
          </TaskCard>
        </div>

        <div className="tasks-cards-column">
          <TaskCard title="Супер-приз за 5 заданий" prize graphic={<Progress prize />}>
            <Reward amount={2500} />
          </TaskCard>
          <TaskCard title="Защитить от блокировок" graphic={<Artwork type="protection" name="imgOnboardingCardImage2.png" />}>
            <Reward amount={500} />
          </TaskCard>
          <TaskCard title="Изучить условия тарифа" graphic={<Glyph name="imgFixer3.svg" />}>
            <p>Дополните профиль</p>
          </TaskCard>
        </div>
      </div>
    </div>
  );
}
