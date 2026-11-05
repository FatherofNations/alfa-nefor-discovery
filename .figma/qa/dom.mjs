import { spawn } from "node:child_process";
import fs from "node:fs";

const PORT = 9444;
const URL = "http://127.0.0.1:3001/";
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  "--no-first-run", "--disable-crash-reporter",
  "--user-data-dir=/tmp/dsh-chrome-dom",
  "--remote-debugging-port=" + PORT, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(250); }
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
  return r.result?.result?.value;
};

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: URL });
await sleep(2500);

const out = await evalJs(`(async () => {
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 300));
  const sels = [
    ".sidebar", ".sidebar-logo", ".amounts", ".balance-cell", ".menu-list",
    ".topbar", ".company-account", ".person-select",
    ".dashboard-content", ".tabs", ".tab:nth-child(1)", ".tab:nth-child(2)", ".tab:nth-child(3)", ".tab:nth-child(4)",
    ".hero", ".hero-copy", ".hero-heading", ".hero-heading h1", ".hero-dash", ".hero-subtitle", ".hero-actions",
    ".work-dropdown", ".hero-actions > .hero-chip:nth-child(2)", ".hero-actions > .hero-chip:nth-child(3)",
    ".hero-actions > .hero-chip:nth-child(4)", ".hero-actions > .hero-chip:nth-child(5)",
    ".tasks", ".section-title", ".tasks-viewport", ".tasks-track",
    ".tasks-track > .task-card:nth-child(1)", ".tasks-track > .task-card:nth-child(2)", ".tasks-track > .task-card:nth-child(3)",
    ".operations", ".operations-title", ".filters", ".date-filter", ".search-field", ".general-filter", ".download-button",
    ".analytics", ".analytics-card:nth-child(1)", ".analytics-card:nth-child(2)",
    ".operations-table", ".day-header", ".operation-row", ".operation-main", ".operation-content", ".checkbox",
    ".operation-counterparty", ".company-logo", ".operation-title", ".operation-description", ".operation-status",
    ".operation-amount", ".operation-more", ".operation-number", ".show-more",
    ".payment-copy", ".payment-copy p:last-child", ".date-clear", ".calendar-icon",
    ".support-button .indicator", ".tab.active .indicator", ".work-dropdown .indicator", ".analytics-card:nth-child(2) strong",
    ".spotlight", ".spotlight-logo", ".assistant-input", ".support-button"
  ];
  const boxes = sels.map((s) => {
    const el = document.querySelector(s);
    if (!el) return { s, missing: true };
    const r = el.getBoundingClientRect();
    return { s, x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  });
  const ranges = [...document.querySelectorAll(".analytics-card > strong")].map((el) => {
    const r = document.createRange(); r.selectNodeContents(el);
    return { text: el.textContent, boxW: +el.getBoundingClientRect().width.toFixed(2), textW: +r.getBoundingClientRect().width.toFixed(2) };
  });
  const styleSels = [".hero-heading h1", ".hero-subtitle p", ".tab.active", ".hero-chip", ".payment-copy p:first-child", ".operation-title", ".operation-amount", ".analytics-card > strong", ".date-filter"];
  const styles = styleSels.map((s) => {
    const el = document.querySelector(s);
    if (!el) return { s, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { s, font: c.fontFamily, size: c.fontSize, weight: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, color: c.color, x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  });
  return { viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], boxes, styles, ranges };
})()`);

fs.mkdirSync(".figma/qa", { recursive: true });
fs.writeFileSync(".figma/qa/dom.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
ws.close();
chrome.kill();
process.exit(0);
