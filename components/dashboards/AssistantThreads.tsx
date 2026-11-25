import OctoberSummary from "./OctoberSummary";
import type { Ref } from "react";

export type AssistantTopic = "tasks" | "expenses";
export const threadAssets = "/assets/figma/assistant-threads/";

const threadNames = { tasks: "Сводка", expenses: "Расходы за месяц" };
const recentThreads = [
  "Исследование влияния удаленной работы на производительность",
  "Оценка эффективности рекламных кампаний в интернете",
  "Анализ поведения пользователей на сайте после запуска рекламы",
  "Оптимизация бюджета на основе конверсий и кликов",
  "Разработка стратегии контент-маркетинга для социальных сетей",
  "Влияние сезонности на продажи в электронной коммерции",
  "Методы повышения вовлеченности клиентов в мобильных приложениях",
  "Анализ конкурентоспособности бренда на локальном рынке",
  "Использование искусственного интеллекта для персонализации предложений",
];

const expenses = [
  ["Поставщики", "2\u205f240\u205f000"],
  ["ФОТ и подрядчик", "1\u205f320\u205f000"],
  ["Аренда", "710\u205f000"],
  ["Налоги и сборы", "547\u205f500"],
  ["Банк и комиссии", "42\u205f100"],
  ["Прочее", "98\u205f000"],
];

export function AssistantThreadMenu({ topic, home, onHome, onThread }: {
  topic: AssistantTopic;
  home: boolean;
  onHome: () => void;
  onThread: () => void;
}) {
  return (
    <aside className="assistant-nav" aria-label="Диалоги">
      <div className="assistant-nav-head">
        <span className="assistant-neural" aria-hidden="true">
          <img className="neural-shadow" src={threadAssets + "logo-shadow.svg"} alt="" />
          <img src={threadAssets + "logo.svg"} alt="" />
        </span>
        <strong>Альфа-Интеллект</strong>
      </div>
      <button className="assistant-new-dialog" type="button" onClick={onHome}>
        <img src={threadAssets + "new.svg"} alt="" />
        Новый чат
      </button>
      <details className="assistant-recent" open>
        <summary>Недавние<img src={threadAssets + "chevron.svg"} alt="" /></summary>
        <ul>
          <li>
            <button type="button" className="assistant-thread-current" aria-current={home ? undefined : "page"} onClick={onThread}>
              <span>{threadNames[topic]}</span>
            </button>
          </li>
          {recentThreads.map((title) => <li key={title} title={title}><span>{title}</span></li>)}
        </ul>
      </details>
    </aside>
  );
}

export function AssistantConversation({ topic, answerRef }: { topic: AssistantTopic; answerRef: Ref<HTMLDivElement> }) {
  const important = topic === "tasks";

  return (
    <>
      <div className="assistant-conversation">
        {!important && <div className="assistant-user">
          <span>Расходы за месяц по категориям</span>
          <span className="assistant-time">12:30</span>
        </div>}
        <div className="assistant-answer" key={topic} ref={answerRef}>
          {important ? <OctoberSummary /> : (
            <>
              <p className="assistant-answer-title">Расходы за ноябрь 2026</p>
              {expenses.map(([label, amount]) => <p className="assistant-dash-line" key={label}>{label}: {amount}{"\u2009₽"}</p>)}
              <p className="assistant-answer-total">Итого расходы: {"4\u205f967\u205f600\u2009₽"}</p>
              <p>Хочешь расскажу, сколько уходит на комиссии банка в разбивке по типам операций?</p>
            </>
          )}
          <div className="assistant-answer-actions">
            <button type="button" aria-label="Копировать ответ"><img src={threadAssets + "copy.svg"} alt="" /></button>
            <button type="button" aria-label="Нравится"><img src={threadAssets + "like.svg"} alt="" /></button>
            <button type="button" aria-label="Не нравится"><img src={threadAssets + "dislike.svg"} alt="" /></button>
          </div>
        </div>
      </div>
      <div className="assistant-footer">
        {!important && <img className="assistant-footer-glow" src={threadAssets + "expenses-glow.svg"} alt="" />}
        <label className="assistant-ask">
          {!important && <span className="assistant-ask-clip"><img src={threadAssets + "expenses-clip.svg"} alt="" /></span>}
          <input placeholder="Спросите что угодно" aria-label="Вопрос Альфа-Интеллекту" />
        </label>
      </div>
    </>
  );
}
