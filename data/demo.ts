export const menuItems = [
  { label: "Все сервисы", icon: "menu-889b6.svg" },
  { label: "Альфа-Выгодно", icon: "menu-a27d9.svg", loyalty: true },
  { label: "Новый платёж", icon: "menu-6f742.svg", muted: true },
  { label: "Лента операций", icon: "menu-34800.svg", muted: true, target: "operations" },
  { label: "Платежи в работе", icon: "menu-7ff07.svg", muted: true },
] as const;

export const taskCards = [
  { title: "Индикатор\nриска", image: "task-action-risk.png", className: "risk" },
  { title: "Изучить условия тарифа", image: "task-action-tariff.png", className: "tariff" },
  { title: "Добавить нового пользователя", image: "task-action-user.png", className: "user" },
  { title: "Принять платёж онлайн", image: "task-action-online.png", className: "online" },
] as const;

export const analytics = [
  { label: "Входящий остаток", amount: "1\u205f234\u205f567,00\u2009₽", icon: "ops-analytics-3cf1a.svg" },
  { label: "Поступления", amount: "+1\u205f234\u205f567,00\u2009₽", icon: "ops-analytics-54a31.svg" },
  { label: "Списания", amount: "−1\u205f234\u205f567,00\u2009₽", icon: "ops-analytics-bb78f.svg" },
  { label: "Исходящий остаток", amount: "1\u205f234\u205f567,00\u2009₽", icon: "ops-analytics-3cf1a.svg" },
] as const;

export type Operation = {
  id: string;
  title: string;
  description: string;
  details?: string;
  amount: string;
  positive?: boolean;
  number: string;
  status: string;
  logo: "company" | "person" | "bank";
};

export const operationDays: { date: string; rows: Operation[] }[] = [
  {
    date: "10 августа",
    rows: [
      {
        id: "63677",
        title: "ООО «Умные и свободные»",
        description: "Аванс по договору №51/9-12 от 27.07.2023",
        amount: "−3\u205f000,00\u2009₽",
        number: "№63677, Т-Банк, ··\u20099909",
        status: "Исполнено",
        logo: "company",
      },
      {
        id: "transfer",
        title: "ИП  «Костин Иван Федорович»",
        description: "Перевод себе в Альфа-Банк",
        amount: "+1\u205f234\u205f567,00\u2009₽",
        positive: true,
        number: "№63677, Т-Банк, ··\u20099909",
        status: "Исполнено",
        logo: "person",
      },
      {
        id: "87896",
        title: "АО «Альфа-Банк»",
        description: "Комиссия за SMS-оповещение за август 2025",
        details: "Согласно тарифам Банка ИП Костин Иван Федорович",
        amount: "−1\u205f000,00\u2009₽",
        number: "№87896",
        status: "Исполнено",
        logo: "bank",
      },
    ],
  },
  {
    date: "9 августа",
    rows: [
      {
        id: "105",
        title: "ООО «Умные и свободные»",
        description: "Аванс по договору №51/9-12 от 27.07.2023",
        amount: "−3\u205f000,00\u2009₽",
        number: "№ 105, Т-Банк, ··\u20099909",
        status: "Исполнено",
        logo: "company",
      },
    ],
  },
];
