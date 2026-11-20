import { money } from "./payments";

export type WorkItem = {
  title: string;
  count: number;
  amount?: number;
  caption?: string;
  important?: boolean;
};

type WorkCategory = { title: string; items: WorkItem[]; important?: boolean };

const rublePayments = "Рублёвые платежи";
const currencyTransfers = "Валютные переводы";
const paymentRegisters = "Реестры платежей";

export const workCategories = {
  pay: {
    title: "Оплатить",
    important: true,
    items: [{ title: "Входящие счета", count: 3, amount: 42850 }],
  },
  sign: {
    title: "Подписать",
    items: [
      { title: rublePayments, count: 1, amount: 28740 },
      { title: currencyTransfers, count: 1, amount: 18600 },
      { title: paymentRegisters, count: 1, amount: 20000 },
      { title: "Проценты на остаток", count: 1, caption: "Предложение от банка" },
    ],
  },
  send: {
    title: "Отправить",
    items: [
      { title: rublePayments, count: 1, amount: 23800 },
      { title: currencyTransfers, count: 1, amount: 15900 },
      { title: paymentRegisters, count: 1, amount: 17500 },
    ],
  },
  revise: {
    title: "Доработать",
    items: [{ title: currencyTransfers, count: 1, amount: 18700, caption: "Ожидают идентификации" }],
  },
  rejected: {
    title: "Отклонённые",
    items: [
      { title: rublePayments, count: 1, amount: 10950 },
      { title: currencyTransfers, count: 1, amount: 9500 },
      { title: paymentRegisters, count: 1, amount: 8000 },
    ],
  },
  drafts: {
    title: "Черновики",
    items: [
      { title: rublePayments, count: 3, amount: 25500 },
      { title: currencyTransfers, count: 1, amount: 10500 },
    ],
  },
  bank: {
    title: "В работе у банка",
    items: [
      { title: rublePayments, count: 3, amount: 34400 },
      { title: currencyTransfers, count: 1, amount: 18200 },
      { title: paymentRegisters, count: 1, amount: 17900 },
      { title: "Платёжные требования", count: 2, amount: 16000, important: true },
    ],
  },
} satisfies Record<string, WorkCategory>;

export type WorkCategoryId = keyof typeof workCategories;
export const workOrder = ["pay", "sign", "send", "revise", "rejected", "drafts", "bank"] as const;
export const featuredWork = ["pay", "revise", "sign"] as const;

export function workSummary(id: WorkCategoryId) {
  const category: WorkCategory = workCategories[id];
  const documents = category.items.filter(item => item.amount !== undefined);
  const count = documents.reduce((sum, item) => sum + item.count, 0);
  const total = documents.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return { title: category.title, important: category.important, count, amount: `${money(total, "\u202f")}\u202f₽` };
}
