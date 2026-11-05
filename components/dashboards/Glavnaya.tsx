"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { useRouter } from "next/navigation";
import { analytics, menuItems, operationDays, taskCards, workItems, type Operation } from "@/data/demo";
import { AccountsPanel, SummaryPanel, TariffsPanel } from "@/components/dashboards/TabPanels";
import { hasEntered, resetEntry } from "@/lib/entry-session";

const asset = (name: string) => `/assets/figma/${name === "ops-table-ec6f5.png" ? name : name.replace(".png", ".webp")}`;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`icon ${className}`} src={asset(name)} alt="" aria-hidden="true" />;
}

function Indicator({ value, small = false }: { value: number; small?: boolean }) {
  return <span className={`indicator${small ? " indicator-small" : ""}`}>{value}</span>;
}

function Chevron({ direction = "right" }: { direction?: "right" | "down" }) {
  return <Icon name="tasks-78e10.svg" className={`chevron chevron-${direction}`} />;
}

function AccountRow({ label, value, info, muted, children }: {
  label: string;
  value?: string;
  info?: boolean;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="account-panel-row">
      <span className="account-panel-label">{label}{info && <img className="account-panel-info" src="/assets/figma/info-icon.svg" alt="" />}</span>
      <span className="account-panel-right">
        {value && <span className={`account-panel-amount${muted ? " muted" : ""}`}>{value}</span>}
        {children}
      </span>
    </div>
  );
}

function RoleChip({ role, open, onToggle, triggerRef }: {
  role: "entrepreneur" | "accountant";
  open: boolean;
  onToggle: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button className="person-select" type="button" ref={triggerRef} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
      <span className="person-avatar">
        {role === "entrepreneur"
          ? <img src="/assets/figma/person-avatar.png" srcSet="/assets/figma/person-avatar@2x.png 2x" alt="" />
          : <img className="person-avatar-photo" src="/assets/figma/role-accountant.png" alt="" />}
      </span>
      <span>{role === "entrepreneur" ? "Предприниматель" : "Бухгалтер"}</span>
    </button>
  );
}

function MenuItem({ label, icon, muted, loyalty, target }: {
  label: string;
  icon: string;
  muted?: boolean;
  loyalty?: boolean;
  target?: string;
}) {
  return (
    <button className="menu-item" type="button" data-target={target} onClick={target ? () => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }) : undefined}>
      <span className={`menu-item-icon${muted ? " muted" : ""}`}><Icon name={icon} /></span>
      <span>{label}</span>
      {loyalty && <span className="loyalty">100<Icon name="menu-a8252.svg" /></span>}
    </button>
  );
}

function CompanyLogo({ kind }: { kind: Operation["logo"] }) {
  if (kind === "bank") {
    return <span className="company-logo"><img src={asset("ops-table-255e8.png")} alt="" /></span>;
  }
  return (
    <span className="company-logo">
      <img className="company-logo-bg" src={asset("ops-table-75144.png")} alt="" />
      {kind === "company"
        ? <img className="company-logo-image" src={asset("ops-table-4c685.png")} alt="" />
        : <img className="company-logo-person" src={asset("ops-table-ec6f5.png")} alt="" />}
    </span>
  );
}

