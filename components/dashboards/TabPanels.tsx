/* Панели вкладок «Сводка», «Счета на главной», «Тарифы и подписки».
   Геометрия и типографика — из design context фреймов 59:27766/59:32554/59:33713;
   глифы — из библиотеки @alfalab/icons-glyph (точные имена из Figma). */

import { accounts } from "@/data/accounts";
import { income, money, outcome } from "@/data/payments";

const asset = (name: string) => `/assets/figma/${name}`;

export function SummaryPanel() {
  return (
    <div className="dash-panel summary-panel">
      <section className="summary-card turnover-card">
        <span className="widget-badge widget-badge-new">Новое</span>
        <div className="widget-head">
          <h3>В декабре</h3>
          <img className="widget-chev" src={asset("chevron-right-card.svg")} alt="" />
        </div>
        <div className="turnover-body">
          <div className="turnover-amounts">
            <div className="turnover-money">
              <strong>{money(income, " ")}&nbsp;₽</strong>
              <span><em>Поступления</em><i className="dot dot-green" /></span>
            </div>
            <div className="turnover-money">
              <strong>{money(outcome, " ")}&nbsp;₽</strong>
              <span><em>Списания</em><i className="dot dot-red" /></span>
            </div>
          </div>
          <div className="turnover-chart" aria-hidden="true">
            <div className="turnover-bars"><i className="bar bar-green" style={{ height: 84 }} /><i className="bar bar-red" style={{ height: 21 }} /></div>
            <div className="turnover-bars"><i className="bar bar-green" style={{ height: 84 }} /><i className="bar bar-red" style={{ height: 21 }} /></div>
            <div className="turnover-bars"><i className="bar-dot bar-green" /><i className="bar-dot bar-red" /></div>
            <div className="turnover-bars"><i className="bar-dot bar-dot-empty" /><i className="bar-dot bar-dot-empty" /></div>
            <div className="turnover-bars"><i className="bar-dot bar-dot-empty" /><i className="bar-dot bar-dot-empty" /></div>
            <div className="turnover-dates"><span>1 сен</span><span>30 сен</span></div>
          </div>
        </div>
      </section>

      <section className="summary-card risk-card">
        <span className="widget-badge widget-badge-important">Важное</span>
        <div className="widget-head">
          <h3>Индикатор риска</h3>
          <img className="widget-chev" src={asset("chevron-right-card.svg")} alt="" />
        </div>
        <div className="risk-body">
          <div className="risk-gauge-wrap">
            <img className="risk-gauge-img" src={asset("risk-gauge.svg")} alt="" />
            <div className="risk-center">
              <img className="risk-flame" src={asset("risk-flame.svg")} alt="" />
              <p className="risk-title">Высокий риск</p>
              <p className="risk-sub">Действия компании нарушают<br />требования 115-ФЗ</p>
            </div>
          </div>
          <span className="summary-divider" />
          <div className="risk-rows">
            <div className="risk-row"><span>Контрагенты</span><span className="risk-icon"><img src={asset("ic-risk-flash.svg")} alt="" /></span></div>
            <div className="risk-row"><span>Налоговые платежи</span><span className="risk-icon"><img src={asset("ic-risk-flash.svg")} alt="" /></span></div>
            <div className="risk-row"><span>Хоз. платежи</span><span className="risk-icon risk-icon-lg"><img src={asset("ic-risk-exclaim.svg")} alt="" /></span></div>
            <div className="risk-row risk-row-more"><span>Ещё 4 критерия</span><span className="risk-icon" /></div>
          </div>
        </div>
      </section>

      <section className="summary-card credit-card">
        <div className="credit-top">
          <div className="credit-head">
            <h3>Кредиты</h3>
            <img className="widget-chev" src={asset("chevron-right-credit.svg")} alt="" />
          </div>
          <div className="credit-title">
            <strong>1 500 900,21&nbsp;₽</strong>
            <p>Осталось выплатить</p>
          </div>
        </div>
        <div className="credit-info">
          <div className="credit-success">
            <span className="credit-success-badge"><i /></span>
            <div className="credit-success-copy">
              <strong>Всё оплачено</strong>
              <span>Просрочек нет — так держать</span>
            </div>
          </div>
          <div className="credit-help-wrap">
            <span className="summary-divider" />
            <div className="credit-help-copy">
              <strong>Доступны кредитные каникулы</strong>
              <span>Оформить можно онлайн</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AccountsPanel() {
  return (
    <div className="dash-panel accounts-panel">
      <section className="accounts-card">
        {accounts.map((row) => (
          <div className="account-row" key={row.number}>
            <span className="account-icon"><img src={asset("rub-icon.svg")} alt="" /></span>
            <span className="account-copy">
              <strong>Рублёвый счёт</strong>
              <span>{row.number}</span>
            </span>
            <span className={`account-card${row.card ? "" : " account-card-empty"}`}>
              {row.card && (
                <>
                  <i className="account-card-glyph" aria-hidden="true"><img src={asset("account-card-image.png")} alt="" /></i>
                  <span className="account-card-copy">
                    <strong>Business One</strong>
                    <span>{row.card}</span>
                  </span>
                </>
              )}
            </span>
            <span className="account-amount">{money(row.balance, " ")}&nbsp;₽</span>
            <button className="account-more" type="button" aria-label="Действия со счётом"><img src={asset("ops-table-da23c.svg")} alt="" /></button>
          </div>
        ))}
        <div className="accounts-footer">
          <button className="accounts-more" type="button">К счетам</button>
        </div>
      </section>
    </div>
  );
}

const tariffRows = [
  { title: "Переводы юрлицам и ИП в другие банки", sub: "Осталось 7 переводов", value: "0 ₽", icon: "tariffs-imgFixer2.svg", accent: true },
  { title: "Переводы физлицам в другие банки", sub: "Осталось 300 000 ₽", value: "2,5% + 149 ₽", icon: "tariffs-imgFixer3.svg", accent: false },
  { title: "Снятие наличных", sub: "Осталось 300 000 ₽", value: "0 ₽", icon: "tariffs-imgFixer4.svg", accent: false },
];

export function TariffsPanel() {
  return (
    <div className="dash-panel tariffs-panel">
      <section className="tariffs-card">
        <div className="tariff-head">
          <div className="tariff-head-left">
            <strong>Условия</strong>
            <span className="tariff-link">Счёт ··5370 <img src={asset("tariffs-imgWrapper.svg")} alt="" /></span>
          </div>
          <img className="tariff-addon" src={asset("tariffs-imgFixer.svg")} alt="" />
        </div>
        <div className="tariff-content">
          <div className="tariff-headline">
            <div className="tariff-headline-inner">
              <div className="tariff-plan">
                <span className="tariff-plan-name">Тариф Простой</span>
                <div className="tariff-cost"><strong>0 ₽ </strong><span>в месяц</span></div>
              </div>
              <div className="tariff-subs">
                <span>Подписки не подключены</span>
                <button className="tariff-plus" type="button" aria-label="Подключить подписку"><img src={asset("tariffs-imgFixer1.svg")} alt="" /></button>
              </div>
            </div>
          </div>
          <div className="tariff-rows">
            {tariffRows.map((row) => (
              <div className="tariff-row" key={row.title}>
                <span className={`tariff-icon${row.accent ? " accent" : ""}`}><img src={asset(row.icon)} alt="" /></span>
                <span className="tariff-copy">
                  <span className="tariff-copy-row">
                    <strong>{row.title}</strong>
                    <span className="tariff-value">{row.value}</span>
                  </span>
                  <span className="tariff-copy-sub">{row.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="limits-card" aria-label="Лимиты компании">
        <div className="tariff-head">
          <strong className="limits-title">Лимиты компании</strong>
          <img className="tariff-addon" src={asset("tariffs-imgFixer.svg")} alt="" />
        </div>
        <div className="limits-content">
          <div className="limits-list">
            {[
              { title: "Переводы юрлицам", remaining: "150 000,11 ₽", fill: 124 },
              { title: "Переводы физлицам", remaining: "300 000 ₽", fill: 238 },
              { title: "Оплата картой", remaining: "300 000 ₽", fill: 238 },
            ].map((limit) => (
              <div className="limit-item" key={limit.title}>
                <span className="limit-label">{limit.title}</span>
                <strong className="limit-remaining">Осталось {limit.remaining}</strong>
                <span className="limit-track" aria-hidden="true"><i style={{ width: limit.fill }} /></span>
              </div>
            ))}
          </div>
          <span className="limits-more">Посмотреть всё</span>
        </div>
      </section>
    </div>
  );
}
