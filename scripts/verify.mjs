#!/usr/bin/env node
/* HTTP and browser smoke checks. Pass --http-only for a partial check. */

import { resolve } from "node:path";
import { verifyStatic } from "./verify-static.mjs";

const BASE = (process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "http://localhost:3001").replace(/\/$/, "");
let failures = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  failures++;
  console.error(`  ✗ ${m}`);
};

const routes = ["/", "/new-payment", "/accountant", "/login", "/welcome", "/setup"];
const httpOnly = process.argv.includes("--http-only");

console.log(`verify: ${BASE}, роуты: ${routes.join(", ")}`);

// сервер жив?
try {
  await fetch(BASE, { redirect: "manual" });
} catch {
  console.error(`Сервер недоступен на ${BASE}. Запустите npm run dev (или build+start).`);
  process.exit(2);
}

// ── уровень 1: роуты + статические ссылки ──
const seenAssets = new Set();
for (const route of routes) {
  const res = await fetch(BASE + route);
  if (res.status !== 200) {
    bad(`${route} → HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();
  if (html.length < 500) {
    bad(`${route} → подозрительно пустой ответ (${html.length} байт)`);
    continue;
  }
  ok(`${route} → 200, ${html.length} байт`);
  for (const m of html.matchAll(/(?:src|href)="(\/(?:assets|fonts)\/[^"]+)"/g)) {
    seenAssets.add(m[1]);
  }
}
for (const asset of seenAssets) {
  const res = await fetch(BASE + asset, { method: "HEAD" });
  if (res.status !== 200) bad(`ассет ${asset} → HTTP ${res.status}`);
}
if (seenAssets.size) ok(`ассеты по ссылкам: ${seenAssets.size} шт. проверено`);

// ── уровень 2: браузерные проверки (опционально) ──
let chromium = null;
if (!httpOnly) {
  try {
    ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright"));
  } catch {
    bad("Playwright недоступен. Используйте --http-only только для проверки HTTP.");
  }
}
if (chromium) {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.addInitScript(() => { window.__alfaEntryState = { entered: true, role: "entrepreneur" }; });
  const screenSelectors = { "/": ".dashboard-page", "/new-payment": ".payment-form", "/accountant": ".cur-content", "/login": ".entry-submit", "/welcome": ".entry-role-cards", "/setup": ".entry-setup" };
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    if (!(await page.locator(screenSelectors[route]).count())) bad(`${route}: ожидаемый экран не найден`);
    // битые картинки: браузер молча рендерит пустоту — ловим naturalWidth
    const broken = await page.$$eval("img", (imgs) =>
      imgs.filter((i) => i.naturalWidth === 0 && i.src).map((i) => i.src)
    );
    if (broken.length) bad(`${route}: битые <img>: ${broken.join(", ")}`);
    else ok(`${route}: 0 битых <img>`);

  }
  try {
    await verifyStatic(browser, resolve("static-dist/index.html"));
    ok("Статика: вход, новый платёж, вкладки, имя клиента, смена компании и роли, скрытие сумм и выход");
  } catch (error) {
    bad(`Статика: ${error.message}`);
  }
  const hydration = consoleErrors.filter((e) => /hydrat/i.test(e));
  if (hydration.length) bad(`hydration-ошибки: ${hydration.length}`);
  if (consoleErrors.length) bad(`ошибки консоли (${consoleErrors.length}): ${consoleErrors[0]}`);
  else ok("консоль чистая");
  await browser.close();
}

console.log(failures ? `\nFAIL: ${failures} проблем` : httpOnly ? "\nOK: только HTTP, браузер не проверялся" : "\nOK: все проверки пройдены");
process.exit(failures ? 1 : 0);