function OperationRow({ operation, checked, onCheck }: { operation: Operation; checked: boolean; onCheck: () => void }) {
  return (
    <div className={`operation-row${operation.details ? " operation-row-tall" : ""}`}>
      <div className="operation-main">
        <div className="operation-content">
          <label className={`checkbox${checked ? " checked" : ""}`}>
            <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Выбрать операцию ${operation.title}`} />
            {checked && <svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-9" stroke="white" strokeWidth="2" /></svg>}
          </label>
          <div className="operation-info">
            <div className="operation-counterparty">
              <CompanyLogo kind={operation.logo} />
              <div className="operation-copy">
                <p className="operation-title">{operation.title}</p>
                <p className="operation-description">{operation.description}{operation.details && <><br />{operation.details}</>}</p>
              </div>
            </div>
            <div className="operation-status"><span>{operation.status}</span></div>
            <div className={`operation-amount${operation.positive ? " positive" : ""}`}>{operation.amount}</div>
          </div>
          <button className="icon-button operation-more" type="button" aria-label="Действия с операцией"><Icon name="ops-table-da23c.svg" /></button>
        </div>
        <p className="operation-number">{operation.number}</p>
      </div>
      <span className="operation-border" />
    </div>
  );
}

const TABS = ["Ассистент", "Сводка", "Счета на главной", "Тарифы и подписки"];

/* Высота сцены вкладки = отступ + высота панели (включая field 36/40),
   чтобы смена вкладки анимировала height, а «Мои дела» ехали плавно. */
const TAB_HEIGHTS: Record<string, number> = {
  "Ассистент": 204,
  "Сводка": 424,
  "Счета на главной": 395,
  "Тарифы и подписки": 432,
};

export default function Glavnaya() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Ассистент");
  const logout = useCallback(() => {
    resetEntry();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!hasEntered()) router.replace("/login");
  }, [router]);
  const [shownTab, setShownTab] = useState("Ассистент");
  const [tabPhase, setTabPhase] = useState<"idle" | "out" | "in-prep" | "in">("idle");
  const tabTimers = useRef<number[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [capsule, setCapsule] = useState({ left: 0, width: 0, ready: false });
  const [capsuleSyncing, setCapsuleSyncing] = useState(false);
  const [counter, setCounter] = useState<"shown" | "hiding" | "gone">("shown");
  const [workOpen, setWorkOpen] = useState(false);
  const [taskOffset, setTaskOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [accountOpen, setAccountOpen] = useState(false);
  const workRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPanelRef = useRef<HTMLElement>(null);
  const accountCloseRef = useRef<HTMLButtonElement>(null);
  const closeAccount = useCallback(() => {
    setAccountOpen(false);
    accountTriggerRef.current?.focus();
  }, []);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantCloseRef = useRef<HTMLButtonElement>(null);
  const expensesRef = useRef<HTMLButtonElement>(null);
  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    expensesRef.current?.focus();
  }, []);
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState<"entrepreneur" | "accountant">("entrepreneur");
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const roleTriggerRef = useRef<HTMLButtonElement>(null);
  const closeRole = useCallback(() => {
    setRoleOpen(false);
    roleTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAccount();
    };
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountPanelRef.current?.contains(target)) return;
      if (accountTriggerRef.current?.contains(target)) return;
      setAccountOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    accountCloseRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [accountOpen, closeAccount]);

  useEffect(() => {
    if (!assistantOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAssistant();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    assistantCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [assistantOpen, closeAssistant]);

  useEffect(() => {
    if (!roleOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRole();
    };
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleMenuRef.current?.contains(target)) return;
      if (roleTriggerRef.current?.contains(target)) return;
      setRoleOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    roleMenuRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [roleOpen, closeRole]);

  useEffect(() => {
    const tabList = tabTimers.current;
    return () => tabList.forEach(clearTimeout);
  }, []);

  const changeTab = useCallback((tab: string) => {
    if (tab === activeTab) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveTab(tab);
      setShownTab(tab);
      setTabPhase("idle");
      return;
    }
    tabTimers.current.forEach(clearTimeout);
    tabTimers.current.length = 0;
    setActiveTab(tab);
    setTabPhase("out");
    tabTimers.current.push(window.setTimeout(() => {
      setShownTab(tab);
      setTabPhase("in-prep");
      tabTimers.current.push(window.setTimeout(() => setTabPhase("in"), 20));
      tabTimers.current.push(window.setTimeout(() => setTabPhase("idle"), 760));
    }, 240));
  }, [activeTab]);

  /* Счётчик скрывается, только если пользователь непрерывно пробыл на
     «Сводке» 3 секунды. Ушёл раньше — таймер снимается, при возврате
     отсчёт начинается заново. */
  useEffect(() => {
    if (counter !== "shown" || activeTab !== "Сводка") return;
    const hideId = window.setTimeout(() => {
      setCounter("hiding");
      window.setTimeout(() => setCounter("gone"), 220);
    }, 3000);
    return () => clearTimeout(hideId);
  }, [activeTab, counter]);

  const measureCapsule = useCallback(() => {
    const index = TABS.indexOf(activeTab);
    const nav = navRef.current;
    const btn = tabRefs.current[index];
    if (!nav || !btn) return;
    const rect = btn.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    setCapsule({ left: rect.left - navRect.left, width: rect.width, ready: true });
  }, [activeTab]);

  useEffect(() => {
    let alive = true;
    const run = () => { if (alive) measureCapsule(); };
    const raf = requestAnimationFrame(run);
    const raf2 = requestAnimationFrame(run);
    window.addEventListener("resize", run);
    document.fonts.ready.then(run).catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", run);
    };
  }, [measureCapsule]);

  useEffect(() => {
    const id = requestAnimationFrame(measureCapsule);
    return () => cancelAnimationFrame(id);
  }, [counter, measureCapsule]);

  /* Когда счётчик уходит, шапка табов плавно сужается (585→556) — капсулу
     ведём покадрово, иначе она разъедется с кнопкой на время перехода. */
  useEffect(() => {
    if (counter !== "gone") return;
    setCapsuleSyncing(true);
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      measureCapsule();
      if (performance.now() - start < 620) raf = requestAnimationFrame(tick);
      else setCapsuleSyncing(false);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCapsuleSyncing(false);
    };
  }, [counter, measureCapsule]);

  useEffect(() => {
    if (!workOpen) return;
    const close = (event: MouseEvent) => {
      if (!workRef.current?.contains(event.target as Node)) setWorkOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWorkOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [workOpen]);

  const toggleChecked = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const download = () => {
    const rows = operationDays.flatMap((day) => day.rows.map((row) => [day.date, row.title, row.description, row.amount, row.number]));
    const csv = ["Дата;Контрагент;Назначение;Сумма;Реквизиты", ...rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"))].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vypiska.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const filterRow = (row: Operation) => !normalizedSearch || `${row.title} ${row.description} ${row.details ?? ""} ${row.number}`.toLocaleLowerCase("ru").includes(normalizedSearch);

  return (
    <main className="dashboard-page">
      <aside className={`sidebar${accountOpen ? " sidebar-solid" : ""}`} aria-label="Основная навигация">
        <div className="sidebar-logo">
          <span className="logo-sign"><img src={asset("logo-sign.svg")} alt="" /></span>
          <img className="logo-wordmark" src={asset("logo-wordmark.svg")} alt="Альфа-Бизнес" />
        </div>
        <div className="sidebar-content">
          <div className="amounts">
            <button className="balance-cell" type="button" ref={accountTriggerRef} aria-expanded={accountOpen} aria-controls="account-details" onClick={() => setAccountOpen(true)}>
              <span className="balance-icon"><Icon name="rub-icon.svg" /></span>
              <span className="balance-copy"><strong>570 880,95 ₽</strong><span>1 счёт</span></span>
              <span className="balance-addon"><img className="bank-card-img" src="/assets/figma/bank-card.png" srcSet="/assets/figma/bank-card@2x.png 2x" alt="" /></span>
            </button>
            <div className="balance-cell">
              <span className="balance-icon"><Icon name="percent-icon.svg" /></span>
              <span className="balance-copy"><strong>5 000 000 ₽</strong><span>Кредит наличными</span></span>
              <span className="balance-addon"><Icon name="menu-ed006.svg" /></span>
            </div>
          </div>
          <div className="sidebar-menu-wrap">
            <div className="menu-divider"><span /></div>
            <nav className="menu-list">
              <div className="menu-main">
                {menuItems.map((item) => <MenuItem key={item.label} {...item} />)}
                <button className="menu-item menu-category" type="button">
                  <Icon name="menu-331ba.svg" /><span>Ещё</span>
                </button>
                <div className="menu-divider"><span /></div>
                {[{ label: "Госзакупки", icon: "menu-52c45.svg" }, { label: "Депозиты", icon: "menu-353cb.svg" }].map((item) => (
                  <button className="menu-item menu-secondary" type="button" key={item.label}>
                    <span className="menu-item-icon muted"><Icon name={item.icon} /></span><span>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar-buttons">
          <button className="icon-button" type="button" aria-label="Письма"><img src={asset("mail-icon.svg")} alt="" /></button>
          <button className="icon-button" type="button" aria-label="Уведомления"><img src={asset("notifications-icon.svg")} alt="" /></button>
        </div>
        <span className="vertical-divider" />
        <button className="company-account" type="button">
          <span className="account-avatar"><img src="/assets/figma/avatar-photo.png" alt="" /></span>
          <span><strong>ООО «Город Нагатино»</strong><small>Набокова А.Д.</small></span>
        </button>
        <span className="vertical-divider" />
        <RoleChip role={role} open={roleOpen} onToggle={() => setRoleOpen((open) => !open)} triggerRef={roleTriggerRef} />
        <span className="vertical-divider" />
        <button className="icon-button" type="button" aria-label="Выйти" onClick={logout}><img src={asset("logout-icon.svg")} alt="" /></button>
      </header>

      <div className="dashboard-content">
        <nav ref={navRef} className={`tabs${counter === "gone" ? " tabs-compact" : ""}`} aria-label="Разделы главной">
          {capsule.ready && <span className="tab-capsule" style={{ left: capsule.left, width: capsule.width, transition: capsuleSyncing ? "none" : undefined }} aria-hidden="true" />}
          {TABS.map((tab, i) => (
            <button ref={(el) => { tabRefs.current[i] = el; }} key={tab} type="button" className={`tab${activeTab === tab ? " active" : ""}`} onClick={() => changeTab(tab)} aria-pressed={activeTab === tab}>
              <span>{tab}</span>
              {tab === "Сводка" && counter !== "gone" && (
                <span className={`tab-counter${counter === "hiding" ? " hiding" : ""}`}><Indicator value={3} /></span>
              )}
            </button>
          ))}
        </nav>

        <div className={`tab-stage phase-${tabPhase}`} style={{ height: TAB_HEIGHTS[shownTab] }}>
        {shownTab === "Ассистент" && (<section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-heading"><span className="hero-dash">—</span><h1 id="hero-title">Анна, добрый день</h1></div>
            <div className="hero-subtitle">
              <p>Разберёмся, на что уходили деньги в этом году?</p>
              <button type="button"><Icon name="hero-6a06a.svg" /><span>Доходы и расходы</span></button>
            </div>
          </div>
          <div className="hero-actions">
            <div className="work-dropdown" ref={workRef}>
              <button className="hero-chip" type="button" onClick={() => setWorkOpen(!workOpen)} aria-expanded={workOpen}>
                <span>Дела в работе</span><Indicator value={4} /><Chevron direction="down" />
              </button>
              {workOpen && <div className="work-menu">{workItems.map(([label, value]) => <button type="button" key={label} onClick={() => setWorkOpen(false)} className={value === 0 ? "empty" : ""}><span>{label}</span><span className="work-count">{value}</span></button>)}</div>}
            </div>
            <button className="hero-chip" type="button"><Icon name="hero-92b54.svg" /><span>Себе в Альфу</span></button>
            <button className="hero-chip" type="button" onClick={download}><Icon name="hero-b373c.svg" /><span>Скачать выписку</span></button>
            <button className="hero-chip" type="button" onClick={() => fileRef.current?.click()}><Icon name="hero-c5c76.svg" /><span>Импорт платежей</span></button>
            <button className="hero-chip hero-chip-more" type="button">Ещё</button>
            <input ref={fileRef} className="visually-hidden" type="file" accept=".csv,.txt,.pdf" tabIndex={-1} />
          </div>
        </section>
        )}

        {shownTab === "Сводка" && <SummaryPanel />}
        {shownTab === "Счета на главной" && <AccountsPanel />}
        {shownTab === "Тарифы и подписки" && <TariffsPanel />}
        </div>

        <section className={`tasks${shownTab === "Ассистент" ? "" : " tasks-after-panel"}`} aria-labelledby="tasks-title">
          <button className="section-title" type="button"><h2 id="tasks-title">Мои дела</h2><Chevron /></button>
          <div className="tasks-viewport">
            <div className="tasks-track" style={{ transform: `translateX(-${taskOffset}px)` }}>
              <article className="task-card payment-card">
                <span className="overdue">Просрочено</span>
                <div className="payment-copy"><p>Платёж по&nbsp;кредиту</p><p>от 04.06.26<br />32 000,00 ₽</p></div>
                <div className="task-navigation"><span className="card-divider" /><div className="payment-controls">
                  <button type="button" aria-label="Предыдущий платёж"><Icon name="chevron-right-tertiary.svg" className="chevron chevron-prev" /></button>
                  <span className="slider-dots">{[0, 1, 2].map((dot) => <span key={dot} className={dot === 0 ? "current" : ""} />)}</span>
                  <button type="button" aria-label="Следующий платёж"><Icon name="chevron-right-primary.svg" className="chevron" /></button>
                </div></div>
              </article>
              <article className="task-card work-card">
                <div className="work-card-main"><img src={asset("task2-illustration.png")} alt="" /><p>Дела<br />в работе</p></div>
                <div className="task-navigation"><span className="card-divider" /><button className="resolve-button" type="button" onClick={() => setWorkOpen(true)}><Indicator value={4} small /><span>Разобрать</span></button></div>
              </article>
              {taskCards.map((card) => <article className="task-card action-card" key={card.title}>
                <div className="action-card-main"><span className={`task-illustration ${card.className}`}><img src={asset(card.image)} alt="" /></span><p>{card.title}</p></div>
                <div className="task-navigation"><span className="card-divider" /><button type="button" className="score">+500<Icon name="menu-a8252.svg" className="score-icon" /></button></div>
              </article>)}
            </div>
            <span className="tasks-fade" />
            <button className="task-next" type="button" aria-label={taskOffset ? "Показать начало списка" : "Следующая карточка"} onClick={() => setTaskOffset(taskOffset ? 0 : 48)}><Chevron /></button>
          </div>
        </section>

        <section className="operations" id="operations" aria-labelledby="operations-title">
          <div className="operations-title">
            <button className="operations-title-main" type="button">
              <h2 id="operations-title">Лента операций</h2><Chevron />
            </button>
            <button className="expenses-link" type="button" ref={expensesRef} onClick={() => setAssistantOpen(true)} aria-haspopup="dialog">
              <Icon name="ops-title-db9bc.svg" /><span>Расходы за месяц по категориям</span>
            </button>
          </div>
          <div className="filters">
            <button className="date-filter" type="button">
              <img className="calendar-icon" src={asset("calendar-icon.svg")} alt="" />
              <span>16.05.2024 – 28.05.2024</span>
              <span className="date-clear"><img className="clear-icon" src={asset("clear-icon.svg")} alt="" /></span>
            </button>
            <label className="search-field"><img src={asset("search-icon.svg")} alt="" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Контрагент, ИНН, назначение платежа или номер счёта" aria-label="Поиск операций" /></label>
            <button className="general-filter" type="button" aria-label="Все фильтры"><img src={asset("filter-icon.svg")} alt="" /></button>
            <button className="download-button" type="button" onClick={download}>Скачать<Icon name="chevron-right-white.svg" className="chevron chevron-down" /></button>
          </div>
          <div className="analytics">{analytics.map((item) => <div className="analytics-card" key={item.label}><div><Icon name={item.icon} /><span>{item.label}</span></div><strong>{item.amount}</strong></div>)}</div>
          <div className="operations-table">
            {operationDays.map((day) => {
              const rows = day.rows.filter(filterRow);
              if (!rows.length) return null;
              return <section className="operation-day" key={day.date}><div className="day-header"><h3>{day.date}</h3><span /></div><div>{rows.map((operation) => <OperationRow key={operation.id} operation={operation} checked={checked.has(operation.id)} onCheck={() => toggleChecked(operation.id)} />)}</div></section>;
            })}
            <button className="show-more" type="button">Показать ещё</button>
          </div>
        </section>
      </div>

      {roleOpen && (
        <div className="role-menu" role="menu" aria-label="Вид главной" ref={roleMenuRef} tabIndex={-1}>
          <div className="role-menu-top">
            <p className="role-menu-title">Вид главной</p>
            <div className="role-menu-list">
              <button className="role-option" type="button" role="menuitemradio" aria-checked={role === "entrepreneur"} onClick={() => { setRole("entrepreneur"); closeRole(); }}>
                <span className="role-avatar"><img src="/assets/figma/role-entrepreneur.png" alt="" /></span>
                <span className="role-copy"><strong>Предприниматель</strong><span>Легкий интерфейс для ведения бизнеса</span></span>
                {role === "entrepreneur" && <img className="role-check" src="/assets/figma/role-check.svg" alt="" />}
              </button>
              <button className="role-option" type="button" role="menuitemradio" aria-checked={role === "accountant"} onClick={() => { setRole("accountant"); setRoleOpen(false); router.push("/accountant"); }}>
                <span className="role-avatar"><img src="/assets/figma/role-accountant.png" alt="" /></span>
                <span className="role-copy"><strong>Бухгалтер</strong><span>Продвинутый интерфейс для работы с финансами</span></span>
                {role === "accountant" && <img className="role-check" src="/assets/figma/role-check.svg" alt="" />}
              </button>
            </div>
          </div>
          <div className="role-banner">
            <img className="role-banner-img" src="/assets/figma/role-banner.png" alt="" />
            <div className="role-banner-text">
              <div className="role-banner-head"><strong>Персонализированный банк</strong><span className="role-beta">БЕТА</span></div>
              <p>Мы уже подстроили главную под ваши задачи и дальше шаг за шагом будем делать сервис ещё удобнее именно для вас</p>
            </div>
          </div>
        </div>
      )}

      {accountOpen && (
        <section className="account-panel" id="account-details" role="dialog" aria-label="Детализация остатка" ref={accountPanelRef}>
          <div className="account-panel-head">
            <h2>Детализация остатка</h2>
            <button className="account-panel-close" type="button" aria-label="Закрыть детализацию" onClick={closeAccount} ref={accountCloseRef}>
              <img src="/assets/figma/close-icon.svg" alt="" />
            </button>
          </div>
          <div className="account-panel-body">
            <AccountRow label="Исходящий остаток" value={"570\u205f880,00\u2009₽"} info />
            <span className="account-panel-divider" />
            <AccountRow label="Фиксированный остаток" value={"0,00\u2009₽"} muted />
            <AccountRow label="Ожидает списания" value={"0,00\u2009₽"} muted />
            <AccountRow label="Арест" value={"0,00\u2009₽"} muted />
            <AccountRow label="Блокировка ФНС" value={"0,00\u2009₽"} muted />
            <div className="account-panel-subdivider"><p>Включить в доступный остаток</p></div>
            <AccountRow label="Остаток по овердрафту" value={"0,00\u2009₽"} muted>
              <span className="account-panel-switch" aria-hidden="true" />
            </AccountRow>
            <AccountRow label="Депозит">
              <button className="account-panel-link" type="button">Открыть</button>
            </AccountRow>
            <span className="account-panel-divider" />
            <AccountRow label="Доступный остаток" value={"570\u205f880,95\u2009₽"} info />
          </div>
          <button className="account-panel-cta" type="button">К счёту</button>
        </section>
      )}

      <div className="footer-fade" />
      <div className="viewport-strip" aria-hidden="true" />
      <section className="spotlight" aria-label="Альфа-Интеллект">
        <div className="spotlight-logo"><span className="neural-logo"><img className="neural-shadow" src={asset("spotlight-d6d2f.svg")} alt="" /><img src={asset("spotlight-dbc5c.svg")} alt="" /></span><strong>Альфа-Интеллект</strong></div>
        <div className="spotlight-body">
          <div className="assistant-input"><span className="paperclip"><img src={asset("paperclip-icon.svg")} alt="" /></span><input placeholder="Как открыть депозит" aria-label="Вопрос Альфа-Интеллекту" /><button type="button" aria-label="Развернуть Альфа-Интеллект"><Icon name="spotlight-69a3f.svg" /></button></div>
          <button className="support-button" type="button"><img src={asset("support-icon.svg")} alt="" /><span>Связь с банком</span><Indicator value={1} small /></button>
        </div>
      </section>

      {assistantOpen && (
        <section className="assistant" role="dialog" aria-modal="true" aria-label="Нейропомощник">
          <header className="assistant-topbar">
            <div className="assistant-brand">
              <span className="logo-sign"><img src={asset("logo-sign.svg")} alt="" /></span>
              <img className="logo-wordmark" src={asset("logo-wordmark.svg")} alt="Альфа-Бизнес" />
            </div>
            <div className="assistant-topbar-right">
              <button className="icon-button" type="button" aria-label="Письма"><img src={asset("mail-icon.svg")} alt="" /></button>
              <button className="icon-button" type="button" aria-label="Уведомления"><img src={asset("notifications-icon.svg")} alt="" /></button>
              <span className="vertical-divider" />
              <button className="company-account" type="button">
                <span className="account-avatar"><img src="/assets/figma/avatar-photo.png" alt="" /></span>
                <span><strong>ООО «Город Нагатино»</strong><small>Набокова А.Д.</small></span>
              </button>
            </div>
          </header>

          <aside className="assistant-nav">
            <div className="assistant-nav-head">
              <span className="assistant-neural"><img className="neural-shadow" src={asset("spotlight-d6d2f.svg")} alt="" /><img src={asset("spotlight-dbc5c.svg")} alt="" /></span>
              <strong>Нейропомощник</strong>
            </div>
            <div className="assistant-nav-list">
              <button className="assistant-nav-item" type="button"><img src="/assets/figma/ic-crown.svg" alt="" />Главная</button>
              <button className="assistant-nav-item active" type="button"><img src="/assets/figma/ic-clock.svg" alt="" />Чат</button>
            </div>
          </aside>

          <div className="assistant-chat">
            <button className="assistant-close" type="button" aria-label="Закрыть" onClick={closeAssistant} ref={assistantCloseRef}>
              <img src="/assets/figma/close-icon.svg" alt="" />
            </button>
            <div className="assistant-user">
              <span>Расходы за месяц по категориям</span>
              <span className="assistant-time">12:30</span>
            </div>
            <div className="assistant-answer">
              <p className="assistant-answer-title">Расходы за апрель 2026</p>
              <p>– Поставщики: {"2\u205f240\u205f000\u2009₽"}</p>
              <p>– ФОТ и подрядчик: {"1\u205f320\u205f000\u2009₽"}</p>
              <p>– Аренда: {"710\u205f000\u2009₽"}</p>
              <p>– Налоги и сборы: {"547\u205f500\u2009₽"}</p>
              <p>– Банк и комиссии: {"42\u205f100\u2009₽"}</p>
              <p>– Прочее: {"98\u205f000\u2009₽"}</p>
              <p className="assistant-answer-total">Итого расходы: {"4\u205f967\u205f600\u2009₽"}</p>
              <p>Хочешь расскажу, сколько уходит на комиссии банка в разбивке по типам операций?</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}