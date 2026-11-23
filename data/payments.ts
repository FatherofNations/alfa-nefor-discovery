/* Единый источник платежей для обеих ролей. Предприниматель и бухгалтер
   показывают одни и те же операции, отличается только представление:
   лента по дням (data/demo.ts → Glavnaya) и таблица (accountantHtml.ts).
   Период — 17–20 ноября 2026. Обороты считаются из этих же платежей, а
   исходящий остаток берётся из общего справочника счетов. */

import { accountsTotal } from "./accounts";
import { operationCompanies } from "./operation-companies";

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
  logo: string;
  logoIsGlyph?: boolean;
};

export const DASHBOARD_DATE = "2026-11-20";
export const OPS_PERIOD = { from: "2026-11-17", to: DASHBOARD_DATE } as const;

export const payments: Payment[] = [
  { id: "1184", date: "2026-11-20", ...operationCompanies.terravait, purpose: "Перевозка груза по заявке №412 от 19.11.2026. НДС 20%", amount: 32400, docNumber: "1184", bank: "Сбербанк", account: "4417" },
  { id: "88412", date: "2026-11-20", title: "АО «Альфа-Банк»", purpose: "Комиссия за ведение счёта за ноябрь 2026", details: "Согласно тарифам Банка", amount: -1990, docNumber: "88412", bank: "Альфа-Банк", account: "5370", logo: "/assets/figma/operation-logos/alfa.svg" },
  { id: "214", date: "2026-11-19", ...operationCompanies.norvel, purpose: "Канцелярские товары по счёту №2231 от 18.11.2026. НДС 20%", amount: -4680, docNumber: "214", bank: "ВТБ", account: "0821" },
  { id: "213", date: "2026-11-19", ...operationCompanies.linvera, purpose: "Связь и интернет за ноябрь 2026 по договору №123 от 17.11.2026. НДС 20%", amount: -2490, docNumber: "213", bank: "Газпромбанк", account: "3310" },
  { id: "5521", date: "2026-11-18", ...operationCompanies.granvex, purpose: "Предоплата 50% по договору поставки №17/11 от 17.11.2026. НДС 20%", amount: 17800, docNumber: "5521", bank: "Т-Банк", account: "9909" },
  { id: "212", date: "2026-11-18", title: "УФК по г. Москве (ФНС России)", purpose: "Единый налоговый платёж", amount: -12460, docNumber: "212", bank: "Казначейство России", account: "0101", logo: "/assets/accountant/curTblRub.svg", logoIsGlyph: true },
  { id: "211", date: "2026-11-18", ...operationCompanies.rivern, purpose: "Арендная плата за офис за ноябрь 2026 по договору №А-14 от 17.11.2026. Без НДС", amount: -22500, docNumber: "211", bank: "Т-Банк", account: "2286" },
  { id: "210", date: "2026-11-17", ...operationCompanies.forwell, purpose: "Курьерская доставка за ноябрь по счёту №554. НДС 20%", amount: -2350, docNumber: "210", bank: "Альфа-Банк", account: "7712" },
  { id: "3307", date: "2026-11-17", ...operationCompanies.modulterm, purpose: "Поставка комплектующих по договору №0915, счёт №301. НДС 20%", amount: 38900, docNumber: "3307", bank: "Райффайзенбанк", account: "6054" },
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
