import Link from "next/link";
import { researchHref, type ResearchScreen } from "@/data/research";
import type { WorkItem } from "@/data/work-tasks";

const signals: { state: string; status: string; title: string; caption: string[]; route?: ResearchScreen }[] = [
  { state: "overdue", status: "Просрочено", title: "Кредитная линия", caption: ["от 18.11.26", "·", "1 332 000,00 ₽"], route: "credit" },
  { state: "overdue", status: "Высокий", title: "Риск блокировки по 115-ФЗ", caption: [] },
  { state: "tomorrow", status: "Послезавтра", title: "Тариф «Стандартный»", caption: ["Счёт ··6235"] },
];

export default function TasksOptions({ id, items }: { id: string; items?: WorkItem[] }) {
  return (
    <ul
      id={id}
      className="tasks-options"
      aria-label={items ? "Дела в работе" : "Сигналы"}
    >
      {!items ? signals.map(({ state, status, title, caption, route }) => (
        <li className="tasks-options-signal" key={title} data-status={state}>
          <span className="tasks-options-status">{status}</span>
          <div className="tasks-options-copy">
            {route ? <Link href={researchHref(route)}>{title}</Link> : <span>{title}</span>}
            <p className="tasks-options-signal-caption">
              {caption.map((part) => <span key={part}>{part}</span>)}
            </p>
          </div>
        </li>
      )) : items.map(({ title, caption, count, important, route, amount }) => (
        <li className="tasks-options-work-item" key={title}>
          <div className="tasks-options-copy">
            {route ? <Link href={researchHref(route)}>{title}</Link> : <span>{title}</span>}
            {(caption || (route && amount)) && <span className="tasks-options-work-caption">{caption ?? amount?.toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + " ₽"}</span>}
          </div>
          <span className={important ? "tasks-cards-count tasks-cards-count-important" : "tasks-cards-count"}>{count}</span>
        </li>
      ))}
    </ul>
  );
}
