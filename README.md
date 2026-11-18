# Альфа-Бизнес — Ассистент

Интерактивный прототип по Figma-макету. Создан из шаблона
[alfa-mcp](https://github.com/FatherofNations/alfa-mcp).

## Открыть прототип

Распакуйте `static-dist.zip` и дважды нажмите на `static-dist/index.html`.
Храните файлы распакованной папки вместе. Для запуска достаточно браузера,
подключение к сети и сервер не требуются.

## Собрать и проверить

Используйте Node.js 22 из `.nvmrc` и npm. Для упаковки и проверки архива
нужны команды `zip` и `unzip`.

```bash
nvm use
npm ci
npm run build:static
npx playwright install chromium
npm run verify:static
```

`build:static` создаёт папку `static-dist/` и архив `static-dist.zip`.
`verify:static` распаковывает архив во временную папку и запускает
`index.html` через `file://`. CI выполняет эту же проверку и сохраняет
архив в артефактах запуска.

Для работы над Next-версией запустите `npm run dev -- -p 3001`.
На запущенном сервере `npm run verify http://localhost:3001` проверяет
HTTP-страницы и статическую сборку из `static-dist/`. Для проверки
только HTTP используйте `npm run verify -- --http-only`.

Дальнейшие шаги после скаффолда (шрифты дизайн-системы уже установлены):

1. `get_variable_defs` (Figma MCP) → `extract_tokens` → `styles/tokens.css`
2. Разбор макета — читать `alfa://knowledge/figma-import`
   и `alfa://knowledge/pixel-perfect`
3. Ассеты: один батч `download_assets` (Figma MCP) в `public/assets/figma`
   → сразу `process_assets`
4. Анимации — только канон: `alfa://knowledge/animation-canon` / `add_animation`
5. Перед сдачей — `npm run verify` и чек-лист `get_checklist(stage: "qa")`

Handoff-документ: [HANDOFF.md](HANDOFF.md).
