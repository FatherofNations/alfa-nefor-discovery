import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function verifyStatic(browser, indexPath) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.setDefaultTimeout(15000);
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.route(/^https?:\/\//, (route) => {
    errors.push(`Внешний запрос в статической сборке: ${route.request().url()}`);
    return route.abort();
  });

  const entry = pathToFileURL(indexPath);
  const waitForRoute = (route) => page.waitForURL((url) => url.hash === `#${route}`);
  const button = (name) => page.getByRole("button", { name, exact: true });
  const expectFocused = async (locator) => {
    assert(await locator.evaluate((node) => node === document.activeElement), `Фокус вне ${locator}`);
  };

  const checkAssets = async (screen) => {
    const broken = await page.locator("img").evaluateAll(async (images) => {
      const decoded = await Promise.all(images.filter((img) => img.loading !== "lazy").map(async (img) => {
        try {
          await img.decode();
          return null;
        } catch {
          return img.currentSrc || img.src;
        }
      }));
      return decoded.filter(Boolean);
    });
    assert.deepEqual(broken, [], `${screen}: битые изображения`);
  };

  try {
    await page.goto(entry.href);
    await waitForRoute("/login");
    await button("Войти").waitFor();
    await checkAssets("Вход");
    for (const weight of [400, 500, 700]) {
      const loaded = await page.evaluate(async (value) => {
        const faces = await document.fonts.load(`${value} 16px "Alfa Interface Sans"`, "Прототип");
        return faces.some((face) => face.status === "loaded");
      }, weight);
      assert(loaded, `Не загрузился Alfa Interface Sans ${weight}`);
    }

    await button("Быстрый вход").click();
    await waitForRoute("/welcome");
    const entrepreneur = page.getByRole("button", { name: /^Предприниматель/ });
    await entrepreneur.waitFor();
    await checkAssets("Выбор роли");
    await entrepreneur.click();
    await waitForRoute("/setup");
    await page.locator(".entry-setup").waitFor();
    await checkAssets("Настройка");
    await waitForRoute("/");
    await page.locator(".dash-gate.gate-ready #hero-title").waitFor();
    await checkAssets("Главная предпринимателя");

    const tasks = page.getByRole("region", { name: "Мои дела" });
    await tasks.getByRole("button", { name: /Требуют внимания/ }).click();
    const signals = tasks.getByRole("list", { name: "Сигналы" });
    await signals.getByText("Заявка на кредит").waitFor();
    const pay = tasks.getByRole("button", { name: /^Оплатить/ });
    await pay.click();
    const work = tasks.getByRole("list", { name: "Дела в работе" });
    await work.getByText("Валютные переводы").waitFor();
    assert.equal(await signals.count(), 0);
    await page.keyboard.press("Escape");
    await work.waitFor({ state: "hidden" });
    await expectFocused(pay);

    const more = tasks.getByRole("button", { name: /^Ещё/ });
    await more.click();
    const allTasks = tasks.getByRole("region", { name: "Все дела" });
    await allTasks.getByText("Черновики").waitFor();
    const hide = allTasks.getByRole("button", { name: "Скрыть" });
    await expectFocused(hide);
    await hide.click();
    await allTasks.waitFor({ state: "hidden" });
    await expectFocused(more);

    const tabs = page.locator(".tabs");
    for (const name of ["Сводка", "Счета на главной", "Тарифы и подписки", "Ассистент"]) {
      const tab = tabs.getByRole("button", { name: new RegExp(`^${name}`) });
      await tab.click();
      await tabs.getByRole("button", { name: new RegExp(`^${name}`), pressed: true }).waitFor();
      await page.locator(".tab-stage.phase-idle").waitFor();
      await checkAssets(name);
    }
    const trigger = tabs.getByRole("button", { name: "Ассистент", exact: true });
    await trigger.focus();
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Имя клиента" });
    await dialog.waitFor();
    await expectFocused(dialog);
    const input = dialog.getByRole("textbox", { name: "Имя клиента" });
    const save = dialog.getByRole("button", { name: "Сохранить" });
    await page.keyboard.press("Tab");
    await expectFocused(input);
    await page.keyboard.press("Shift+Tab");
    await expectFocused(save);
    await page.keyboard.press("Tab");
    await expectFocused(input);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    await expectFocused(trigger);

    await page.keyboard.press("/");
    await input.fill("иванова мария петровна");
    await input.press("Enter");
    await dialog.waitFor({ state: "detached" });
    await page.reload();
    await page.getByRole("heading", { name: /Мария, добрый день/ }).waitFor();

    const companyTrigger = page.locator(".topbar").getByRole("button", { name: /Сменить компанию/ });
    await page.locator(".topbar").getByRole("button", { name: "Сменить компанию: ООО «Умные и свободные»" }).waitFor();
    await companyTrigger.click();
    const companyPanel = page.getByRole("dialog", { name: "Иванова Мария Петровна" });
    await companyPanel.waitFor();
    await companyPanel.getByRole("heading", { name: "ООО «Умные и свободные»" }).waitFor();
    await checkAssets("Смена компании");
    assert.equal(await companyPanel.locator(".company-switcher-option").count(), 4);
    await page.keyboard.press("Escape");
    await companyPanel.waitFor({ state: "detached" });
    await expectFocused(companyTrigger);

    await companyTrigger.click();
    await companyPanel.getByRole("button", { name: /^ООО «Циферблат»/ }).click();
    await companyPanel.waitFor({ state: "detached" });
    await page.locator(".topbar").getByRole("button", { name: "Сменить компанию: ООО «Циферблат»" }).waitFor();

    const openAccountant = async () => {
      await page.locator(".topbar").getByRole("button", { name: "Предприниматель", exact: true }).click();
      await page.getByRole("menuitemradio", { name: /^Бухгалтер/ }).click();
      await waitForRoute("/accountant");
      await page.locator(".dash-gate.gate-ready .cur-content").waitFor();
    };
    await openAccountant();
    await checkAssets("Главная бухгалтера");
    await page.locator(".chrome-header").getByRole("button", { name: "Сменить компанию: ООО «Циферблат»" }).click();
    await companyPanel.getByRole("heading", { name: "ООО «Циферблат»" }).waitFor();
    await companyPanel.getByRole("button", { name: /^ООО «Циферблат»/, pressed: true }).waitFor();
    await page.mouse.click(300, 300);
    await companyPanel.waitFor({ state: "detached" });
    // В отдельной загрузке проверяем рабочую шапку после снятия скелетона.
    entry.searchParams.set("skel", "on");
    entry.hash = "/accountant";
    await page.goto(entry.href);
    await waitForRoute("/accountant");
    await page.locator(".dash-gate.gate-ready .cur-content").waitFor();

    const expectAmounts = async (hidden) => {
      await page.getByRole("button", { name: hidden ? "Скрыть суммы" : "Показать суммы", pressed: true }).waitFor();
      await page.waitForFunction((expected) => {
        const amount = document.querySelector(".cur-bal-amount");
        const indicator = document.querySelector(".cur-seg-hl");
        return getComputedStyle(amount).filter === (expected ? "blur(12px)" : "none")
          && getComputedStyle(indicator).left === (expected ? "42px" : "2px");
      }, hidden);
    };
    await button("Скрыть суммы").click();
    await expectAmounts(true);
    await button("Бухгалтер").click();
    await page.getByRole("menuitemradio", { name: /^Предприниматель/ }).click();
    await waitForRoute("/");
    await openAccountant();
    await expectAmounts(true);
    await button("Показать суммы").click();
    await expectAmounts(false);

    await button("Выйти").click();
    await waitForRoute("/login");
    await button("Войти").waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("__alfaEntryState"))?.entered), false);
    await page.goto(entry.href);
    await waitForRoute("/login");
    await button("Войти").waitFor();
    assert.deepEqual(errors, [], "Ошибки браузера в статической сборке");
  } finally {
    for (const error of errors) console.error(error);
    await page.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const archive = fileURLToPath(new URL("../static-dist.zip", import.meta.url));
  const unpacked = await mkdtemp(join(tmpdir(), "alfa static QA "));
  let browser;
  try {
    execFileSync("unzip", ["-q", archive, "-d", unpacked], { stdio: "inherit" });
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME });
    await verifyStatic(browser, join(unpacked, "static-dist", "index.html"));
    console.log("OK: распакованный static-dist.zip открывается через file://, основной сценарий пройден");
  } finally {
    await browser?.close();
    await rm(unpacked, { recursive: true, force: true });
  }
}
