import type { WorkItem } from "@/data/work-tasks";

const signals = [
  { state: "overdue", status: "Просрочено", title: "Риск по ФЗ-115", caption: ["Счёт *3594"] },
  { state: "approved", status: "Одобрено", title: "Заявка на кредит", caption: ["Выберите тип лимита"] },
  { state: "tomorrow", status: "Завтра", title: "Кредитная линия", caption: ["от 18.11.26", "·", "1 332 000,00\u202F₽\u2009"] },
];

export default function TasksOptions({ id, items }: { id: string; items?: WorkItem[] }) {
  return (
    <ul
      id={id}
      className="tasks-options"
      aria-label={items ? "Дела в работе" : "Сигналы"}
    >
      {!items ? signals.map(({ state, status, title, caption }) => (
        <li className="tasks-options-signal" key={title} data-status={state}>
          <span className="tasks-options-status">{status}</span>
          <div className="tasks-options-copy">
            <span>{title}</span>
            <p className="tasks-options-signal-caption">
              {caption.map((part) => <span key={part}>{part}</span>)}
            </p>
          </div>
        </li>
      )) : items.map(({ title, caption, count, important }) => (
        <li className="tasks-options-work-item" key={title}>
          <div className="tasks-options-copy">
            <span>{title}</span>
            {caption && <span className="tasks-options-work-caption">{caption}</span>}
          </div>
          <span className={important ? "tasks-options-count is-important" : "tasks-options-count"}>{count}</span>
        </li>
      ))}
    </ul>
  );
}
