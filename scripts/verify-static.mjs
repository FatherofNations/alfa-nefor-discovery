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
  const dialog = page.getByRole("dialog", { name: "Имя клиента" });
  const input = dialog.getByRole("textbox", { name: "Имя клиента" });
  const save = dialog.getByRole("button", { name: "Сохранить" });
  const unlockDashboard = async () => {
    await page.locator(".dash-gate[data-clicks-locked='true']").waitFor();
    await page.keyboard.press("Space");
    await page.locator(".dash-gate[data-clicks-locked='false']").waitFor();
  };
  const scrollDown = async () => {
    await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
    await page.waitForFunction(() => scrollY > 0);
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
    await page.keyboard.press("/");
    await dialog.waitFor();
    await input.fill("соколова ольга сергеевна");
    await input.press("Enter");
    await dialog.waitFor({ state: "detached" });
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
    await page.keyboard.press("/");
    await dialog.waitFor();
    assert.equal(await input.inputValue(), "Соколова Ольга Сергеевна");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    await entrepreneur.click();
    await waitForRoute("/setup");
    await page.locator(".entry-setup").waitFor();
    await checkAssets("Настройка");
    await page.keyboard.press("/");
    await dialog.waitFor();
    assert.equal(await input.inputValue(), "Соколова Ольга Сергеевна");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    await waitForRoute("/");
    await page.locator(".dash-gate.gate-ready #hero-title").waitFor();
    await page.getByRole("heading", { name: /Ольга, добрый день/ }).waitFor();
    await checkAssets("Главная предпринимателя");

    const balance = page.locator("button.balance-cell");
    const details = page.getByRole("dialog", { name: "Детализация остатка" });
    const offer = page.getByRole("region", { name: "Заменили действие" });
    const template = button("Платёж по шаблону");
    await button("Импорт платежей").waitFor();
    await balance.click();
    assert.equal(await details.count(), 0, "Клики на открывшемся дашборде заблокированы");
    await page.mouse.move(800, 680);
    await page.mouse.wheel(0, 420);
    await page.waitForFunction(() => scrollY > 0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await unlockDashboard();

    await balance.click();
    await details.getByRole("button", { name: "К счетам" }).waitFor();
    await details.getByRole("button", { name: "Закрыть детализацию" }).click();
    await details.waitFor({ state: "detached" });
    await expectFocused(balance);
    assert.equal(await offer.count(), 0, "Закрытие детализации сохраняет исходное действие");
    await page.keyboard.press("Space");
    await page.locator(".dash-gate[data-clicks-locked='true']").waitFor();
    await page.keyboard.press("1");
    await offer.waitFor();
    await offer.getByRole("button", { name: "Оставить" }).click();
    assert.equal(await offer.count(), 1);
    await unlockDashboard();
    assert.equal(await template.evaluate((node) => getComputedStyle(node).color), "rgb(137, 126, 255)");
    await checkAssets("Предложение заменить быстрое действие");
    await offer.getByRole("button", { name: "Отклонить замену действия" }).click();
    await button("Импорт платежей").waitFor();
    await page.keyboard.press("1");
    await offer.getByRole("button", { name: "Оставить" }).click();
    await offer.waitFor({ state: "detached" });
    await expectFocused(template);
    assert.match(await template.locator("img").getAttribute("src"), /template-kept\.svg$/);
    await checkAssets("Сохранённое быстрое действие");

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
      if (name === "Счета на главной") {
        const masks = await page.locator(".accounts-panel .account-card-copy > span").allTextContents();
        assert.equal(masks.length, 2);
        assert.equal(new Set(masks).size, masks.length, "Маски разных карт должны отличаться");
      }
    }
    const trigger = tabs.getByRole("button", { name: "Ассистент", exact: true });

    // После сжатия шапки подложка раньше мигала второй раз с задержкой.
    await tabs.getByRole("button", { name: /^Сводка/ }).click();
    await tabs.locator(".tab-counter").waitFor({ state: "detached" });
    const starts = await trigger.evaluate(async (tab) => {
      const bar = tab.parentElement;
      const since = performance.now();
      const times = [];
      const record = (event) => {
        if (event.animationName === "tab-capsule-pop") times.push(performance.now() - since);
      };
      bar.addEventListener("animationstart", record);
      tab.click();
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      bar.removeEventListener("animationstart", record);
      return times;
    });
    assert.equal(starts.length, 1, "Подложка должна появляться один раз на выбор вкладки");
    assert(starts[0] < 450, `Подложка запустилась с задержкой ${Math.round(starts[0])} мс`);

    await trigger.focus();
    await page.keyboard.press("/");
    await dialog.waitFor();
    await expectFocused(dialog);
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
    await template.waitFor();
    await unlockDashboard();
    await balance.click();
    await details.getByRole("button", { name: "Закрыть детализацию" }).click();
    assert.equal(await offer.count(), 0);

    const companyTrigger = page.locator(".topbar").getByRole("button", { name: /Сменить компанию/ });
    await page.locator(".topbar").getByRole("button", { name: "Сменить компанию: ООО «Умные и свободные»" }).waitFor();
    await companyTrigger.click();
    const companyPanel = page.getByRole("dialog", { name: "Иванова Мария Петровна" });
    await companyPanel.waitFor();
    await companyPanel.getByRole("heading", { name: "ООО «Умные и свободные»" }).waitFor();
    await companyPanel.getByText("Руководитель", { exact: true }).waitFor();
    await checkAssets("Смена компании");
    assert.equal(await companyPanel.locator(".company-switcher-option").count(), 4);
    await page.keyboard.press("Escape");
    await companyPanel.waitFor({ state: "detached" });
    await expectFocused(companyTrigger);

    // Показываем прогрессивную загрузку после выбора и в headless Chromium.
    await page.evaluate(() => {
      const url = new URL(location.href);
      url.searchParams.set("skel", "on");
      history.replaceState(history.state, "", url);
    });
    await companyTrigger.click();
    await companyPanel.getByRole("button", { name: /^ООО «Циферблат»/ }).click();
    await companyPanel.waitFor({ state: "detached" });
    await page.locator(".dash-gate[aria-busy='true'] .gate-skeleton").waitFor();
    await page.locator(".dash-gate.gate-ready").waitFor();
    await page.locator(".topbar").getByRole("button", { name: "Сменить компанию: ООО «Циферблат»" }).waitFor();
    const balanceText = await balance.locator("strong").textContent();
    assert.equal(balanceText, "950 078,40 ₽");
    const logoOffsets = await page.locator(".operation-row").evaluateAll((rows) => rows.map((row) =>
      row.querySelector(".company-logo").getBoundingClientRect().top - row.querySelector(".operation-content").getBoundingClientRect().top));
    assert(logoOffsets.length > 0 && logoOffsets.every((top) => top === 0), "Логотипы должны совпадать с верхним краем строки");

    const openAccountant = async () => {
      await scrollDown();
      await page.locator(".topbar").getByRole("button", { name: "Предприниматель", exact: true }).click();
      await page.getByRole("menuitemradio", { name: /^Бухгалтер/ }).click();
      await waitForRoute("/accountant");
      await page.locator(".dash-gate.gate-ready .cur-content").waitFor();
      assert.equal(await page.evaluate(() => scrollY), 0);
      await unlockDashboard();
    };
    await openAccountant();
    await checkAssets("Главная бухгалтера");
    assert.equal(await page.locator(".cur-bal-amount").textContent(), balanceText);
    await page.locator(".chrome-header").getByRole("button", { name: "Сменить компанию: ООО «Циферблат»" }).click();
    await companyPanel.getByRole("heading", { name: "ООО «Циферблат»" }).waitFor();
    await companyPanel.getByText("Бухгалтер", { exact: true }).waitFor();
    const activeCompany = companyPanel.getByRole("button", { name: /^ООО «Циферблат»/, pressed: true });
    assert.equal(await activeCompany.evaluate((option) => getComputedStyle(option).padding), "16px 16px 20px 20px");
    await checkAssets("Смена компании на главной бухгалтера");
    await page.mouse.click(300, 300);
    await companyPanel.waitFor({ state: "detached" });
    await page.locator(".chrome-header").getByRole("button", { name: "Сменить компанию: ООО «Циферблат»" }).click();
    await companyPanel.getByRole("button", { name: /^ООО «Калуга Трейд»/ }).click();
    await page.locator(".dash-gate[aria-busy='true'] .gate-skeleton").waitFor();
    await page.locator(".dash-gate.gate-ready").waitFor();
    await waitForRoute("/accountant");
    await page.locator(".chrome-header").getByRole("button", { name: "Сменить компанию: ООО «Калуга Трейд»" }).waitFor();
    assert.equal(await page.locator(".cur-bal-amount").textContent(), balanceText);
    // В отдельной загрузке проверяем рабочую шапку после снятия скелетона.
    await page.reload();
    await waitForRoute("/accountant");
    await page.locator(".dash-gate.gate-ready .cur-content").waitFor();
    await unlockDashboard();

    entry.searchParams.set("skel", "on");
    entry.hash = "/accountant";

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
    await scrollDown();
    await button("Бухгалтер").click();
    await page.getByRole("menuitemradio", { name: /^Предприниматель/ }).click();
    await waitForRoute("/");
    await page.locator(".dash-gate.gate-ready .dashboard-page").waitFor();
    assert.equal(await page.evaluate(() => scrollY), 0);
    await unlockDashboard();
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
    assert.equal(await page.evaluate(() => sessionStorage.getItem("__alfaTemplatePaymentKept")), "1");
    await Promise.all([page.waitForEvent("load"), page.keyboard.press("Meta+Shift+R")]);
    await button("Войти").waitFor();
    assert.equal(await page.evaluate(() => sessionStorage.getItem("__alfaTemplatePaymentKept")), null);
    await page.keyboard.press("/");
    await dialog.waitFor();
    assert.equal(await input.inputValue(), "Иванова Мария Петровна");
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
