import { useSyncExternalStore } from "react";

export const companies = [
  { name: "ООО «Умные и свободные»", inn: "540960870096", rubles: "77 300", foreign: "10 000", currency: "$" },
  { name: "ООО «Калуга Трейд»", inn: "540960870888", rubles: "77 300", foreign: "10 000", currency: "$", more: "и ещё 2 валюты" },
  { name: "ИП Васильев А.И.", inn: "540960870018", rubles: "77 300", foreign: "10 000", currency: "$" },
  { name: "ООО «Циферблат»", inn: "540960870001", rubles: "12 000 240", foreign: "612 312", currency: "¥" },
];

export type Company = typeof companies[number];
const defaultCompany = companies[0];
let selectedCompany = defaultCompany;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function selectCompany(company: Company) {
  if (selectedCompany === company) return;
  selectedCompany = company;
  listeners.forEach((listener) => listener());
}

const readCompany = () => selectedCompany;
const readDefaultCompany = () => defaultCompany;

export function useSelectedCompany() {
  return useSyncExternalStore(subscribe, readCompany, readDefaultCompany);
}
