/* Панели вкладок «Сводка», «Счета на главной», «Тарифы и подписки».
   Геометрия и типографика — из design context фреймов 59:27766/59:32554/59:33713;
   глифы — из библиотеки @alfalab/icons-glyph (точные имена из Figma). */

import { accounts } from "@/data/accounts";
import { income, money, outcome } from "@/data/payments";
import { creditLineOverdueAmount } from "@/data/research";

const asset = (name: string) => `/assets/figma/${name}`;
const riskCriteria = [
  { label: "Контрагенты", icon: "alert", size: 16 },
  { label: "Налоговые платежи", icon: "alert", size: 16 },
  { label: "Хоз. платежи", icon: "warning", size: 20 },
];

export function SummaryPanel() {
  return (
    <div className="dash-panel summary-panel">
      <section className="summary-card turnover-card">
        <div className="widget-head">
          <h3>В ноябре</h3>
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
            <div className="turnover-dates"><span>17 ноя</span><span>20 ноя</span></div>
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
            <img className="risk-gauge-img" src={asset("summary-risk-high-gauge.svg")} alt="" />
            <img className="risk-flame" src={asset("summary-risk-flame.svg")} alt="" />
            <div className="risk-center">
              <p className="risk-title">Высокий риск</p>
              <p className="risk-sub">Действия компании нарушают требования 115-ФЗ</p>
            </div>
          </div>
          <span className="summary-divider" />
          <div className="risk-rows">
            {riskCriteria.map(({ label, icon, size }) => (
              <div className="risk-row" key={label}>
                <span>{label}</span>
                <span className="risk-criterion-icon"><img src={asset(`summary-risk-${icon}.svg`)} width={size} height={size} alt="Требует внимания" /></span>
              </div>
            ))}
            <div className="risk-row risk-row-more">Ещё 4 критерия</div>
          </div>
        </div>
      </section>

      <section className="summary-card credit-card">
        <span className="widget-badge widget-badge-important">Важное</span>
        <div className="credit-top">
          <div className="credit-head">
            <h3>Кредиты</h3>
            <img className="widget-chev" src={asset("chevron-right-credit.svg")} alt="" />
          </div>
          <div className="credit-title">
            <strong>1 500 900,21 ₽</strong>
            <p>Осталось выплатить</p>
          </div>
        </div>
        <div className="credit-info">
          <div className="credit-overdue">
            <span className="credit-overdue-badge">Есть просрочка</span>
            <div className="credit-title">
              <strong>{money(creditLineOverdueAmount, " ")} ₽</strong>
              <p>25 дней, кредитная линия</p>
            </div>
          </div>
          <div className="credit-help-wrap">
            <span className="summary-divider" />
            <div className="credit-help-copy">
              <strong>Поможем погасить долг</strong>
              <span>Снизим кредитную нагрузку</span>
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
