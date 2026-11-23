import { operationCompanies, type OperationCompany } from "./operation-companies";

export const researchScreens = {
  sign: "Лента операций",
  drafts: "Лента операций",
  credit: "Кредитная линия",
  rewards: "Задания и награды",
  risk: "Индикатор риска",
  profile: "Профиль",
} as const;

export type ResearchScreen = keyof typeof researchScreens;
export const researchHref = (screen: ResearchScreen) => `/research/${screen}`;
export const isResearchScreen = (value: string): value is ResearchScreen => Object.hasOwn(researchScreens, value);

export const creditLineOverdueAmount = 1_332_000;

const researchAccounts = {
  terravait: "40559 575 9 5900 00058585",
  norvel: "35559 4575 0 4940 00011404",
  linvera: "40702 810 3 7710 00012643",
  granvex: "40702 810 1 2040 00072189",
  astern: "40702 810 8 7702 00018724",
  forwell: "40702 810 4 4410 00029583",
  rivern: "40702 810 6 2490 00041076",
  modulterm: "40702 810 2 2260 00093218",
} satisfies Record<OperationCompany, string>;

function makeResearchRows(documents: readonly (readonly [OperationCompany, number])[]) {
  return documents.map(([key, amount]) => ({
    company: operationCompanies[key].title,
    logo: operationCompanies[key].logo,
    account: researchAccounts[key],
    counterparty: key === "norvel" || key === "linvera" ? "ИП Петрова Анна Фёдоровна" : "ИП Сидоров Кирилл Ильич",
    amount,
  }));
}

export const researchRows = {
  sign: makeResearchRows([
    ["terravait", 1240], ["astern", 875], ["norvel", 610], ["linvera", 1910], ["modulterm", 540],
    ["granvex", 2370], ["rivern", 495], ["forwell", 1238.58], ["terravait", 812], ["norvel", 2196],
  ]),
  drafts: makeResearchRows([
    ["rivern", 3800], ["granvex", 6300], ["forwell", 2900], ["norvel", 4250],
    ["linvera", 1100], ["terravait", 2480], ["modulterm", 3670], ["astern", 3550],
  ]),
};

// Видимые строки таблицы траншей, Figma 503:34146.
export const creditRows = [
  ["02OO1T081", "1 000 000,00 ₽", "9% годовых", "—", "—", "—", "нарушено"],
  ["02OO1T083", "1 400 000,00 ₽", "9% годовых", "—", "—", "—", "нарушено"],
  ["02OO1T084", "1 100 000,00 ₽", "9% годовых", "—", "—", "—", "нарушено"],
  ["02OO1T082", "1 200 000,00 ₽", "0,5% в день", "12.04.2025", "5 000,00 ₽", "—", "Выполнено"],
  ["02OO1T085", "1 200 000,00 ₽", "9% годовых", "12.04.2025", "10 000,00 ₽", "—", "Выполнить завтра"],
  ["02OO1T086", "1 400 000,00 ₽", "9% годовых", "12.05.2025", "15 000,00 ₽", "—", "Выполнить до 25.06.2025"],
  ["02OO1T087", "1 000 000,00 ₽", "9% годовых", "19.05.2025", "20 000,00 ₽", "—", "Выполнить до 25.07.2025"],
  ["02OO1T088", "1 100 000,00 ₽", "9% годовых", "25.06.2025", "25 000,00 ₽", "—", "Выполнено"],
  ["02OO1T089", "1 600 000,00 ₽", "9% годовых", "12.07.2025", "30 000,00 ₽", "—", "Выполнено"],
  ["02OO1T080", "1 200 000,00 ₽", "0,5% в день", "20.08.2025", "15 000,00 ₽", "—", "Отсутствует"],
] as const;
