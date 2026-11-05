#!/usr/bin/env node
/* figma-mcp.mjs — прямой клиент УДАЛЁННОГО Figma MCP (streamable HTTP).

   Зачем: харнесс выдаёт MCP-тулы только после перезапуска с профилем,
   а этот скрипт даёт полный набор здесь и сейчас — 42 тула, включая
   get_metadata / get_design_context / get_screenshot (maxDimension) /
   download_assets / use_figma.

   Авторизация: OAuth-токен моста mcp-remote из ~/.mcp-auth. Токен живёт
   90 дней; скрипт его не печатает и не меняет. Продление — повторный
   запуск моста (откроется браузер):
     npx -y mcp-remote@0.14.2 https://mcp.figma.com/mcp \\
       --static-oauth-client-info @~/.mcp-auth/figma-client.json

   Использование:
     node scripts/figma-mcp.mjs whoami
     node scripts/figma-mcp.mjs tools [--json]
     node scripts/figma-mcp.mjs schema <tool>
     node scripts/figma-mcp.mjs call <tool> '<json>'
     node scripts/figma-mcp.mjs call <tool> @args.json
     node scripts/figma-mcp.mjs screenshot <fileKey> <nodeId> [--max 1600] [--out file.png]

   Переменные: FIGMA_MCP_URL (эндпоинт), FIGMA_MCP_TOKEN (готовый токен). */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const ENDPOINT = process.env.FIGMA_MCP_URL ?? "https://mcp.figma.com/mcp";
const PROTOCOL = "2025-06-18";
const AUTH_DIR = path.join(os.homedir(), ".mcp-auth", "mcp-remote-v1");

function loadToken() {
  if (process.env.FIGMA_MCP_TOKEN) return process.env.FIGMA_MCP_TOKEN;
  let files = [];
  try {
    files = fs.readdirSync(AUTH_DIR)
      .filter((f) => f.endsWith("_tokens.json"))
      .map((f) => ({ f, mtime: fs.statSync(path.join(AUTH_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    fail("нет каталога " + AUTH_DIR + " — удалённый MCP ещё не авторизован");
  }
  let expired = null;
  for (const { f } of files) {
    const j = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, f), "utf8"));
    if (!j.access_token) continue;
    if (j.issuer && !String(j.issuer).includes("figma")) continue;
    if (j.expires_at && Number(j.expires_at) < Date.now() + 60_000) {
      expired = Number(j.expires_at);
      continue;
    }
    return j.access_token;
  }
  if (expired) {
    fail("токен истёк " + new Date(expired).toISOString() +
      " — продлите: npx -y mcp-remote@0.14.2 https://mcp.figma.com/mcp --static-oauth-client-info @~/.mcp-auth/figma-client.json");
  }
  fail("в " + AUTH_DIR + " нет access_token");
}

function fail(msg) {
  console.error("figma-mcp: " + msg);
  process.exit(1);
}

const TOKEN = loadToken();
let sessionId = null;

function parseEvents(text) {
  const out = [];
  const blocks = text.split(/\r?\n\r?\n/);
  for (const block of blocks) {
    const data = block.split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("\n");
    if (!data) continue;
    try { out.push(JSON.parse(data)); } catch { /* не JSON — пропускаем */ }
  }
  if (!out.length) {
    try { out.push(JSON.parse(text)); } catch { /* ignore */ }
  }
  return out;
}

async function post(payload) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: "Bearer " + TOKEN,
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(240_000),
  });
  if (!sessionId) sessionId = res.headers.get("mcp-session-id");
  const text = await res.text();
  if (res.status === 401) fail("401 Unauthorized — токен отозван, нужен повторный OAuth-логин через mcp-remote");
  if (!res.ok) fail("HTTP " + res.status + ": " + text.slice(0, 300));
  return parseEvents(text);
}

async function rpc(method, params, id = 1) {
  const msgs = await post({ jsonrpc: "2.0", id, method, params });
  const msg = msgs.find((m) => m.id === id) ?? msgs.find((m) => m.error || m.result);
  if (!msg) fail("пустой ответ на " + method);
  if (msg.error) fail(method + ": " + JSON.stringify(msg.error));
  return msg.result;
}

async function notify(method) {
  await post({ jsonrpc: "2.0", method });
}

let ready = false;
async function init() {
  if (ready) return;
  await rpc("initialize", {
    protocolVersion: PROTOCOL,
    capabilities: {},
    clientInfo: { name: "alfa-figma-mcp-cli", version: "1" },
  });
  if (sessionId) await notify("notifications/initialized");
  ready = true;
}

const textOf = (result) => (result?.content ?? [])
  .filter((c) => c.type === "text")
  .map((c) => c.text)
  .join("\n");

async function toolCall(name, args) {
  await init();
  const result = await rpc("tools/call", { name, arguments: args });
  if (result.isError) fail(name + ": " + (textOf(result) || "ошибка тула"));
  return result;
}

const argv = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--max" || argv[i] === "--out") flags[argv[i].slice(2)] = argv[++i];
  else if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = true;
  else pos.push(argv[i]);
}

function jsonArg(raw) {
  if (!raw) return {};
  if (raw.startsWith("@")) return JSON.parse(fs.readFileSync(raw.slice(1), "utf8"));
  return JSON.parse(raw);
}

const [cmd, a, b] = pos;

switch (cmd) {
  case "whoami": {
    console.log(textOf(await toolCall("whoami", {})));
    break;
  }
  case "tools": {
    await init();
    const result = await rpc("tools/list", {});
    const tools = result.tools ?? [];
    if (flags.json) console.log(JSON.stringify(tools, null, 2));
    else for (const t of tools) console.log(t.name + " — " + (t.description ?? "").split("\n")[0].slice(0, 110));
    break;
  }
  case "schema": {
    await init();
    const result = await rpc("tools/list", {});
    const tool = (result.tools ?? []).find((t) => t.name === a);
    if (!tool) fail("нет тула " + a);
    console.log(JSON.stringify(tool, null, 2));
    break;
  }
  case "call": {
    const raw = pos.slice(2).join(" ");
    const result = await toolCall(a, jsonArg(raw));
    console.log(textOf(result));
    break;
  }
  case "screenshot": {
    const [fileKey, nodeId] = [a, b];
    if (!fileKey || !nodeId) fail("нужно: screenshot <fileKey> <nodeId> [--max N] [--out file.png]");
    const args = { fileKey, nodeId };
    if (flags.max) args.maxDimension = Number(flags.max);
    const result = await toolCall("get_screenshot", args);
    const payload = JSON.parse(textOf(result).split("\n")[0]);
    if (!payload.image_url) fail("в ответе нет image_url: " + textOf(result).slice(0, 200));
    const png = Buffer.from(await (await fetch(payload.image_url)).arrayBuffer());
    const out = flags.out ?? "figma-" + nodeId.replace(":", "-") + ".png";
    fs.writeFileSync(out, png);
    const sha = crypto.createHash("sha256").update(png).digest("hex");
    console.log(JSON.stringify({ out, bytes: png.length, width: payload.width, height: payload.height, sha256: sha }, null, 2));
    break;
  }
  default: {
    console.error("Команды: whoami | tools [--json] | schema <tool> | call <tool> '<json>' | screenshot <fileKey> <nodeId> [--max N] [--out file.png]");
    process.exit(2);
  }
}
