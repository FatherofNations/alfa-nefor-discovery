"use client";

import { useState } from "react";
import { analytics, operationDays, opsPeriodLabel } from "@/data/demo";
import OperationRow from "./OperationRow";

const asset = "/assets/figma/";

export function downloadOperations() {
  const rows = operationDays.flatMap(day => day.rows.map(row => [day.date, row.title, row.description, row.amount, row.number]));
  const csv = ["Дата;Контрагент;Назначение;Сумма;Реквизиты", ...rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "vypiska.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function OperationsFeed({ standalone = false, openExpenses }: {
  standalone?: boolean;
  openExpenses: (trigger: HTMLButtonElement) => void;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const term = search.trim().toLocaleLowerCase("ru");

  function toggleChecked(id: string) {
    setChecked(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className={standalone ? "research-content" : "operations"} id="operations" aria-labelledby="operations-title"
      data-screen={standalone ? "operations" : undefined}>
      <div className={standalone ? "research-heading" : "operations-title"}>
        {standalone ? <h1 id="operations-title">Лента операций</h1> : (
          <button className="operations-title-main" type="button">
            <h2 id="operations-title">Лента операций</h2><img className="icon chevron chevron-right" src={asset + "tasks-78e10.svg"} alt="" />
          </button>
        )}
        <button className="expenses-link" type="button" onClick={event => openExpenses(event.currentTarget)} aria-haspopup="dialog">
          <img className="icon" src={asset + "ops-title-db9bc.svg"} alt="" /><span>Расходы за месяц по категориям</span>
        </button>
      </div>
      <div className="filters">
        <button className="date-filter" type="button">
          <img className="calendar-icon" src={asset + "calendar-icon.svg"} alt="" />
          <span>{opsPeriodLabel}</span>
          <span className="date-clear"><img className="clear-icon" src={asset + "clear-icon.svg"} alt="" /></span>
        </button>
        <label className="search-field">
          <img src={asset + "search-icon.svg"} alt="" />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Контрагент, ИНН, назначение платежа или номер счёта" aria-label="Поиск операций" />
        </label>
        <button className="general-filter" type="button" aria-label="Все фильтры"><img src={asset + "filter-icon.svg"} alt="" /></button>
        <button className="download-button" type="button" onClick={downloadOperations}>
          Скачать<img className="icon chevron chevron-down" src={asset + "chevron-right-white.svg"} alt="" />
        </button>
      </div>
      <div className="analytics">
        {analytics.map(item => <div className="analytics-card" key={item.label}>
          <div><img className="icon" src={asset + item.icon} alt="" /><span>{item.label}</span></div><strong>{item.amount}</strong>
        </div>)}
      </div>
      <div className="operations-table">
        {operationDays.map(day => {
          const rows = day.rows.filter(row => !term ||
            `${row.title} ${row.description} ${row.details ?? ""} ${row.number}`.toLocaleLowerCase("ru").includes(term));
          if (!rows.length) return null;
          return <section className="operation-day" key={day.date}>
            <div className="day-header"><h3>{day.date}</h3><span /></div>
            <div>{rows.map(operation => <OperationRow key={operation.id} operation={operation}
              checked={checked.has(operation.id)} onCheck={() => toggleChecked(operation.id)} />)}</div>
          </section>;
        })}
        {!standalone && <button className="show-more" type="button">Показать ещё</button>}
      </div>
    </section>
  );
}
