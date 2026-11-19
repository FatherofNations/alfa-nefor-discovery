/* Единый источник платежей для обеих ролей. Предприниматель и бухгалтер
   показывают одни и те же операции, отличается только представление:
   лента по дням (data/demo.ts → Glavnaya) и таблица (accountantHtml.ts).
   Период — 1–15 декабря 2026. Обороты считаются из этих же платежей, а
   исходящий остаток берётся из общего справочника счетов. */

import { accountsTotal } from "./accounts";

export type Payment = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  purpose: string;
  details?: string;
  amount: number; // копейки не храним отдельно: рубли с дробной частью
  docNumber: string;
  bank: string;
  account: string;
  logo: "company" | "person" | "bank";
};

export const OPS_PERIOD = { from: "2026-12-01", to: "2026-12-15" } as const;

export const payments: Payment[] = [
  { id: "1184", date: "2026-12-15", title: "ООО «Ромашка Логистик»", purpose: "Оплата по счёту №412 от 08.12.2026 за транспортно-экспедиционные услуги. НДС 20%", amount: 186400, docNumber: "1184", bank: "Сбербанк", account: "4417", logo: "company" },
  { id: "88412", date: "2026-12-15", title: "АО «Альфа-Банк»", purpose: "Комиссия за ведение счёта за декабрь 2026", details: "Согласно тарифам Банка", amount: -1990, docNumber: "88412", bank: "Альфа-Банк", account: "5370", logo: "bank" },
  { id: "214", date: "2026-12-12", title: "ООО «Офис-Снаб»", purpose: "Оплата по счёту №2231 от 10.12.2026 за канцелярские товары. НДС 20%", amount: -18750, docNumber: "214", bank: "ВТБ", account: "0821", logo: "company" },
  { id: "213", date: "2026-12-12", title: "ПАО «Ростелеком»", purpose: "Оплата услуг связи и интернета за декабрь 2026 по договору №123 от 03.02.2025. НДС 20%", amount: -3490, docNumber: "213", bank: "Газпромбанк", account: "3310", logo: "company" },
  { id: "5521", date: "2026-12-10", title: "ООО «Вектор»", purpose: "Предоплата 50% по договору поставки №27/11 от 28.11.2026. НДС 20%", amount: 94000, docNumber: "5521", bank: "Т-Банк", account: "9909", logo: "company" },
  { id: "212", date: "2026-12-08", title: "УФК по г. Москве (ФНС России)", purpose: "Единый налоговый платёж", amount: -42618, docNumber: "212", bank: "Казначейство России", account: "0101", logo: "bank" },
  { id: "211", date: "2026-12-05", title: "ИП Соколова Анна Викторовна", purpose: "Арендная плата за офис за декабрь 2026 по договору №А-14 от 01.03.2026. Без НДС", amount: -35000, docNumber: "211", bank: "Т-Банк", account: "2286", logo: "person" },
  { id: "210", date: "2026-12-03", title: "ООО «Курьер Сервис»", purpose: "Оплата по счёту №554 от 30.11.2026 за курьерскую доставку за ноябрь. НДС 20%", amount: -6200, docNumber: "210", bank: "Альфа-Банк", account: "7712", logo: "company" },
  { id: "3307", date: "2026-12-01", title: "ООО «Техно Плюс»", purpose: "Оплата по договору поставки №0915 от 15.09.2026, счёт №301. НДС 20%", amount: 128500, docNumber: "3307", bank: "Райффайзенбанк", account: "6054", logo: "company" },
];

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

export function dayLabel(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/* 1234567.5 → "1 234 567,50" с заданным разделителем разрядов */
export function money(value: number, groupSep: string) {
  const [int, frac] = Math.abs(value).toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep)},${frac}`;
}

export function signed(value: number, groupSep: string, rubSep: string) {
  return `${value > 0 ? "+" : "−"}${money(value, groupSep)}${rubSep}₽`;
}

export const CLOSING_BALANCE = accountsTotal;
export const income = payments.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0);
export const outcome = payments.filter((p) => p.amount < 0).reduce((s, p) => s - p.amount, 0);
export const OPENING_BALANCE = Math.round((CLOSING_BALANCE - income + outcome) * 100) / 100;
