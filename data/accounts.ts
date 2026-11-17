/* Легенда прототипа: у компании три рублёвых счёта — основной,
   налоговый и резервный. К основному и резервному привязана Business One.
   Остатки и реквизиты для сайдбара и вкладки счетов задаются только здесь. */
export const accounts = [
  { purpose: "Основной", number: "40802 810 0 0287 0025370", card: "··0363", balance: 948078.40 },
  { purpose: "Налоговый", number: "40802 810 0 0287 0025277", card: "", balance: 1000 },
  { purpose: "Резервный", number: "40802 810 0 0287 0025250", card: "··0363", balance: 1000 },
] as const;

export const accountsTotal = accounts.reduce((total, account) => total + account.balance, 0);

const count = accounts.length;
const lastTwo = count % 100;
const last = count % 10;
const noun = lastTwo >= 11 && lastTwo <= 14 ? "счетов" : last === 1 ? "счёт" : last >= 2 && last <= 4 ? "счёта" : "счетов";
export const accountsCountLabel = `${count} ${noun}`;
