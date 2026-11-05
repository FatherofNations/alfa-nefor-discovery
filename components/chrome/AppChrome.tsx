/* Базовый хром страницы: боковое меню (fixed слева, 248) + шапка (fixed
   сверху, 56). Источник — макет Figma HL4PatufFZkyPKtx3LGivP, фрейм
   136:18883: [D] SideMenu 136:18896 и [D] Header 136:18898 (дизайн Corporate),
   геометрия — get_metadata 136:18896 / 136:18898.

   Ячейка меню: обёртка 248×48 (поля 12/4) → строка 224×40 с радиусом 12
   (.chrome-cell-in — поверхность hover/active/focus) → бокс иконки 32×32 с
   глифом 20 → подпись 14/20 medium. Геометрия и типографика в chrome.css. */

"use client";

import ChromeNavActive from "./NavActive";
import Link from "next/link";
import { useClientName } from "@/lib/client-name";

const A = "/assets/chrome/";

/* href есть только у свёрстанных страниц: пункт со ссылкой ведёт на роут и
   получает активное состояние, без href — инертен (см. NavActive). */
type NavItem = { icon: string; label: string; href?: string; dim?: boolean };

/* Порядок и состав — из инстанса [D] SideMenu 136:18896 (MCP get_metadata). */
const NAV_TOP: readonly NavItem[] = [
  { icon: "nav-all.svg", label: "Все сервисы" },
  { icon: "nav-bonus.svg", label: "Альфа-Выгодно" },
];

const NAV_MAIN: readonly NavItem[] = [
  { icon: "nav-pay.svg", label: "Новый платёж", dim: true },
  { icon: "nav-feed.svg", label: "Лента операций", dim: true },
  { icon: "nav-progress.svg", label: "Платежи в работе", dim: true },
  { icon: "nav-import.svg", label: "Импорт реестров", dim: true },
  { icon: "nav-statement.svg", label: "Выписка", dim: true },
  { icon: "nav-accounts.svg", label: "Счета", dim: true },
  { icon: "nav-contragents.svg", label: "Контрагенты", dim: true },
  { icon: "nav-certificates.svg", label: "Справки", dim: true },
  { icon: "nav-invoices.svg", label: "Счета на оплату", dim: true },
  { icon: "nav-cards.svg", label: "Карты", dim: true },
];

/* Внутренность ячейки — одна на все места, чтобы структура строки не
   разъезжалась между списком, «Госзакупками» и футером. */
function CellBody({ n, children }: { n: NavItem; children?: React.ReactNode }) {
  return (
    <span className="chrome-cell-in">
      <span className={n.dim ? "chrome-ico dim" : "chrome-ico"}>
        <img src={`${A}${n.icon}`} width="20" height="20" alt="" />
        {children}
      </span>
      <span className="chrome-cell-t">{n.label}</span>
    </span>
  );
}

function Cell({ n }: { n: NavItem }) {
  return n.href ? (
    <Link className="chrome-cell" href={n.href} data-nav={n.href}>
      <CellBody n={n} />
    </Link>
  ) : (
    <a className="chrome-cell" aria-disabled="true">
      <CellBody n={n} />
    </a>
  );
}

export default function AppChrome({ personLabel = "Предприниматель" }: { personLabel?: string }) {
  const clientName = useClientName();
  return (
    <>
      {/* ═══ Боковое меню ═══ */}
      <aside className="chrome-side">
        <ChromeNavActive />
        {/* Клик по логотипу ведёт на дашборд — как в продукте. Геометрия
            логоблока не меняется: ссылка display:block высотой 64. */}
        <Link className="chrome-logo" href="/" aria-label="Альфа-Бизнес — на главную">
          <img src={`${A}logo.svg`} width="248" height="64" alt="" />
          <img className="chrome-logo-grad" src={`${A}logo-grad.webp`} width="248" height="8" alt="" />
        </Link>

        <nav className="chrome-nav" aria-label="Основное меню">
          {NAV_TOP.map((n) => (
            <Cell n={n} key={n.label} />
          ))}
          <div className="chrome-div">
            <i />
          </div>
          {NAV_MAIN.map((n) => (
            <Cell n={n} key={n.label} />
          ))}
          <div className="chrome-div">
            <i />
          </div>
          {/* «Госзакупки» — слот Reccomended эталона: та же ячейка плюс
              пунктирная обводка вокруг иконки */}
          <a className="chrome-cell chrome-cell-proc" aria-disabled="true">
            <CellBody n={{ icon: "nav-procurement.svg", label: "Госзакупки", dim: true }}>
              <span className="chrome-proc-border" />
            </CellBody>
          </a>
        </nav>

        <div className="chrome-footer">
          <div className="chrome-footer-fade" />
          <a className="chrome-cell chrome-footer-cell" aria-disabled="true">
            <CellBody n={{ icon: "nav-gear.svg", label: "Настроить меню", dim: true }} />
          </a>
        </div>
      </aside>

      {/* ═══ Шапка ═══ */}
      <header className="chrome-header">
        <div className="chrome-hbtns">
          <button className="chrome-hbtn" aria-label="Письма">
            <img src={`${A}hdr-mail.svg`} width="20" height="20" alt="" />
          </button>
          <button className="chrome-hbtn" aria-label="Уведомления">
            <img src={`${A}hdr-bell.svg`} width="20" height="20" alt="" />
          </button>
        </div>
        <span className="chrome-hdiv" />
        <div className="chrome-company">
          <span className="chrome-co-logo" />
          <span className="chrome-co-info">
            <b>ООО «Город Нагатино»</b>
            <i>{clientName.headerLabel}</i>
          </span>
        </div>
        <span className="chrome-hdiv" />
        <button className="chrome-person">
          <span className="chrome-person-av" />
          <span className="chrome-person-t">{personLabel}</span>
        </button>
        <span className="chrome-hdiv" />
        <button className="chrome-hbtn" aria-label="Выйти">
          <img src={`${A}hdr-exit.svg`} width="20" height="20" alt="" />
        </button>
      </header>
    </>
  );
}
