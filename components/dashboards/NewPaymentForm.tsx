"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { accounts } from "@/data/accounts";
import { DASHBOARD_DATE, money } from "@/data/payments";
import { companies, selectCompany, useSelectedCompany } from "@/lib/company-selection";

const assets = "/assets/figma/new-payment/";
const paymentMethods = ["По реквизитам", "По номеру телефона", "По номеру карты", "Между своими счетами", "Исполнителю по РБСК"];
const recipientTypes = ["Юрлицо", "Физлицо", "В бюджет", "Самозанятый", "Нерезидент"];
const vatRates = ["Без НДС", "22%", "5%", "7%", "10%", "0%", "Своя ставка"];

function TextField({ label, hint, icon, className = "", ...input }: {
  label: string;
  hint?: string;
  icon?: "chevron" | "recipient-info" | "purpose-info";
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`payment-field ${className}`}>
      <span className="payment-control payment-text">
        <span className="payment-label">{label}</span>
        <input {...input} aria-label={label} placeholder={label} />
        {icon && <img className={`payment-control-icon payment-${icon}`} src={assets + icon + ".svg"} alt="" />}
      </span>
      {hint && <span className="payment-hint">{hint}</span>}
    </label>
  );
}

function SelectField({ label, value, options, onChange, className = "" }: {
  label: string;
  value: string;
  options?: readonly { value: string; label: string }[];
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`payment-field ${className}`}>
      <span className="payment-control payment-filled">
        <span className="payment-label">{label}</span>
        <span className="payment-value" aria-hidden={Boolean(options)}>{value}</span>
        <img className="payment-control-icon" src={assets + "chevron.svg"} alt="" />
        {options && <select aria-label={label} value={value} onChange={event => onChange?.(event.target.value)}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>}
      </span>
    </div>
  );
}

function DateField({ label, initial = "", required }: { label: string; initial?: string; required?: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <label className="payment-field">
      <span className={`payment-control${value ? " payment-filled" : ""}`}>
        <span className="payment-label">{label}</span>
        {value && <span className="payment-value" aria-hidden="true">{value.split("-").reverse().join(".")}</span>}
        <img className="payment-control-icon" src={assets + "calendar.svg"} alt="" />
        <input type="date" aria-label={label} required={required} value={value} onChange={event => setValue(event.target.value)} />
      </span>
    </label>
  );
}

const showBalance = (balance: number) => `${money(balance, "\u202f")}\u2009₽`;
const accountOptions = accounts.map(account => ({ value: account.number, label: `${account.purpose} ··${account.number.slice(-4)} — ${showBalance(account.balance)}` }));
const companyOptions = companies.map(company => ({ value: company.name, label: company.name }));

