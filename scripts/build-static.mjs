/* Сборка статического прототипа: папка static-dist, которую можно открыть
   двойным кликом по index.html (file://) и отправить исследователю архивом.

   Что делает:
   1) бандлит React-прототип в один IIFE app.js (esbuild) и подменяет
      next/link и next/navigation на hash-роутер (static/shims/*);
   2) встраивает локальные CSS-ресурсы в app.css;
   3) копирует ресурсы для разметки рядом с index.html;
   4) упаковывает готовую папку в static-dist.zip.

   Запуск: npm run build:static */

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "static-dist");
const publicDir = path.join(root, "public");
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
  "company-switcher.css",
  "tasks-cards.css",
  "tasks-options.css",
  "tasks-flow.css",
  "new-payment.css",
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

// Крупные CSS-фоны и шрифты уже встроены. Если файл нужен бандлу, оставляем и копию.
const CSS_ONLY_IMAGES = new Set([
  "assets/figma/accountant-chrome-1-imgBgImg.png",
  "assets/figma/accountant-header-avatar.png",
  "assets/figma/ai-company-logo.png",
]);
const inlinedAssets = new Map();

/* CSS-ссылки (маски, фоны, шрифты) в file:// грузятся в CORS-режиме и Chrome
   их блокирует (origin null). Поэтому все url(...) из CSS инлайним data-URI:
   иконки-маски и шрифты работают при простом открытии index.html. */
function inlineCssAssets(css, stylesheet) {
  return css.replace(/url\(\s*(['"]?)\/?((?:assets|fonts)\/[^)'"]+?)\1\s*\)/g, (_match, _quote, url) => {
    const relativePath = decodeURIComponent(url.split(/[?#]/, 1)[0]);
    const file = path.join(publicDir, relativePath);
    if (!inlinedAssets.has(file)) {
      const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      let content;
      try {
        content = fs.readFileSync(file);
      } catch (error) {
        throw new Error(`styles/${stylesheet}: не удалось прочитать CSS-ресурс ${file}`, { cause: error });
      }
      inlinedAssets.set(file, `data:${mime};base64,${content.toString("base64")}`);
    }
    const fragment = url.includes("#") ? url.slice(url.indexOf("#")) : "";
    return `url("${inlinedAssets.get(file)}${fragment}")`;
  });
}

const relativizeUrls = (text) =>
  text
    .replace(/url\((['"]?)\/(assets|fonts)\//g, "url($1$2/")
    .replaceAll('"/assets/', '"assets/')
    .replaceAll("'/assets/", "'assets/")
    .replaceAll("`/assets/", "`assets/")
    .replaceAll('"/fonts/', '"fonts/');

const css = CSS_FILES.map((file) =>
  inlineCssAssets(fs.readFileSync(path.join(root, "styles", file), "utf8"), file),
).join("\n");
const bundlePath = path.join(outDir, "app.js");

const { outputFiles } = await build({
  entryPoints: [path.join(root, "static/entry.tsx")],
  outfile: bundlePath,
  write: false,
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

const bundle = relativizeUrls(outputFiles.find((file) => file.path === bundlePath).text);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(bundlePath, bundle);
fs.writeFileSync(path.join(outDir, "app.css"), css);

for (const dir of ["assets", "fonts"]) {
  fs.cpSync(path.join(publicDir, dir), path.join(outDir, dir), {
    recursive: true,
    filter: (file) => {
      if (!inlinedAssets.has(file)) return true;
      const relativePath = path.relative(publicDir, file).split(path.sep).join("/");
      const cssOnly = dir === "fonts" || CSS_ONLY_IMAGES.has(relativePath);
      return !cssOnly || bundle.includes(path.parse(file).name);
    },
  });
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

const archive = path.join(root, "static-dist.zip");
const pendingArchive = path.join(root, `.static-dist-${process.pid}.zip`);
try {
  execFileSync("zip", ["-q", "-r", pendingArchive, path.basename(outDir)], { cwd: root, stdio: "inherit" });
  fs.renameSync(pendingArchive, archive);
} finally {
  fs.rmSync(pendingArchive, { force: true });
}
console.log(`static-dist.zip: ${sizeMb(fs.statSync(archive).size)} MB`);
