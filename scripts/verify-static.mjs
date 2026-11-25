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
  const logosByCompany = new Map();
  const checkFeedLogos = async (feed, expectedUnique) => {
    const companies = await feed.locator(".operation-counterparty").evaluateAll(rows => rows.map(row => [
      row.querySelector(".operation-title").textContent,
      row.querySelector(".company-logo").getAttribute("src"),
    ]));
    assert.equal(new Set(companies.map(([, logo]) => logo)).size, expectedUnique);
    for (const [name, logo] of companies) {
      if (logosByCompany.has(name)) assert.equal(logo, logosByCompany.get(name), name);
      logosByCompany.set(name, logo);
    }
    assert.equal(new Set(logosByCompany.values()).size, logosByCompany.size, "Логотип закреплён за одной компанией во всех лентах");
  };
  const checkTaxPaymentLogo = async (feed) => {
    const logo = feed.locator(".operation-row", { hasText: "Единый налоговый платёж" }).locator(".company-logo");
    await logo.evaluate(async (image) => {
      await image.decode();
      const styles = getComputedStyle(image);
      const { width, height } = image.getBoundingClientRect();
      if (width !== 52 || height !== 52 || styles.padding !== "14px" ||
          styles.backgroundColor === "rgba(0, 0, 0, 0)" || styles.maskImage === "none") {
        throw new Error("Знак рубля должен быть по центру серой подложки 52 × 52 px");
      }
    });
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
    await button("Расходы за месяц").waitFor();
    await checkAssets("Главная предпринимателя");

    const headerPositions = await page.locator(".topbar-buttons").evaluate(async (row) => {
      const positions = [];
      for (const top of [0, 40, 64, 70, 84, 180, 70, 0]) {
        window.scrollTo({ top, behavior: "instant" });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        positions.push(Math.round(row.getBoundingClientRect().top));
      }
      return positions;
    });
    assert.deepEqual(headerPositions, [28, 28, 28, 22, 8, 8, 22, 28], "Положение шапки определяется прокруткой");

    const feedLink = page.getByRole("link", { name: "Лента операций", exact: true });
    const dashboardTabs = page.getByRole("navigation", { name: "Разделы главной" }).getByRole("button");
    const homeOperations = await page.locator("#operations .operation-title").allTextContents();
    await checkFeedLogos(page.locator("#operations"), 9);
    await checkTaxPaymentLogo(page.locator("#operations"));
    await page.keyboard.press("Space");
    assert.equal(await dashboardTabs.and(page.locator(":disabled")).count(), 4);
    await scrollDown();
    await feedLink.click();
    await waitForRoute("/operations");
    const feed = page.getByRole("region", { name: "Лента операций" });
    const feedHeading = feed.getByRole("heading", { name: "Лента операций", level: 1 });
    await feedHeading.waitFor();
    assert.equal(await feedHeading.evaluate(el =>
      el.getBoundingClientRect().top - document.querySelector(".topbar").getBoundingClientRect().bottom), 40);
    assert.equal(await feedLink.getAttribute("aria-current"), "page");
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.deepEqual(await feed.locator(".operation-title").allTextContents(), homeOperations);
    await checkFeedLogos(feed, 9);
    await checkTaxPaymentLogo(feed);
    await feed.getByRole("searchbox", { name: "Поиск операций" }).fill("Терравейт Логистика");
    assert.equal(await feed.locator(".operation-row").count(), 1);
    await checkAssets("Лента операций");
    await page.getByRole("link", { name: "Назад", exact: true }).click();
    await waitForRoute("/");
    await page.locator(".dash-gate.gate-ready #hero-title").waitFor();
    assert.equal(await dashboardTabs.and(page.locator(":enabled")).count(), 4, "После возврата вкладки доступны");

    const payLink = page.getByRole("link", { name: "Новый платёж" });
    await payLink.click();
    await waitForRoute("/new-payment");
    await page.getByRole("heading", { name: "Рублёвый платёж № 123457" }).waitFor();
    assert.equal(await payLink.getAttribute("aria-current"), "page");
    assert.deepEqual(await payLink.evaluate((link) => {
      const marker = getComputedStyle(link, "::after");
      const sidebar = link.closest(".sidebar");
      const sidebarInnerLeft = sidebar.getBoundingClientRect().left + sidebar.clientLeft;
      const markerLeft = link.getBoundingClientRect().left + parseFloat(marker.left);
      return [marker.width, marker.height, markerLeft - sidebarInnerLeft];
    }), ["2px", "36px", 0], "Индикатор активного пункта виден целиком внутри рамки меню");
    const form = page.getByRole("form", { name: /Рублёвый платёж/ });
    await form.getByRole("textbox", { name: "ФИО получателя*" }).fill("Иванов Иван Иванович");
    await form.getByRole("textbox", { name: "Сумма*" }).fill("42750,00");
    await form.getByRole("textbox", { name: "Назначение платежа*" }).fill("Оплата");
    await form.getByText("6/210 символов").waitFor();
    await form.getByRole("combobox", { name: "Счёт списания" }).selectOption({index: 1});
    await form.getByText("Рублёвый счёт ··5277").waitFor();
    await button("Без НДС").click();
    assert.equal(await button("Без НДС").getAttribute("aria-pressed"), "true");
    await checkAssets("Новый платёж");
    await scrollDown();
    await page.locator(".topbar").getByRole("link", { name: "Назад", exact: true }).click();
    await waitForRoute("/");
    await page.locator(".dash-gate.gate-ready #hero-title").waitFor();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "Возврат из платежа открывает верх главной");

    const assistant = page.getByRole("dialog", { name: "Альфа-Интеллект" });
    for (const [trigger, thread, answer] of [
      ["Расходы за октябрь выросли на 12%. Подготовил разбор и два изменения в законодательстве, на которые стоит обратить внимание Узнать больше", "Сводка", "Что разберём подробнее?"],
      ["Расходы за месяц", "Расходы за месяц", "Расходы за ноябрь 2026"],
    ]) {
      await button(trigger).click();
      await assistant.getByText(answer, { exact: true }).waitFor();
      assert.match(await assistant.locator(".assistant-conversation").evaluate(node => getComputedStyle(node).scrollbarColor), /rgba\(0, 0, 0, 0\)$/, `${thread}: дорожка скроллбара прозрачная`);
      assert.equal(await assistant.locator(".assistant-panel").evaluate(node => Math.round(node.getBoundingClientRect().right)), 1600, `${thread}: панель доходит до правого края экрана`);
      await assistant.locator("[aria-current='page']").getByText(thread, { exact: true }).waitFor();
      assert.equal(await assistant.locator(".assistant-recent li").count(), 10);
      const blocks = assistant.locator(thread === "Сводка" ? ".october-summary > *" : ".assistant-answer > p");
      const delays = await blocks.evaluateAll(nodes => nodes.slice(0, 2).map(node => node.getAnimations()[0]?.effect.getTiming().delay));
      assert.deepEqual(delays, [240, 295], `${thread}: первые два блока проявляются по очереди`);
      await checkAssets(thread);
      await page.keyboard.press("Escape");
      await assistant.waitFor({ state: "detached" });
      await expectFocused(button(trigger));
    }

    const balance = page.locator("button.balance-cell");
    const details = page.getByRole("dialog", { name: "Детализация остатка" });
    const offer = page.getByRole("region", { name: "Заменили действие" });
    const template = button("Платёж по шаблону");
    await button("Импорт платежей").waitFor();
    await balance.click();
    await details.getByRole("button", { name: "К счетам" }).waitFor();
    await details.getByRole("button", { name: "Закрыть детализацию" }).click();
    await page.locator("#account-details").waitFor({ state: "hidden" });
    await expectFocused(balance);
    assert.equal(await offer.count(), 0, "Закрытие детализации сохраняет исходное действие");
    await page.keyboard.press("Space");
    for (const tab of await dashboardTabs.all()) {
      assert(await tab.isDisabled());
      await tab.click({ force: true });
    }
    assert.equal(await dashboardTabs.and(page.locator("[aria-pressed='true']")).innerText(), "Ассистент");
    await balance.click();
    await details.getByRole("button", { name: "К счетам" }).waitFor();
    await details.getByRole("button", { name: "Закрыть детализацию" }).click();
    await details.waitFor({ state: "hidden" });
    await page.mouse.move(800, 680);
    await page.mouse.wheel(0, 420);
    await page.waitForFunction(() => scrollY > 0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));

    await page.keyboard.press("1");
    await offer.waitFor();
    assert.equal(await template.evaluate((node) => getComputedStyle(node).color), "rgb(137, 126, 255)");
    await checkAssets("Предложение заменить быстрое действие");
    await offer.getByRole("button", { name: "Отклонить замену действия" }).click();
    await button("Импорт платежей").waitFor();

    const tasks = page.getByRole("region", { name: "Мои дела" });
    const attention = tasks.getByRole("button", { name: /Требуют внимания/ });
    const signals = tasks.getByRole("list", { name: "Сигналы" });
    const expectCarouselState = async (disabled) => {
      await page.waitForFunction((isDisabled) => {
        const carousel = document.querySelector(".research-task-carousel");
        const columns = carousel?.querySelectorAll(".tasks-cards-column");
        return columns?.length > 0 &&
          Array.from(columns).every(column => column.inert === isDisabled && getComputedStyle(column).opacity === (isDisabled ? "0.5" : "1"));
      }, disabled);
    };
    await attention.hover();
    await signals.waitFor();
    await expectCarouselState(true);
    await tasks.getByRole("heading", { name: "Мои дела" }).hover();
    await signals.waitFor({ state: "hidden" });
    await expectCarouselState(false);

    await page.keyboard.press("Space");
    assert.equal(await dashboardTabs.and(page.locator(":enabled")).count(), 4);
    const accountsTab = dashboardTabs.filter({ hasText: "Счета на главной" });
    await accountsTab.click();
    assert.equal(await accountsTab.getAttribute("aria-pressed"), "true");
    await page.keyboard.press("1");
    await offer.getByRole("button", { name: "Оставить" }).click();
    await offer.waitFor({ state: "detached" });
    await expectFocused(template);
    assert.match(await template.locator("img").getAttribute("src"), /template-kept\.svg$/);
    await checkAssets("Сохранённое быстрое действие");

    await attention.hover();
    const creditLink = signals.getByRole("link", { name: "Кредитная линия" });
    await creditLink.waitFor();
    const overdueInTasks = await signals.getByText("1 332 000,00 ₽", { exact: true }).innerText();
    await attention.click();
    assert.equal(await attention.getAttribute("aria-expanded"), "true", "Клик мышью не закрывает список под курсором");
    await creditLink.hover();
    await expectCarouselState(true);
    await tasks.getByRole("heading", { name: "Мои дела" }).hover();
    await signals.waitFor({ state: "hidden" });
    await attention.press("Enter");
    await creditLink.waitFor();
    await page.keyboard.press("Escape");
    await signals.waitFor({ state: "hidden" });
    await expectFocused(attention);
    await attention.hover();
    await creditLink.waitFor();
    const pay = tasks.getByRole("button", { name: /^Подписать/ });
    const work = tasks.getByRole("list", { name: "Дела в работе" });
    const expectHighlight = async (category) => {
      const highlighted = await tasks.locator(".tasks-cards-signal, .tasks-cards-row").evaluateAll(
        (rows) => rows
          .filter((row) => getComputedStyle(row).backgroundColor !== "rgba(0, 0, 0, 0)")
          .map((row) => row.getAttribute("data-tasks-trigger")),
      );
      assert.deepEqual(highlighted, [category], "Серый фон есть только у активной категории");
    };
    await pay.hover();
    await work.getByRole("link", { name: "Рублёвые платежи" }).waitFor();
    assert.equal(await signals.count(), 0);
    await expectCarouselState(true);
    await expectHighlight("sign");
    await tasks.getByRole("button", { name: /^Доработать/ }).hover();
    await work.getByText("Ожидают идентификации", { exact: true }).waitFor();
    await expectHighlight("revise");
    await work.hover();
    await expectHighlight("revise");
    await pay.hover();
    await work.getByRole("link", { name: "Рублёвые платежи" }).waitFor();
    await pay.click();
    await expectHighlight("sign");
    await tasks.getByRole("heading", { name: "Мои дела" }).hover();
    await work.waitFor({ state: "hidden" });
    await expectCarouselState(false);
    await pay.press("Enter");
    await work.getByRole("link", { name: "Рублёвые платежи" }).waitFor();
    await page.keyboard.press("Escape");
    await work.waitFor({ state: "hidden" });
    await expectFocused(pay);
    await expectCarouselState(false);

    const more = tasks.getByRole("button", { name: /^Ещё/ });
    await more.click();
    const allTasks = tasks.getByRole("region", { name: "Все дела" });
    await allTasks.getByText("Черновики").waitFor();
    const hide = tasks.getByRole("button", { name: "Скрыть" });
    await expectFocused(hide);
    assert.deepEqual(await allTasks.locator(".tasks-work-list .tasks-cards-row-label").allTextContents(), [
      "Подписать", "Отправить", "В работе у банка", "Отклонённые", "Доработать", "Черновики",
    ]);
    for (const title of ["Отправить", "В работе у банка"]) {
      await allTasks.getByText(title, { exact: true }).hover();
      assert.equal(await allTasks.locator(".tasks-cards-row[aria-disabled='true']").filter({ hasText: title }).count(), 1);
      assert.equal(await work.count(), 0);
    }
    await pay.hover();
    await work.getByText("Валютные платежи", { exact: true }).waitFor();
    await expectHighlight("sign");
    await allTasks.getByText("Отправить", { exact: true }).hover();
    await work.waitFor({ state: "hidden" });
    for (const [category, title, item] of [
      ["rejected", "Отклонённые", "Реестры платежей"],
      ["revise", "Доработать", "Ожидают идентификации"],
      ["drafts", "Черновики", "Реестры платежей"],
    ]) {
      const row = allTasks.getByRole("button", { name: new RegExp(`^${title}`) });
      await row.hover();
      await work.getByText(item, { exact: true }).waitFor();
      assert.equal(await row.getAttribute("aria-expanded"), "true");
      await expectHighlight(category);
    }
    await tasks.getByRole("heading", { name: "Мои дела" }).click();
    await work.waitFor({ state: "hidden" });
    await allTasks.waitFor({ state: "hidden" });
    await more.click();
    await allTasks.getByRole("button", { name: /^Черновики/ }).hover();
    await work.getByRole("link", { name: "Рублёвые платежи" }).waitFor();
    await page.keyboard.press("Escape");
    await work.waitFor({ state: "hidden" });
    await expectFocused(allTasks.getByRole("button", { name: /^Черновики/ }));
    await hide.click();
    await allTasks.waitFor({ state: "hidden" });
    await expectFocused(more);

    const backToTasks = async () => {
      await page.getByRole("link", { name: "Назад", exact: true }).click();
      await waitForRoute("/");
      await tasks.waitFor();
      assert.equal(await page.evaluate(() => window.scrollY), 0, "Возврат на главную открывает верх страницы");
    };
    const checkFeedFilters = async (status) => {
      const indicator = page.getByRole("img", { name: `Применены фильтры: ${status}, рублёвые платежи` });
      await indicator.waitFor();
      assert.equal(await indicator.locator(".research-feed-filter-indicator").count(), 1);
      await indicator.click();
      assert.equal(await page.getByRole("combobox", { name: "Статус" }).count(), 0);
      assert.deepEqual([...new Set(await page.locator(".research-operations .operation-status").allTextContents())], [status]);
      await page.getByRole("searchbox", { name: "Поиск операций" }).press("Tab");
      await expectFocused(button("Скачать"));
    };
    await pay.hover();
    await work.getByRole("link", { name: "Рублёвые платежи" }).click();
    await waitForRoute("/research/sign");
    await checkFeedFilters("На подпись");
    assert.equal(await page.locator(".research-operations .operation-row").count(), 10);
    await checkFeedLogos(page.locator(".research-operations"), 8);
    await page.getByRole("searchbox", { name: "Поиск операций" }).fill("Петрова");
    assert.equal(await page.locator(".research-operations .operation-row").count(), 3);
    await checkAssets("Рублёвые платежи на подпись");
    await backToTasks();

    await more.click();
    await allTasks.getByRole("button", { name: /^Черновики/ }).hover();
    await page.waitForFunction(() => {
      const overlay = document.querySelector('[data-tasks-layer="work"][data-open="true"]');
      return overlay && getComputedStyle(overlay).transform === "none" && getComputedStyle(overlay).opacity === "1";
    });
    await work.getByRole("link", { name: "Рублёвые платежи" }).click();
    await waitForRoute("/research/drafts");
    await checkFeedFilters("Черновик");
    assert.equal(await page.locator(".research-operations .operation-row").count(), 8);
    await checkFeedLogos(page.locator(".research-operations"), 8);
    await checkAssets("Черновики рублёвых платежей");
    await backToTasks();

    await attention.hover();
    await creditLink.click();
    await waitForRoute("/research/credit");
    const creditHeading = page.getByRole("heading", { name: "Кредитная линия № 07XW2L" });
    await creditHeading.waitFor();
    assert.equal(await creditHeading.evaluate(el =>
      el.getBoundingClientRect().top - document.querySelector(".topbar").getBoundingClientRect().bottom), 40);
    await page.getByText("Просрочено 1 332 000,00 ₽", { exact: true }).waitFor();
    await backToTasks();

    const previousTasks = tasks.getByRole("button", { name: "Предыдущие задания" });
    const nextTasks = tasks.getByRole("button", { name: "Следующие задания" });
    assert(await previousTasks.isDisabled());
    await nextTasks.click();
    await page.waitForFunction(() => document.querySelector(".research-task-carousel")?.scrollLeft === 328);
    await nextTasks.click();
    await page.waitForFunction(() => document.querySelector(".research-task-carousel")?.scrollLeft === 656);
    assert(await nextTasks.isDisabled());
    assert(await previousTasks.isEnabled());
    assert.equal(await tasks.locator(".tasks-cards-body").getAttribute("data-fade-left"), "true");
    const firstTask = tasks.locator(".tasks-cards-important");
    assert.equal(await firstTask.evaluate(el =>
      el.getBoundingClientRect().right < el.parentElement.getBoundingClientRect().left), true);
    await tasks.getByRole("link", { name: "Все задания" }).click();
    await waitForRoute("/research/rewards");
    await backToTasks();
    assert(await previousTasks.isDisabled());
    assert(await nextTasks.isEnabled());
    await nextTasks.click();
    await page.waitForFunction(() => document.querySelector(".research-task-carousel")?.scrollLeft === 328);
    await page.reload();
    await tasks.waitFor();
    assert(await previousTasks.isDisabled());
    await tasks.getByRole("button", { name: /^Подключить индикатор риска/ }).click();
    const riskIntro = page.getByRole("dialog", { name: "Оцените риски для вашего бизнеса" });
    await riskIntro.getByRole("link", { name: "Узнать больше" }).click();
    await waitForRoute("/research/risk");
    await checkAssets("Индикатор риска");
    await page.getByRole("button", { name: "Подключить бесплатно" }).first().click();
    const completed = page.getByRole("dialog", { name: "Задание выполнено" });
    await completed.getByRole("link", { name: "На Главную" }).click();
    await waitForRoute("/");
    await tasks.waitFor();
    assert(await previousTasks.isDisabled());
    const lastReward = tasks.locator(".tasks-cards-column").last().locator(".tasks-cards-task").nth(1);
    await lastReward.getByText("500 получено", { exact: true }).waitFor();
    assert.equal(await lastReward.getAttribute("data-completed"), "true");
    assert.equal(await lastReward.locator('img[src$="widget-points-received.svg"]').count(), 1);

    await tasks.getByRole("button", { name: /^Заполнить СНИЛС/ }).click();
    await page.getByRole("dialog", { name: "Заполните СНИЛС" }).getByRole("link", { name: "В профиль" }).click();
    await waitForRoute("/research/profile");
    const snils = page.getByRole("dialog", { name: "Добавление СНИЛС" });
    await snils.waitFor();
    assert.equal((await snils.boundingBox()).width, 600);
    const snilsInput = snils.getByRole("textbox", { name: "СНИЛС" });
    const snilsSave = snils.getByRole("button", { name: "Сохранить" });
    assert.equal(await snilsInput.inputValue(), "48273165910");
    assert.equal(await snilsSave.isEnabled(), true);
    await snilsInput.fill("123");
    assert.equal(await snilsSave.isDisabled(), true);
    await snilsInput.fill("123-456-789 01");
    assert.equal(await snilsInput.inputValue(), "12345678901");
    await snilsSave.click();
    await completed.getByRole("link", { name: "На Главную" }).click();
    await waitForRoute("/");
    await tasks.waitFor();
    assert(await previousTasks.isDisabled());
    const lastService = tasks.locator(".tasks-cards-column > .tasks-cards-task:nth-child(3)").last();
    await lastService.getByText("Выполнено", { exact: true }).waitFor();
    assert.equal(await lastService.getAttribute("data-completed"), "true");
    await tasks.getByRole("link", { name: "Все задания" }).click();
    await waitForRoute("/research/rewards");
    await page.getByText("12 500", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Архив", exact: true }).click();
    await page.getByText("Заполнить СНИЛС · Выполнено").waitFor();
    await backToTasks();

    const tabs = page.locator(".tabs");
    for (const name of ["Сводка", "Счета на главной", "Тарифы и подписки", "Ассистент"]) {
      const tab = tabs.getByRole("button", { name: new RegExp(`^${name}`) });
      await tab.click();
      await tabs.getByRole("button", { name: new RegExp(`^${name}`), pressed: true }).waitFor();
      await page.locator(".tab-stage.phase-idle").waitFor();
      await checkAssets(name);
      if (name === "Сводка") {
        const summary = page.locator(".summary-panel");
        await summary.getByText("Высокий риск", { exact: true }).waitFor();
        await summary.getByText("Есть просрочка", { exact: true }).waitFor();
        assert.equal(await summary.getByRole("img", { name: "Требует внимания" }).count(), 3);
        assert.equal(await summary.locator(".risk-card .widget-badge").textContent(), "Важное");
        assert.equal(await summary.locator(".turnover-card .widget-badge").count(), 0);
        const overdueInSummary = await summary.locator(".credit-overdue strong").innerText();
        assert.equal(overdueInSummary.replace(/\s/g, " "), overdueInTasks, "Просрочка в Сводке совпадает с Моими делами");
      }
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
