/* АВТОГЕН по макету Figma HL4PatufFZkyPKtx3LGivP, фрейм 136:18883 «С чего начать»
   (Corporate-дизайн дашборда бухгалтера). Классы cur-* и стили —
   styles/accountant.css; геометрия сверена с get_metadata 136:18900/….
   Правки контента — прямо в этой разметке. */

import { accounts, accountsTotal } from "@/data/accounts";
import { money, payments, shortDate, signed } from "@/data/payments";

const [primaryAccount] = accounts;

const DOTS = '<svg class="cur-dots" width="20" height="20" viewBox="0 0 20 20"><circle cx="4" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="16" cy="10" r="1.6"/></svg>';

/* Строки таблицы — из общего data/payments.ts (те же платежи, что у предпринимателя). */
const PAYMENT_ROWS = payments.map((p) => `  <div class="cur-tr${p.purpose.length > 80 ? " cur-tr-tall" : ""}">
    <div class="cur-tr-main">
      <div class="cur-td cur-td-ctrl"><span class="cur-cb"></span></div>
      <div class="cur-td cur-td-name">
        <span class="cur-tlogo"><img src="/assets/accountant/curTblRub.svg" width="24" height="24" alt=""></span>
        <div class="cur-tname">
          <span class="cur-tname-1">${p.title}</span>
          <span class="cur-tname-2">${p.bank === "Альфа-Банк" ? "АО «Альфа-Банк»" : p.bank} ··${p.account} (RUR)</span>
        </div>
      </div>
      <div class="cur-td cur-td-num">${p.docNumber}</div>
      <div class="cur-td cur-td-status"><span class="cur-status">Исполнен</span></div>
      <div class="cur-td cur-td-sum"><span class="cur-sum${p.amount > 0 ? " cur-sum-pos" : ""}">${signed(p.amount, " ", " ")}</span></div>
      <div class="cur-td cur-td-date">${shortDate(p.date)}</div>
      <div class="cur-td cur-td-act">${DOTS}</div>
    </div>
    <div class="cur-tr-purpose">${p.purpose}</div>
    <div class="cur-tr-border"></div>
  </div>
`).join("\n");

