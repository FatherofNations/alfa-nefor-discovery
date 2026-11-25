"use client";

import { useEffect, useRef, useState } from "react";
import { creditLineOverdueAmount, creditRows, researchRows, researchScreens, type ResearchScreen } from "@/data/research";
import { completeResearchTask, useResearchProgress, type ResearchTask } from "@/lib/research-progress";
import { DASHBOARD_DATE, dayLabel, money } from "@/data/payments";
import { ResearchComplete, SnilsForm, TaskIntro } from "./ResearchDialogs";

const asset = "/assets/figma/";
const riskArt = (number: number) => asset + `research/risk-${number}.png`;

function Feed({ mode }: { mode: "sign" | "drafts" }) {
  const status = mode === "sign" ? "На подпись" : "Черновик";
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const term = search.trim().toLocaleLowerCase("ru");
  const rows = researchRows[mode].flatMap((row, index) =>
    [row.company, row.account, row.counterparty].join(" ").toLocaleLowerCase("ru").includes(term)
      ? [{ ...row, status, id: mode + index, date: index < 5 ? DASHBOARD_DATE : "2026-11-19" }]
      : []
  );

  const dates = [...new Set(rows.map(row => row.date))].sort().reverse();

  function download() {
    const lines = [["Дата", "Компания", "Счёт компании", "Контрагент", "Тип операции", "Статус", "Сумма"], ...rows.map(row => [row.date, row.company, row.account, row.counterparty, "Рублёвый платёж", row.status, money(row.amount, " ")])];
    const url = URL.createObjectURL(new Blob(["\ufeff", lines.map(line => line.map(cell => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "operations.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <>
      <div className="research-feed-tools">
        <span className="research-tag research-date"><img src={asset + "research/feed-calendar.svg"} width={16} height={16} alt="" />Период</span>
        <label className="search-field"><img src={asset + "search-icon.svg"} alt="" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Контрагент, ИНН, назначение платежа или номер счёта" aria-label="Поиск операций" /></label>
        <span className="general-filter research-feed-filter" role="img" aria-label={`Применены фильтры: ${status}, рублёвые платежи`}>
          <img className="research-feed-filter-background" src={asset + "research/feed-filters-active.svg"} alt="" />
          <img className="research-feed-filter-indicator" src={asset + "research/feed-filters-indicator.svg"} alt="" />
          <img className="research-feed-filter-icon" src={asset + "research/feed-filters-white.svg"} alt="" />
        </span>
        <button className="download-button" type="button" onClick={download}>Скачать<img src={asset + "chevron-right-white.svg"} className="chevron chevron-down" alt="" /></button>
      </div>
      <div className="research-feed-list">
        <p className="research-feed-note"><img src={asset + "research/feed-info.svg"} alt="" />Выберите период и счёт, чтобы увидеть обороты и остатки. При выборе нескольких счетов в одной валюте — покажем только обороты</p>
        <div className="operations-table research-operations">
        {dates.length === 0 && <p className="research-feed-count">Всего 0</p>}
        {dates.map(date => <section className="operation-day" key={date}>
          <div className="day-header"><h3>{dayLabel(date)}</h3>{date === dates[0] && <p className="research-feed-count">Всего {rows.length}</p>}<span /></div>
          {rows.filter(row => row.date === date).map(row => <div className="operation-row" key={row.id}>
            <div className="operation-main">
              <div className="operation-content">
                <label className="checkbox"><input type="checkbox" aria-label={`Выбрать операцию ${row.company}`} checked={checked.has(row.id)} onChange={event => {
                  const selected = event.target.checked;
                  setChecked(previous => { const next = new Set(previous); if (selected) next.add(row.id); else next.delete(row.id); return next; });
                }} />{checked.has(row.id) ? <img className="checkbox-mark" src={asset + "ops-table-checkbox-checked.svg"} width={20} height={20} alt="" /> : <span className="checkbox-mark checkbox-mark-empty" aria-hidden="true" />}</label>
                <div className="operation-info">
                  <div className="operation-counterparty">
                    <img className="company-logo" src={row.logo} width={52} height={52} alt="" />
                    <div className="operation-copy"><p className="operation-title">{row.company}</p><p className="operation-description">Рублёвый платёж</p></div>
                  </div>
                  <div className="operation-status" data-draft={row.status === "Черновик"}><span>{row.status}</span></div>
                  <div className="operation-amount">−{money(row.amount, "\u202f")} ₽</div>
                </div>
              </div>
              <p className="operation-number">{row.account}</p>
            </div>
            <span className="operation-border" />
          </div>)}
        </section>)}
        </div>
      </div>
    </>
  );
}

const creditColumns = ["№ договора", "Задолженность", "Ставка", "Дата платежа", "Сумма платежа", "Просрочено", "Отлагательное условие", "Дата начала", "Дата окончания"];

function Credit() {
  return (
    <>
      <div className="research-warning"><span><img src={asset + "research/credit-warning.svg"} alt="" /></span><strong>Просрочено {money(creditLineOverdueAmount, " ")} ₽</strong><img src={asset + "research/credit-chevron.svg"} alt="" /></div>
      <section className="research-credit-overview">
        <header>
          <div><p>Вам доступно</p><strong>1 000 000,00 ₽</strong> из 20 000 000,00 ₽</div>
          <div className="research-credit-actions"><span className="research-action">Новый транш</span><span className="research-action secondary">Новая выписка</span></div>
        </header>
        <dl>
          <div><dt>Задолженность</dt><dd>163 550,01 ₽</dd></div>
          <div><dt>Основной долг</dt><dd>163 550,01 ₽</dd></div>
          <div><dt>Проценты</dt><dd>16 770,40 ₽</dd></div>
          <div><dt>Неустойка</dt><dd>749,00 ₽</dd></div>
          <div><dt>Комиссия</dt><dd>749,00 ₽</dd></div>
          <div><dt>Действие договора</dt><dd>29.01.2024 – 29.01.2029</dd></div>
          <div><dt>Можно брать транши</dt><dd>До 29.07.2026</dd></div>
        </dl>
      </section>
      <section className="research-credit-tranches" aria-label="Транши">
        <div className="research-credit-tabs"><strong>Транши</strong><span>Заявки на транши</span><span>Договоры</span><span>Отправка документов</span><span>Отлагательные условия</span></div>
        <div className="research-filter-tags"><span className="research-tag">№ договора</span><span className="research-tag selected">Действующие</span><span className="research-tag">Закрытые</span></div>
        <p className="research-credit-count">Всего {creditRows.length}</p>
        <div className="research-table-scroll"><table className="research-table"><thead><tr>{creditColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{creditRows.map(([id, ...cells]) => <tr key={id}><th scope="row">{id}</th>{cells.map((value, index) => <td key={index}>{index === 5 ? <span className="research-credit-condition" data-kind={value.toLocaleLowerCase("ru").split(" ")[0]}>{value}</span> : value}</td>)}<td>12.04.2024</td><td>22.04.2025</td></tr>)}</tbody>
        </table></div>
      </section>
    </>
  );
}

const riskBenefits = [
  ["Управляйте рисками", "Мы отслеживаем риски по 7 критериям, включая платежи, налоги, остаток по счёту", "chart"],
  ["Предотвращайте блокировки", "Калькулятор покажет потенциальные риски компании в формате светофора", "shield"],
  ["Импортируйте платежи\nиз других банков", "Тогда точность расчётов будет выше", "bank"],
] as const;

const riskWarnings = [
  ["Неуплата налогов", "Изучим налоговую отчётность и оповестим о нарушениях"],
  ["Работа с ненадёжными контрагентами", "Сообщим оборот с компаниями в зоне риска"],
  ["Снятие наличных", "Подскажем, если вы превысите лимит за месяц"],
  ["Платежи без назначения", "Покажем подозрительные платежи и запросим по ним документы"],
] as const;

const counterpartyBars = [
  { label: "Продавцы", heights: [73, 15, 18, 9] },
  { label: "Покупатели", heights: [73, 11, 18, 28] },
];

const indicators = [
  ["Контрагенты", "Всё в порядке. Поддерживайте долю расчётов с надёжными контрагентами", "Покупатели · Продавцы"],
  ["Доля налогов", "Всё в порядке, пока доля более 0,9% от исходящего оборота", "1,2%"],
  ["Хозяйственные платежи", "Всё в порядке, пока доля более 10% от исходящего оборота", "15,2%"],
  ["Снятие наличных", "Всё в порядке, пока доля менее 30% от исходящего оборота", "15,2%"],
  ["Переводы физлицам", "Всё в порядке, пока доля менее 50% от исходящего оборота", "5,1%"],
  ["НДС в платежах", "Всё в порядке, доля входящих платежей с НДС меньше 70%", "Входящих 55% · Исходящих 22%"],
  ["Остаток по счёту", "Всё в порядке, пока доля более 10% от исходящего оборота", "15,19%"],
] as const;

function Risk({ connected, connect }: { connected: boolean; connect: () => void }) {
  if (connected) return (
    <>
      <div className="research-risk-tiles">
        <section className="research-panel research-risk-summary">
          <span className="research-risk-check"><img src={asset + "research/risk-check.svg"} alt="" /></span>
          <h2>Низкий риск ограничений 115-ФЗ</h2>
          <p>Действия компании не нарушают требования закона</p>
          <div className="research-risk-turnover">
            <div><p>Исходящий оборот за 30 дней</p><strong>300 000 ₽</strong></div>
            <div><p>Исходящий оборот за 90 дней</p><strong>600 000 ₽</strong></div>
          </div>
          <p className="research-risk-tax">Ваша система налогообложения — УСН/АУСН</p>
        </section>
        <article><h3>Учёт платежей из других банков</h3><p>Загружайте выписки, чтобы точнее определить риск</p></article>
        <article className="research-risk-expert"><h3>Консультация с экспертом</h3><p>Задайте любой вопрос</p><img src={asset + "research/risk-expert.png"} alt="" /></article>
        <article><h3>Рассчитайте риски блокировки по 115-ФЗ</h3><p>Калькулятор рисков</p></article>
        <article><h3>Узнайте больше о 115-ФЗ</h3><p>База знаний</p></article>
      </div>
      <section className="research-risk-indicators"><h2>Анализ индикаторов риска</h2>
        <div className="research-risk-tiles">{indicators.map(([title, description, value]) => <article key={title}><h3>{title} <span className="research-risk-ok"><img src={asset + "research/risk-indicator.svg"} alt="" /></span></h3><p>{description}</p>
          {title === "Контрагенты" ? <div className="research-counterparties">
            <ul aria-label="Категории контрагентов"><li>Надёжные</li><li>Требуют внимания</li><li>В зоне риска</li><li>Нет оценки</li></ul>
            <div className="research-risk-charts">{counterpartyBars.map(({ label, heights }) => <div key={label} className="research-risk-chart"><div aria-hidden="true">{heights.map((height, index) => <i key={index} style={{ height }} />)}</div><span>{label}</span></div>)}</div>
          </div> : <strong>{value}</strong>}</article>)}</div>
      </section>
    </>
  );

  return (
    <>
      <div className="research-risk-hero">
        <div><h1>Индикатор риска</h1><p>Защитим ваш бизнес от блокировок по 115-ФЗ.<br />Первый месяц бесплатно, дальше — 780 ₽ в месяц</p><button className="research-action" type="button" onClick={connect}>Подключить бесплатно</button></div>
        <img src={riskArt(1)} alt="" />
      </div>
      <div className="research-risk-benefits">
        {riskBenefits.map(([title, description, icon]) => (
          <article key={title}>
            <span className="research-risk-benefit-icon">
              <img src={asset + `research/risk-benefit-${icon}.svg`} width={32} height={32} alt="" />
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <section className="research-panel research-risk-warnings"><h2>О каких рисках предупредим</h2>
        <div className="research-cards two">{riskWarnings.map(([title, description], index) => <article key={title} className="research-illustrated"><div><h3>{title}</h3><p>{description}</p></div><img src={riskArt(index + 2)} alt="" /></article>)}</div>
      </section>
      <section className="research-panel research-risk-feature"><div><h2>Защитим от блокировок</h2><p>Покажем уровень риска по каждому индикатору и дадим рекомендации, которые помогут избежать блокировки счёта. Данные из выписки обновляются каждый день</p></div><img src={riskArt(6)} alt="" /></section>
      <section className="research-panel research-risk-feature research-risk-steps"><img src={riskArt(7)} alt="" /><div><h2>Как это работает</h2><ol className="research-steps"><li>Подключите сервис</li><li>Следите за индикаторами<p>Предупредим о росте риска по каждому</p></li><li>Минимизируйте риски<p>Следуйте рекомендациям, чтобы избежать блокировок</p></li></ol></div></section>
      <section className="research-panel"><h2>Частые вопросы</h2><ul className="research-list"><li>Что такое 115-ФЗ?</li><li>Сколько стоит услуга?</li><li>Какие виды бизнеса имеют средний уровень риска компании и это является нормой?</li><li>Где узнать больше информации про каждый индикатор?</li></ul></section>
      <section className="research-panel research-risk-cta"><h2>Подключите Индикатор риска</h2><p>Предупредим о росте риска и защитим от блокировок</p><button className="research-action" type="button" onClick={connect}>Подключить бесплатно</button></section>
    </>
  );
}

const rewardSections = [
  ["Рекомендации", [
    ["Защитить бизнес от блокировок", ""], ["Изучить тариф", ""], ["Создать платёж", ""],
    ["Установить приложение для бизнеса", ""], ["Пополнить счёт", ""], ["Узнать о возможностях бизнес-карты", ""],
  ]],
  ["Настроить банк", [
    ["Добавить сотрудника", "Дать доступ коллеге"], ["Заполнить СНИЛС", "Упростить подписание"], ["Изменить способ подписания", "На быстрый и надёжный"],
  ]],
  ["Полезное", [
    ["Всё нужное под рукой", "Тарифы, комиссии, данные о компании"], ["Познакомьтесь с Альфа-Манией", "Гарантированный бонус за выполнение задания и шанс выиграть до 300 000 ₽"],
    ["Бухгалтерия", "Поможем сформировать декларацию и сдать отчётность"], ["Альфа-Безопасность", "Сервисы для защиты бизнеса"],
  ]],
] as const;

const rewardArt = ["job-risk", "job-plan", "job-pay", "job-app", "job-topup", "job-card"];
const rewardGlyphs = ["employee", "snils", "signature"];
const usefulGlyphs = ["useful-bank", "", "useful-accounting", "useful-security"];

function Rewards() {
  const progress = useResearchProgress();
  const [intro, setIntro] = useState<ResearchTask | null>(null);
  const [archive, setArchive] = useState(false);
  return (
    <>
      <div className="research-heading">
        <h1>{researchScreens.rewards}</h1>
        <button className="research-archive" type="button" aria-pressed={archive} aria-controls="research-rewards-list" onClick={() => setArchive(value => !value)}>
          {archive ? researchScreens.rewards : <>Архив<img src={asset + "research/archive-underline.svg"} alt="" /></>}
        </button>
      </div>
      <div className="research-rewards-layout">
        <div id="research-rewards-list">
          {archive ? <section className="research-panel"><h2>Архив</h2><ul className="research-list">
            {progress.risk && <li>Защитить бизнес от блокировок · 500 получено</li>}
            {progress.snils && <li>Заполнить СНИЛС · Выполнено</li>}
          </ul></section> : rewardSections.map(([title, entries]) => <section key={title} className="research-reward-section"><h2>{title}</h2>
            <div className={`research-cards ${title === "Полезное" ? "four" : "three"}`}>{entries.map(([name, description], index) => {
              const task = name === "Заполнить СНИЛС" ? "snils" : name === "Защитить бизнес от блокировок" ? "risk" : null;
              const caption = task && progress[task] ? (task === "risk" ? "500 получено" : "Выполнено") : title === "Рекомендации" ? "+500 баллов" : description;
              const reward = title === "Рекомендации";
              const artwork = reward ? rewardArt[index] : title === "Настроить банк" ? rewardGlyphs[index] : usefulGlyphs[index];
              const body = <><strong>{name}</strong>{!reward && caption && <span>{caption}</span>}
                {reward && <span className="research-card-points">{task === "risk" && progress.risk ? "500 получено" : "500"}<img src={asset + "research/job-points.svg"} alt="баллов" /></span>}
                {artwork && <img className={reward ? "research-reward-art" : "research-reward-glyph"} src={asset + `research/${artwork}.${reward ? "png" : "svg"}`} alt="" />}
              </>;
              return task && !progress[task] ? <button className="research-reward" type="button" key={name} onClick={() => setIntro(task)}>{body}</button> : <article key={name}>{body}</article>;
            })}</div>
          </section>)}
        </div>
        <aside className="research-panel research-rewards-summary">
          <div><p>Этап обучения</p><h2>Стартовый</h2><img className="research-level-art" src={asset + "research/level.png"} alt="" /></div>
          <div className="research-level-progress" aria-hidden="true"><span /></div>
          <div><p>Получили за задания</p><div className="research-level-points"><strong>{progress.risk ? "12 500" : "12 000"}</strong><img src={asset + "research/level-points.svg"} alt="баллов" /><span>1 балл = 1 ₽</span></div></div>
        </aside>
      </div>
      {intro && <TaskIntro task={intro} close={() => setIntro(null)} />}
    </>
  );
}

const profileSections = [
  ["Личные данные", [
    ["Роль, контакты, паспортные данные", ""], ["Согласия и договоры", "Передача данных партнёрам"], ["Стать физлицом в Альфа-Банке", "Закажите карту для себя — откройте новые возможности для бизнеса"], ["Ограничения по 115-ФЗ", "Статус ограничений и история заявок"], ["Способы подписания", "Приложение, токен, смс-код"],
  ]],
  ["Моя компания", [
    ["Карточка компании", "Реквизиты и контакты, виды деятельности, руководители"], ["Пользователи и роли", "Создание и настройка пользователей, назначение ролей"], ["Маршруты подписания", "Создание стандартных и индивидуальных правил подписания"], ["Доверенности", "Оформление и отзыв доверенностей на представителя организации"], ["Вход и подписание", "Пароль, пин-код, дополнительная безопасность"], ["Мультибанк", "Объединение и управление счета из разных банков"], ["МЧД", "Добавление и проверка статуса машиночитаемой доверенности из ФНС"],
  ]],
  ["Настройки", [
    ["Безопасность", "Пароль, статус безопасности, индикатор риска, история действий"], ["Уведомления", "Настройка уведомлений об операциях по счетам, уведомления о документах"], ["Заявления", "Документы в НИБ по операциям юр лиц в офисе (кроме кассовых)"], ["Быстрый вход", "Установка и отключение способов быстрого входа"], ["Для физлиц", "Управление счетами в приложении для физлиц и в Альфа-Онлайн"],
  ]],
] as const;

const profileIcons = [
  [34893, 34894, 34895, 34896, 34897],
  [34901, 34902, 34903, 34904, 34905, 34906, 34907],
  [34911, 34912, 34913, 34914, 34915],
];

function Profile({ done, complete }: { done: boolean; complete: () => void }) {
  const [form, setForm] = useState<"pending" | "open" | "closed">("pending");
  useEffect(() => {
    if (done || form !== "pending") return;
    const timer = window.setTimeout(() => setForm("open"), 2000);
    return () => window.clearTimeout(timer);
  }, [done, form]);
  return (
    <>
      {profileSections.map(([title, groups], groupIndex) => <section className="research-profile-section" key={title}>
        {groupIndex > 0 && <h2>{title}</h2>}
        <div className="research-cards three">{groups.map(([label, summary], index) => {
          const content = <><span className="research-profile-glyph"><img src={asset + `research/profile-${profileIcons[groupIndex][index]}.svg`} alt="" /></span>
            <h3>{groupIndex === 0 && index === 0 ? title : label}</h3>
            <p>{groupIndex === 0 && index === 0 ? label : summary}</p>
          </>;
          if (groupIndex === 0 && index === 0) return done ? <article key={label}>{content}<span className="research-positive">СНИЛС · Выполнено</span></article>
            : <button className="research-profile-card" key={label} onClick={() => setForm("open")}>{content}</button>;
          return <article key={label}>{content}</article>;
        })}</div>
      </section>)}
      {form === "open" && !done && <SnilsForm save={() => { setForm("closed"); complete(); }} close={() => setForm("closed")} />}
    </>
  );
}

export default function ResearchScreens({ screen, openExpenses }: { screen: ResearchScreen; openExpenses: (trigger: HTMLButtonElement) => void }) {
  const progress = useResearchProgress();
  const [success, setSuccess] = useState(false);
  const completionTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(completionTimer.current), []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  function complete(task: ResearchTask) {
    completeResearchTask(task);
    window.clearTimeout(completionTimer.current);
    completionTimer.current = window.setTimeout(() => setSuccess(true), 2000);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const title = screen === "credit" ? "Кредитная линия № 07XW2L" : researchScreens[screen];
  return (
    <div className="research-content" data-screen={screen} data-connected={screen === "risk" && progress.risk}>
      {screen !== "rewards" && (screen !== "risk" || progress.risk) && <div className="research-heading"><h1>{title}</h1>
        {screen === "risk" && progress.risk && <p className="research-subscription">Подписка подключена</p>}
        {(screen === "sign" || screen === "drafts") && <button className="expenses-link" type="button" onClick={event => openExpenses(event.currentTarget)} aria-haspopup="dialog"><img className="icon" src={asset + "ops-title-db9bc.svg"} alt="" /><span>Расходы за месяц по категориям</span></button>}
      </div>}
      {screen === "risk" && progress.risk && <p className="research-risk-date">Дата обновления: 20.11.2026</p>}
      {(screen === "sign" || screen === "drafts") && <Feed mode={screen} />}
      {screen === "credit" && <Credit />}
      {screen === "risk" && <Risk connected={progress.risk} connect={() => complete("risk")} />}
      {screen === "profile" && <Profile done={progress.snils} complete={() => complete("snils")} />}
      {screen === "rewards" && <Rewards />}
      {success && <ResearchComplete close={() => setSuccess(false)} />}
    </div>
  );
}
