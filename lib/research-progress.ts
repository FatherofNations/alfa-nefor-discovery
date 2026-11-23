"use client";

import { useSyncExternalStore } from "react";

export type ResearchTask = "risk" | "snils";
const key = "__alfaResearchProgress";
const listeners = new Set<() => void>();
let fallback = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function read() {
  try { return Number(window.sessionStorage.getItem(key) ?? fallback); }
  catch { return fallback; }
}

function write(value: number) {
  fallback = value;
  try { window.sessionStorage.setItem(key, String(value)); } catch {}
  listeners.forEach(listener => listener());
}

export function useResearchProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => 0);
  return { risk: Boolean(progress & 1), snils: Boolean(progress & 2) };
}

export function completeResearchTask(task: ResearchTask) {
  write(read() | (task === "risk" ? 1 : 2));
}

export function resetResearchProgress() {
  write(0);
}
