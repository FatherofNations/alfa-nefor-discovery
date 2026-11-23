import { money } from "./payments";

export type WorkItem = {
  title: string;
  count: number;
  amount?: number;
  route?: "sign" | "drafts";
  caption?: string;
  important?: boolean;
};

type WorkCategory = { title: string; items: WorkItem[]; important?: boolean };

const rublePayments = "Рублёвые платежи";
const currencyTransfers = "Валютные переводы";
const paymentRegisters = "Реестры платежей";

export const workCategories = {
  sign: {
    title: "Подписать",
    important: true,
    items: [
      { title: rublePayments, count: 10, amount: 12286.58, route: "sign" },
      { title: "Валютные платежи", count: 1, caption: "12,19 $" },
      { title: paymentRegisters, count: 2, amount: 2000 },
    ],
  },
  send: {
    title: "Отправить",
    items: [],
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
      { title: rublePayments, count: 8, amount: 28050, route: "drafts" },
      { title: paymentRegisters, count: 6, amount: 2203.36 },
    ],
  },
  bank: {
    title: "В работе у банка",
    items: [],
  },
} satisfies Record<string, WorkCategory>;

export type WorkCategoryId = keyof typeof workCategories;
export const workOrder = ["sign", "send", "bank", "rejected", "revise", "drafts"] as const;
export const featuredWork = ["sign", "rejected", "revise"] as const;

export function workSummary(id: WorkCategoryId) {
  const category: WorkCategory = workCategories[id];
  const documents = category.items;
  const count = documents.reduce((sum, item) => sum + item.count, 0);
  const total = documents.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return { title: category.title, important: category.important, count, amount: `${money(total, "\u202f")}\u202f₽` };
}
