/* Сборка статического прототипа: папка static-dist, которую можно открыть
   двойным кликом по index.html (file://) и отправить исследователю архивом.

   Что делает:
   1) бандлит React-прототип в один IIFE app.js (esbuild) и подменяет
      next/link и next/navigation на hash-роутер (static/shims/*);
   2) склеивает глобальные CSS в app.css, переводя url(/assets/…) и
      url(/fonts/…) в относительные пути;
   3) копирует public/assets и public/fonts рядом с index.html;
   4) пишет index.html с относительными ссылками.

   Запуск: npm run build:static */

import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "static-dist");
const nextLinkShim = path.join(root, "static/shims/next-link.tsx");
const nextNavigationShim = path.join(root, "static/shims/next-navigation.ts");

const CSS_FILES = [
  "tokens.css",
  "fonts.css",
  "canon.css",
  "app.css",
  "first-entry.css",
  "assistant-home.css",
  "wide.css",
  "skeleton.css",
  "focus-reset.css",
  "menu-dnd.css",
  "accountant-tokens.css",
  "chrome.css",
  "accountant.css",
];

/* Абсолютные пути к ассетам Next отдаёт с корня; в file:// корень нельзя,
   поэтому в бандле они становятся относительными от index.html. */
const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

/* CSS-ссылки (маски, фоны, шрифты) в file:// грузятся в CORS-режиме и Chrome
   их блокирует (origin null). Поэтому все url(...) из CSS инлайним data-URI:
   иконки-маски и шрифты работают при простом открытии index.html. */
const inlineCssAssets = (css) =>
  css.replace(/url\((['"]?)(\/?)(assets|fonts)\/[^)'"]+\1\)/g, (match, quote, _slash, dir) => {
    const raw = match.slice(match.indexOf(dir)).replace(/['")]+$/, "");
    const file = path.join(root, "public", raw);
    if (!fs.existsSync(file)) return match;
    const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    return `url("data:${mime};base64,${fs.readFileSync(file).toString("base64")}")`;
  });

const relativizeUrls = (text) =>
  text
    .replace(/url\((['"]?)\/(assets|fonts)\//g, "url($1$2/")
    .replaceAll('"/assets/', '"assets/')
    .replaceAll("'/assets/", "'assets/")
    .replaceAll("`/assets/", "`assets/")
    .replaceAll('"/fonts/', '"fonts/');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "static/entry.tsx")],
  outfile: path.join(outDir, "app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome100", "firefox115", "safari15"],
  jsx: "automatic",
  minify: true,
  legalComments: "none",
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "next-static-shims",
      setup(builder) {
        builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: nextLinkShim }));
        builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: nextNavigationShim }));
      },
    },
  ],
  logLevel: "warning",
});

const bundlePath = path.join(outDir, "app.js");
fs.writeFileSync(bundlePath, relativizeUrls(fs.readFileSync(bundlePath, "utf8")));

const css = CSS_FILES.map((file) => fs.readFileSync(path.join(root, "styles", file), "utf8")).join("\n");
fs.writeFileSync(path.join(outDir, "app.css"), inlineCssAssets(css));

for (const dir of ["assets", "fonts"]) {
  fs.cpSync(path.join(root, "public", dir), path.join(outDir, dir), { recursive: true });
}
/* favicon лежит в app/icon.svg (Next сам его подхватывает) */
if (fs.existsSync(path.join(root, "app/icon.svg"))) {
  fs.copyFileSync(path.join(root, "app/icon.svg"), path.join(outDir, "icon.svg"));
}

fs.writeFileSync(
  path.join(outDir, "index.html"),
  `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Альфа-Бизнес — прототип</title>
    <link rel="icon" href="icon.svg" />
    <link rel="stylesheet" href="app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="app.js"></script>
  </body>
</html>
`,
);

const sizeMb = (wall) => (wall / 1024 / 1024).toFixed(1);
const dirSize = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const full = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? dirSize(full) : fs.statSync(full).size);
  }, 0);

console.log(`static-dist: app.js ${(fs.statSync(bundlePath).size / 1024).toFixed(0)} KB, всего ${sizeMb(dirSize(outDir))} MB`);