export const ACCOUNTANT_OVERVIEW_HTML = `<!-- Быстрые действия (byte-perfect из nefor-dash /current, Figma 132:34615) -->
<section class="cur-qa">
  <a class="cur-qa-btn">
    <span class="cur-qa-ico"><img src="/assets/accountant/curQaTopup.svg" width="20" height="20" alt=""></span>
    <span>Пополнить счёт</span>
  </a>
  <a class="cur-qa-btn">
    <span class="cur-qa-ico"><img src="/assets/accountant/curQaStatement.svg" width="20" height="20" alt=""></span>
    <span>Скачать выписку</span>
  </a>
  <a class="cur-qa-btn">
    <span class="cur-qa-ico"><img src="/assets/accountant/curQaCreatePay.svg" width="20" height="20" alt=""></span>
    <span>Создать платёж</span>
  </a>
  <a class="cur-qa-btn">
    <span class="cur-qa-ico"><img src="/assets/accountant/curQaImport.svg" width="20" height="20" alt=""></span>
    <span>Импорт платежей</span>
  </a>
  <a class="cur-qa-btn">
    <span class="cur-qa-ico"><img src="/assets/accountant/curQaInvoice.svg" width="20" height="20" alt=""></span>
    <span>Выставить счёт</span>
  </a>
  <a class="cur-qa-btn cur-qa-more">
    <span>Ещё</span>
  </a>
</section>

<!-- 1-й ряд: баланс + дела в работе + баннеры (byte-perfect из nefor-dash /current) -->
<section class="cur-row1">
  <div class="cur-balance">
    <div class="cur-bal-body">
      <div class="cur-bal-amount">${money(accountsTotal, " ")} ₽</div>
      <div class="cur-bal-bottom">
        <div class="cur-bal-connect">
          <div class="cur-bal-connect-main">
            <span class="cur-bal-ic cur-bal-ic-green"><img src="/assets/accountant/curBalPlus.svg" width="24" height="24" alt=""></span>
            <div class="cur-bal-connect-txt">
              <div class="cur-bal-connect-top">
                <span class="cur-bal-sum">500 000 ₽ </span>
                <span class="cur-badge-blue">Доступно к подключению</span>
              </div>
              <div class="cur-bal-connect-sub">Переводите себе бесплатно</div>
            </div>
          </div>
          <button class="cur-bal-x" aria-label="Скрыть">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="cur-bal-div"></div>
        <div class="cur-bal-accounts">
          <div class="cur-bal-acc">
            <span class="cur-bal-ic cur-bal-ic-gray"><img src="/assets/accountant/curBalRub.svg" width="24" height="24" alt=""></span>
            <div class="cur-bal-acc-txt">
              <span class="cur-bal-acc-name">Рублёвый счёт</span>
              <span class="cur-bal-acc-num">·· ${primaryAccount.number.slice(-4)}</span>
            </div>
          </div>
          <div class="cur-bal-acc">
            <span class="cur-bal-cardbox"><span class="cur-bal-card"></span></span>
            <div class="cur-bal-acc-txt">
              <span class="cur-bal-acc-name">Business One</span>
              <span class="cur-bal-acc-num">·· ${primaryAccount.card.slice(-4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="cur-bal-foot">
      <div class="cur-bal-foot-links">
        <a>Реквизиты</a>
        <a>Тарифы и подписки</a>
      </div>
      <div class="cur-bal-loyalty">
        100 <img src="/assets/accountant/curBalCircleA.svg" width="20" height="20" alt="">
      </div>
    </div>
  </div>

  <div class="cur-inwork">
    <div class="cur-iw-head">Дела в работе</div>
    <div class="cur-iw-list">
      <div class="cur-iw-row"><span>Оплатить</span><span class="cur-ind gray">1</span></div>
      <div class="cur-iw-row"><span>Подписать</span><span class="cur-ind red">3</span></div>
      <div class="cur-iw-row"><span>Отправить</span><span class="cur-ind gray">2</span></div>
      <div class="cur-iw-row cur-iw-zero"><span>Доработать</span><span class="cur-ind gray">0</span></div>
      <div class="cur-iw-row cur-iw-zero"><span>Отклонённые</span><span class="cur-ind gray">0</span></div>
      <div class="cur-iw-row"><span>Черновики</span><span class="cur-ind gray">1</span></div>
      <div class="cur-iw-row cur-iw-zero"><span>В работе у банка</span><span class="cur-ind gray">0</span></div>
    </div>
  </div>

  <div class="cur-banners">
    <div class="cur-ban b1">
      <div class="cur-ban-txt">
        <b>Зарплатный проект</b>
        <span>Новые условия<br>онлайн-инкассации</span>
      </div>
      <div class="cur-ban-img"><img src="/assets/accountant/acc-ban1-art.png" alt=""></div>
    </div>
    <div class="cur-ban b2">
      <div class="cur-ban-txt">
        <b>Выгодные условия</b>
        <span>Новые условия<br>онлайн-инкассации</span>
      </div>
      <div class="cur-ban-img"><img src="/assets/accountant/acc-ban2-art.png" alt=""></div>
    </div>
    <div class="cur-ban b3">
      <div class="cur-ban-txt">
        <b>Выгодные условия</b>
        <span>Новые условия<br>онлайн-инкассации</span>
      </div>
      <div class="cur-ban-img"><img src="/assets/accountant/acc-ban3-art.png" alt=""></div>
    </div>
  </div>
</section>`;

