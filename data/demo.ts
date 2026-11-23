import { type Payment, CLOSING_BALANCE, OPENING_BALANCE, OPS_PERIOD, dayLabel, income, money, outcome, payments, shortDate, signed } from "./payments";

export const menuItems = [
  { label: "Все сервисы", icon: "menu-889b6.svg" },
  { label: "Альфа-Выгодно", icon: "menu-a27d9.svg", loyalty: true },
  { label: "Новый платёж", icon: "menu-6f742.svg", muted: true, href: "/new-payment" },
  { label: "Лента операций", icon: "menu-34800.svg", muted: true, href: "/operations" },
  { label: "Платежи в работе", icon: "menu-7ff07.svg", muted: true },
] as const;

export const taskCards = [
  { title: "Индикатор\nриска", image: "task-action-risk.png", className: "risk" },
  { title: "Изучить условия тарифа", image: "task-action-tariff.png", className: "tariff" },
  { title: "Добавить нового пользователя", image: "task-action-user.png", className: "user" },
  { title: "Принять платёж онлайн", image: "task-action-online.png", className: "online" },
] as const;

const G = "\u205f", R = "\u2009";

export const analytics = [
  { label: "Входящий остаток", amount: `${money(OPENING_BALANCE, G)}${R}₽`, icon: "ops-analytics-3cf1a.svg" },
  { label: "Поступления", amount: `+${money(income, G)}${R}₽`, icon: "ops-analytics-54a31.svg" },
  { label: "Списания", amount: `−${money(outcome, G)}${R}₽`, icon: "ops-analytics-bb78f.svg" },
  { label: "Исходящий остаток", amount: `${money(CLOSING_BALANCE, G)}${R}₽`, icon: "ops-analytics-3cf1a.svg" },
] as const;

export const opsPeriodLabel = `${shortDate(OPS_PERIOD.from)} – ${shortDate(OPS_PERIOD.to)}`;

export type Operation = {
  id: string;
  title: string;
  description: string;
  details?: string;
  amount: string;
  positive?: boolean;
  number: string;
  status: string;
  logo: Payment["logo"];
  logoIsGlyph?: boolean;
};

export const operationDays: { date: string; rows: Operation[] }[] = [...new Set(payments.map((p) => p.date))].map((date) => ({
  date: dayLabel(date),
  rows: payments.filter((p) => p.date === date).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.purpose,
    details: p.details,
    amount: signed(p.amount, G, R),
    positive: p.amount > 0,
    number: `№${p.docNumber}, ${p.bank}, ··${R}${p.account}`,
    status: "Исполнено",
    logo: p.logo,
    logoIsGlyph: p.logoIsGlyph,
  })),
}));
