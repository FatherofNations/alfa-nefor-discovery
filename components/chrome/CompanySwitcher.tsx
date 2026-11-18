"use client";

import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useClientFullName } from "@/lib/client-name";

const ASSETS = "/assets/figma/company-switcher/";

const companies = [
  { name: "ООО «Умные и свободные»", inn: "540960870096", role: "Зарплатный специалист", rubles: "77 300", foreign: "10 000", currency: "$" },
  { name: "ООО «Калуга Трейд»", inn: "540960870888", rubles: "77 300", foreign: "10 000", currency: "$", more: "и ещё 2 валюты" },
  { name: "ИП Васильев А.И.", inn: "540960870018", rubles: "77 300", foreign: "10 000", currency: "$" },
  { name: "ООО «Циферблат»", inn: "540960870001", rubles: "12 000 240", foreign: "612 312", currency: "¥" },
];

type Company = typeof companies[number];
const defaultCompany = companies[0];
let selectedCompany = defaultCompany;
const listeners = new Set<() => void>();

function subscribeToCompany(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function selectCompany(company: Company) {
  if (selectedCompany === company) return;
  selectedCompany = company;
  listeners.forEach((listener) => listener());
}

const readCompany = () => selectedCompany;
const readDefaultCompany = () => defaultCompany;

function Amounts({ rubles, foreign, currency, more }: Pick<Company, "rubles" | "foreign" | "currency" | "more">) {
  return (
    <span className="company-switcher-amounts">
      <span>{rubles},00 ₽ </span>
      <span>{foreign},00 {currency} </span>
      {more && <span className="company-switcher-secondary">{more}</span>}
    </span>
  );
}

function CompanyPanel({ id, company, onDismiss }: { id: string; company: Company; onDismiss: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const clientFullName = useClientFullName();
  const titleId = `${id}-title`;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    document.documentElement.classList.add("company-switcher-open");
    return () => {
      dialog.close();
      document.documentElement.classList.remove("company-switcher-open");
    };
  }, []);

  const dismiss = () => {
    dialogRef.current?.close();
    onDismiss();
  };

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className="company-switcher"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom) dismiss();
      }}
    >
      <div className="company-switcher-header">
        <h2 id={titleId}>{clientFullName}</h2>
        <button className="company-switcher-close" type="button" aria-label="Закрыть панель компаний" onClick={dismiss}>
          <img src={`${ASSETS}close.svg`} width="24" height="24" alt="" />
        </button>
      </div>
      <div className="company-switcher-body">
        <section className="company-switcher-current" aria-label="Текущая компания">
          <div className="company-switcher-details">
            <div className="company-switcher-current-head">
              <div className="company-switcher-current-name">
                <span className="company-switcher-secondary">Компания</span>
                <h3>{company.name}</h3>
              </div>
              <span className="company-switcher-mark">
                <img src={`${ASSETS}briefcase.svg`} width="24" height="24" alt="" />
              </span>
            </div>
            <dl className="company-switcher-fields">
              <div><dt>ИНН</dt><dd>{company.inn}</dd></div>
              {company.role && <div><dt>Роль</dt><dd>{company.role}</dd></div>}
            </dl>
          </div>
          <div className="company-switcher-divider" />
          <div className="company-switcher-links">
            <div className="company-switcher-link">
              <div>Профиль<span>Личные данные, компания, настройки</span></div>
              <img src={`${ASSETS}chevron.svg`} width="24" height="24" alt="" />
            </div>
            <div className="company-switcher-link">
              <div>Тариф<span>Условия, смена и подписки</span></div>
              <img src={`${ASSETS}chevron.svg`} width="24" height="24" alt="" />
            </div>
          </div>
        </section>
        <section className="company-switcher-list-section" aria-labelledby={`${id}-companies`}>
          <div className="company-switcher-list-head">
            <h3 id={`${id}-companies`}>Компании</h3>
            <Amounts rubles="764 000" foreign="10 700" currency="$" />
          </div>
          <ul className="company-switcher-list">
            {companies.map((item) => (
              <li key={item.inn}>
                <button
                  type="button"
                  className="company-switcher-option"
                  aria-pressed={company === item}
                  onClick={() => { selectCompany(item); dismiss(); }}
                >
                  <span className="company-switcher-option-name">{item.name}</span>
                  <span className="company-switcher-option-inn"><span className="company-switcher-secondary">ИНН</span>{item.inn}</span>
                  <Amounts {...item} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <span className="company-switcher-scroll-thumb" aria-hidden="true" />
    </dialog>
  );
}

export default function CompanySwitcher({ className, children, flipKey }: {
  className: string;
  children: (companyName: string) => ReactNode;
  flipKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const company = useSyncExternalStore(subscribeToCompany, readCompany, readDefaultCompany);

  const closePanel = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={className}
        type="button"
        data-flip={flipKey}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`Сменить компанию: ${company.name}`}
        onClick={() => setOpen(true)}
      >
        {children(company.name)}
      </button>
      {open && <CompanyPanel id={id} company={company} onDismiss={closePanel} />}
    </>
  );
}