export const ACCOUNTANT_CARDS_HTML = `
    <div class="cur-card cur-card-entry">
      <img class="cur-card-entry-bg" src="/assets/accountant/acc-card-entry-bg.svg" alt="">
      <div class="cur-card-entry-head">
        <span>Все задания</span>
        <img src="/assets/accountant/acc-card-chevron.svg" width="20" height="20" alt="">
      </div>
      <div class="cur-card-entry-content">
        <span class="cur-card-entry-sub">0/7 выполнено</span>
        <div class="cur-progress"><i></i></div>
      </div>
      <div class="cur-card-entry-cap"><img src="/assets/accountant/acc-card-entry-img.png" alt=""></div>
    </div>
    <div class="cur-card cur-task">
      <div class="cur-task-title">Защитить бизнес<br>от блокировок</div>
      <div class="cur-task-meta">
        <span class="cur-task-pts">500<img src="/assets/accountant/curCardBonus.svg" width="20" height="20" alt=""></span>
        <span class="cur-task-min">1 мин</span>
      </div>
      <div class="cur-task-art art2"><img src="/assets/accountant/acc-card2-img.png" alt=""></div>
    </div>
    <div class="cur-card cur-task">
      <div class="cur-task-title">Пополнить счёт</div>
      <div class="cur-task-meta">
        <span class="cur-task-pts">500<img src="/assets/accountant/curCardBonus.svg" width="20" height="20" alt=""></span>
        <span class="cur-task-min">1 мин</span>
      </div>
      <div class="cur-task-art art3"><img src="/assets/accountant/acc-card3-img.png" alt=""></div>
    </div>
    <div class="cur-card cur-task">
      <div class="cur-task-title">Изучить условия тарифа</div>
      <div class="cur-task-meta">
        <span class="cur-task-pts">500<img src="/assets/accountant/curCardBonus.svg" width="20" height="20" alt=""></span>
        <span class="cur-task-min">1 мин</span>
      </div>
      <div class="cur-task-art art4"><img src="/assets/accountant/acc-card4-img.png" alt=""></div>
    </div>
    <div class="cur-card cur-task">
      <div class="cur-task-title">Переводить<br>без комиссии<br>с подпиской</div>
      <div class="cur-task-meta">
        <span class="cur-task-pts">500<img src="/assets/accountant/curCardBonus.svg" width="20" height="20" alt=""></span>
        <span class="cur-task-min">1 мин</span>
      </div>
      <div class="cur-task-art art5"><img src="/assets/accountant/acc-card5-img.png" alt=""></div>
    </div>
    <div class="cur-card cur-task">
      <div class="cur-task-title">Подключить<br>налоговую копилку</div>
      <div class="cur-task-meta">
        <span class="cur-task-pts">500<img src="/assets/accountant/curCardBonus.svg" width="20" height="20" alt=""></span>
        <span class="cur-task-min">1 мин</span>
      </div>
      <div class="cur-task-art art6"><img src="/assets/accountant/acc-card6-img.png" alt=""></div>
    </div>

`;

export const ACCOUNTANT_FEED_HTML = `<!-- Лента операций: заголовок + фильтры + таблица (byte-perfect из nefor-dash /current).
     Демо-строки запечены в разметку — правятся прямо здесь. -->
<h2 class="cur-title">Лента операций</h2>

<div class="cur-filters">
  <div class="cur-filters-row1">
    <div class="cur-datefield">
      <span class="cur-df-chev">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 7l-5 5 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="cur-df-label">Декабрь</span>
      <span class="cur-df-chev">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M10 7l5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="cur-df-cal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </span>
    </div>
    <div class="cur-search">
      <span class="cur-search-mag">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </span>
      <span class="cur-search-ph">Контрагент, ИНН, назначение платежа или номер счёта</span>
    </div>
  </div>
  <div class="cur-filters-row2">
    <button class="cur-ftag cur-ftag-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h9M15 6h2M3 14h2M9 14h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="14" cy="6" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="14" r="2" stroke="currentColor" stroke-width="1.6"/></svg>
    </button>
    <button class="cur-ftag">Входящие</button>
    <button class="cur-ftag">Исходящие</button>
    <button class="cur-ftag">Счёт<span class="cur-ftag-chev"></span></button>
    <button class="cur-ftag">Контрагент<span class="cur-ftag-chev"></span></button>
    <button class="cur-ftag">Статус</button>
    <button class="cur-ftag">Сумма</button>
  </div>
</div>

<div class="cur-topbar">
  <div class="cur-topbar-count">
    <span class="cur-tb-lbl">Всего</span>
    <span class="cur-tb-num">${payments.length}</span>
  </div>
  <button class="cur-topbar-set">
    <img src="/assets/accountant/curSetGear.svg" width="16" height="16" alt="">
    <span>Настройка</span>
  </button>
</div>

<div class="cur-table">
  <div class="cur-thead">
    <div class="cur-th cur-th-ctrl"><span class="cur-cb"></span></div>
    <div class="cur-th cur-th-name cur-th-div"><span>Название компании</span><span class="cur-th-chev"></span></div>
    <div class="cur-th cur-th-num cur-th-div"><span>Номер</span><span class="cur-th-chev"></span></div>
    <div class="cur-th cur-th-status cur-th-div"><span>Статус</span><span class="cur-th-chev"></span></div>
    <div class="cur-th cur-th-sum cur-th-div"><span>Сумма</span><span class="cur-th-chev"></span></div>
    <div class="cur-th cur-th-date cur-th-div"><span>Дата</span><span class="cur-th-chev"></span></div>
    <div class="cur-th cur-th-act"></div>
  </div>
  <div class="cur-thead-border"></div>

${PAYMENT_ROWS}
  <div class="cur-pagination"></div>
</div>
`;
