"use client";

/* Имя клиента — клиентское состояние прототипа.
   Живёт в localStorage (переживает reload; работает и в статической сборке),
   при недоступном storage — в памяти документа. Дефолт совпадает с макетом:
   «Набокова Анна Дмитриевна» → приветствие «Анна», шапка «Набокова А.Д.». */

import { useSyncExternalStore } from "react";

export const DEFAULT_CLIENT_FULL_NAME = "Набокова Анна Дмитриевна";

const STORAGE_KEY = "__alfaClientName";
const listeners = new Set<() => void>();
let cached: string | null = null;

/* Первая буква каждого слова — заглавная, остальные строчные (даже если
   пользователь ввёл имя маленькими буквами). Части через дефис тоже. */
function capitalizeWord(word: string): string {
  return word
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join("-");
}

function normalize(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

function readStored(): string {
  if (typeof window === "undefined") return DEFAULT_CLIENT_FULL_NAME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && normalize(stored) ? normalize(stored) : DEFAULT_CLIENT_FULL_NAME;
  } catch {
    return DEFAULT_CLIENT_FULL_NAME;
  }
}

export function getClientFullName(): string {
  if (cached === null) cached = readStored();
  return cached;
}

export function setClientFullName(value: string): void {
  const next = normalize(value) || DEFAULT_CLIENT_FULL_NAME;
  cached = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* приватный режим / file:// без storage — остаёмся в памяти */
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeClientName(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useClientFullName(): string {
  return useSyncExternalStore(subscribeClientName, getClientFullName, () => DEFAULT_CLIENT_FULL_NAME);
}

export function useClientName(): ClientNameParts {
  return getClientNameParts(useClientFullName());
}

export type ClientNameParts = {
  fullName: string;
  surname: string;
  firstName: string;
  patronymic: string;
  /* «Фамилия И.О.» для шапки */
  headerLabel: string;
  /* только имя — для приветствия */
  greetingName: string;
};

/* Разбор полного имени: «Набокова Анна Владимировна» →
   greetingName «Анна», headerLabel «Набокова А.В.». */
export function getClientNameParts(fullName: string): ClientNameParts {
  const full = normalize(fullName) || DEFAULT_CLIENT_FULL_NAME;
  const [surname = "", firstName = "", patronymic = ""] = full.split(" ");
  const initial = (part: string) => (part ? `${part.charAt(0).toUpperCase()}.` : "");
  const greetingName = firstName || surname;
  const headerLabel =
    firstName && patronymic
      ? `${surname} ${initial(firstName)}${initial(patronymic)}`
      : firstName
        ? `${surname} ${initial(firstName)}`
        : surname;
  return { fullName: full, surname, firstName, patronymic, headerLabel, greetingName };
}