export default function NewPaymentForm() {
  const company = useSelectedCompany();
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0].number);
  const account = accounts.find(item => item.number === selectedAccount) ?? accounts[0];
  const [number, setNumber] = useState("123457");
  const [editNumber, setEditNumber] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [vat, setVat] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const numberEditRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="payment-content">
      <header className="payment-heading">
        <div className="payment-title">
          <h1 id="payment-title" ref={titleRef} tabIndex={-1}>Рублёвый платёж № {number}</h1>
          <button className="payment-edit-number" type="button" aria-label="Изменить номер платежа" ref={numberEditRef} onClick={() => setEditNumber(true)}>
            <img src={assets + "edit.svg"} alt="" />
          </button>
        </div>
        {editNumber && <input
          className="payment-number-input"
          aria-label="Номер платежа"
          inputMode="numeric"
          defaultValue={number}
          ref={input => input?.focus({ preventScroll: true })}
          onBlur={event => {
            const digits = event.target.value.replace(/\D/g, "");
            if (digits) setNumber(digits);
            setEditNumber(false);
          }}
          onKeyDown={event => {
            if (event.key === "Enter") numberEditRef.current?.focus();
            if (event.key === "Escape") {
              event.currentTarget.value = number;
              numberEditRef.current?.focus();
            }
          }}
        />}
        <div className="payment-methods" aria-label="Способ перевода">
          {paymentMethods.map((method, index) => <span key={method} aria-current={index === 0 ? "true" : undefined}>{method}</span>)}
        </div>
      </header>

      <div className="payment-columns">
        <form className="payment-form" aria-labelledby="payment-title" onSubmit={event => event.preventDefault()}>
          <section className="payment-card payment-sender">
            <div className="payment-card-heading">
              <h2>Отправитель</h2>
              <button className="payment-dotted-link payment-sender-link" type="button" disabled>Показать реквизиты</button>
            </div>
            <div className="payment-fields-row payment-sender-fields">
              <SelectField label="Компания" value={company.name} options={companyOptions} onChange={value => {
                const next = companies.find(item => item.name === value);
                if (next) selectCompany(next);
              }} />
              <SelectField label="КПП" value={company.inn === companies[0].inn ? "027801001" : "—"} />
            </div>
          </section>

          <section className="payment-card payment-recipient">
            <h2>Получатель</h2>
            <div className="payment-recipient-types" aria-label="Тип получателя">
              {recipientTypes.map(type => <span key={type} aria-current={type === "Физлицо" ? "true" : undefined}>{type}</span>)}
            </div>
            <div className="payment-field-stack">
              <TextField label="ФИО получателя*" autoComplete="off" required hint="Введите полностью, например, Иванов Иван Иванович" />
              <TextField label="ИНН" className="payment-narrow" inputMode="numeric" maxLength={12} />
              <TextField label="БИК или название банка*" className="payment-bank-field" required />
              <div className="payment-fields-row">
                <TextField label="Счёт получателя*" className="payment-narrow" icon="chevron" inputMode="numeric" maxLength={20} required />
                <TextField label="УИН/УИП" icon="recipient-info" inputMode="numeric" />
              </div>
            </div>
          </section>

          <section className="payment-card payment-amount-card">
            <div className="payment-card-group">
              <h2>Счёт списания и сумма</h2>
              <div className="payment-field-stack">
                <label className="payment-field">
                  <span className="payment-control payment-filled">
                    <span className="payment-label">Рублёвый счёт ··{account.number.slice(-4)}</span>
                    <span className="payment-value" aria-hidden="true">{showBalance(account.balance)}</span>
                    <img className="payment-control-icon" src={assets + "chevron.svg"} alt="" />
                    <select aria-label="Счёт списания" value={selectedAccount} onChange={event => setSelectedAccount(event.target.value)}>
                      {accountOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </span>
                </label>
                <TextField label="Сумма*" inputMode="decimal" required hint="Для расчёта комиссии заполните обязательные поля" />
              </div>
            </div>
            <div className="payment-card-group">
              <h3>Назначение и НДС</h3>
              <TextField label="Назначение платежа*" icon="purpose-info" required maxLength={210} value={purpose} onChange={event => setPurpose(event.target.value)} hint={`${purpose.length}/210 символов`} />
              <div className="payment-vat" role="group" aria-label="Ставка НДС">
                {vatRates.map(rate => <button key={rate} type="button" disabled={rate === "Своя ставка"} aria-pressed={rate === vat} onClick={() => setVat(rate)}>{rate}</button>)}
              </div>
            </div>
            <div className="payment-fields-row">
              <SelectField label="Код вида дохода (20)" value="Не указан" />
              <SelectField label="Код выплат (110)" value="Не указан" />
            </div>
          </section>

          <section className="payment-card payment-settings">
            <h2>Настройки отправки</h2>
            <div className="payment-field-stack">
              <div className="payment-fields-row payment-dates">
                <DateField label="Дата в документе*" initial={DASHBOARD_DATE} required />
                <DateField label="Отправить не ранее" />
              </div>
              <SelectField label="Срочность" value="Стандартный операционный день" />
              <SelectField label="Очередность" value="5" className="payment-narrow" />
              <label className="payment-toggle">
                <input type="checkbox" role="switch" />
                <span className="payment-switch-icon" aria-hidden="true"><img src={assets + "switch-off.svg"} alt="" /></span>
                Уведомить об исполнении платежа
              </label>
            </div>
          </section>

          <div className="payment-actions">
            <label className="payment-toggle">
              <input className="payment-post-check" type="checkbox" defaultChecked />
              <span className="payment-check-icon" aria-hidden="true"><img src={assets + "checked.svg"} alt="" /></span>
              Отправить платёж после подписания в банк
            </label>
            <div className="payment-action-buttons">
              <button className="payment-primary" type="button" disabled>Подписать</button>
              <button type="button" disabled>Сохранить на подпись</button>
              <button type="button" disabled>Предпросмотр</button>
              <button className="payment-more" type="button" aria-label="Другие действия" disabled><img src={assets + "more.svg"} alt="" /></button>
            </div>
          </div>
        </form>

        <aside className="payment-aside" aria-label="Информация о платеже">
          <div className="payment-hours">
            <p><strong>С 1:00 до 21:00 мск</strong> отправляем <span>платежи в другие банки</span></p>
            <button className="payment-dotted-link payment-hours-link" type="button" disabled>Подробнее</button>
          </div>
          <div className="payment-assistant">
            <img src={assets + "assistant.svg"} alt="" />
            <span>Когда платёж будет отправлен?</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
