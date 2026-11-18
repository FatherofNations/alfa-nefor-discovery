type TasksOptionsProps = {
  kind: "signals" | "work";
  id: string;
};

const signals = [
  { state: "overdue", status: "Просрочено", title: "Риск по ФЗ-115", caption: ["Счёт *3594"] },
  { state: "approved", status: "Одобрено", title: "Заявка на кредит", caption: ["Выберите тип лимита"] },
  { state: "tomorrow", status: "Завтра", title: "Кредитная линия", caption: ["от 03.06.26", "·", "1 332 000,00\u202F₽\u2009"] },
];

const work = [
  { title: "Рублёвые платежи", count: 1 },
  { title: "Валютные переводы", count: 1 },
  { title: "Реестры платежей", count: 1 },
  { title: "Проценты на остаток", caption: "Предложение от банка", count: 1 },
];

export default function TasksOptions({ kind, id }: TasksOptionsProps) {
  const isSignals = kind === "signals";
  return (
    <ul
      id={id}
      className="tasks-options"
      aria-label={isSignals ? "Сигналы" : "Дела в работе"}
    >
      {isSignals ? signals.map(({ state, status, title, caption }) => (
        <li className="tasks-options-signal" key={title} data-status={state}>
          <span className="tasks-options-status">{status}</span>
          <div className="tasks-options-copy">
            <span>{title}</span>
            <p className="tasks-options-signal-caption">
              {caption.map((part) => <span key={part}>{part}</span>)}
            </p>
          </div>
        </li>
      )) : work.map(({ title, caption, count }) => (
        <li className="tasks-options-work-item" key={title}>
          <div className="tasks-options-copy">
            <span>{title}</span>
            {caption && <span className="tasks-options-work-caption">{caption}</span>}
          </div>
          <span className="tasks-options-count">{count}</span>
        </li>
      ))}
    </ul>
  );
}
