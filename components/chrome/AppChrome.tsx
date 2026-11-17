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
import { useMenuDnd } from "@/lib/menuOrder";

const A = "/assets/chrome/";

/* href есть только у свёрстанных страниц: пункт со ссылкой ведёт на роут и
   получает активное состояние, без href — инертен (см. NavActive). */
type NavItem = { id: string; icon: string; label: string; href?: string; dim?: boolean; proc?: boolean };

/* Порядок и состав — из инстанса [D] SideMenu 136:18896 (MCP get_metadata). */
const NAV_TOP: readonly NavItem[] = [
  { id: "all", icon: "nav-all.svg", label: "Все сервисы" },
  { id: "bonus", icon: "nav-bonus.svg", label: "Альфа-Выгодно" },
];

/* Перетаскиваемые пункты по id; порядок и зоны — в lib/menuOrder.ts (INITIAL.accountant). */
const NAV_ITEMS: Record<string, NavItem> = Object.fromEntries(([
  { id: "pay", icon: "nav-pay.svg", label: "Новый платёж", dim: true },
  { id: "feed", icon: "nav-feed.svg", label: "Лента операций", dim: true },
  { id: "progress", icon: "nav-progress.svg", label: "Платежи в работе", dim: true },
  { id: "import", icon: "nav-import.svg", label: "Импорт реестров", dim: true },
  { id: "statement", icon: "nav-statement.svg", label: "Выписка", dim: true },
  { id: "accounts", icon: "nav-accounts.svg", label: "Счета", dim: true },
  { id: "contragents", icon: "nav-contragents.svg", label: "Контрагенты", dim: true },
  { id: "certificates", icon: "nav-certificates.svg", label: "Справки", dim: true },
  { id: "invoices", icon: "nav-invoices.svg", label: "Счета на оплату", dim: true },
  { id: "cards", icon: "nav-cards.svg", label: "Карты", dim: true },
  { id: "procurement", icon: "nav-procurement.svg", label: "Госзакупки", dim: true, proc: true },
] as NavItem[]).map((n) => [n.id, n]));

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

function Cell({ n, fixed }: { n: NavItem; fixed?: "top" | "bottom" }) {
  const dnd = fixed ? { "data-menu-id": n.id, "data-menu-fixed": fixed === "bottom" ? "bottom" : "" } : { "data-menu-id": n.id };
  const cls = n.proc ? "chrome-cell chrome-cell-proc" : "chrome-cell";
  const body = (
    <CellBody n={n}>{n.proc && <span className="chrome-proc-border" />}</CellBody>
  );
  return n.href ? (
    <Link className={cls} href={n.href} data-nav={n.href} draggable={false} {...dnd}>
      {body}
    </Link>
  ) : (
    /* tabIndex: без href ссылка не фокусируется, а пункт должен переставляться с клавиатуры */
    <a className={cls} aria-disabled="true" tabIndex={fixed ? undefined : 0} draggable={false} {...dnd}>
      {body}
    </a>
  );
}

export default function AppChrome({ personLabel = "Предприниматель" }: { personLabel?: string }) {
  const clientName = useClientName();
  const menu = useMenuDnd("accountant");
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

        <nav className="chrome-nav" aria-label="Основное меню" ref={menu.rootRef as React.Ref<HTMLElement>} data-menu-root="accountant">
          {NAV_TOP.map((n) => (
            <Cell n={n} fixed="top" key={n.id} />
          ))}
          <div className="chrome-div">
            <i />
          </div>
          <div data-menu-zone="main">
            {menu.state.main.map((id) => <Cell n={NAV_ITEMS[id]} key={id} />)}
          </div>
          <div className="chrome-folder">
            <a
              className="chrome-cell chrome-folder-cell"
              role="button"
              tabIndex={0}
              data-menu-folder=""
              aria-expanded={menu.state.folderOpen}
              aria-controls="chrome-folder-body"
              onClick={menu.toggleFolder}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); menu.toggleFolder(); } }}
            >
              <CellBody n={{ id: "more", icon: menu.state.folderOpen ? "nav-more-up.svg" : "nav-more.svg", label: "Ещё" }} />
            </a>
            <div className="chrome-folder-body" id="chrome-folder-body" data-menu-folder-body="" data-open={menu.state.folderOpen ? "true" : "false"} inert={!menu.state.folderOpen}>
              <div data-menu-zone="folder">
                {menu.state.folder.map((id) => <Cell n={NAV_ITEMS[id]} key={id} />)}
                {menu.state.folder.length === 0 && <p className="menu-folder-empty">Перетащите разделы сюда, чтобы скрыть их из меню</p>}
              </div>
            </div>
          </div>
          <div className="chrome-div">
            <i />
          </div>
          {/* Госзакупки с пунктирной обводкой: всегда под «Ещё», не двигается и не скрывается */}
          <Cell n={NAV_ITEMS.procurement} fixed="bottom" />
          <span data-menu-drop-line="" hidden />
          <span className="menu-dnd-live" data-menu-live="" aria-live="polite" />
        </nav>

        <div className="chrome-footer">
          <div className="chrome-footer-fade" />
          <a className="chrome-cell chrome-footer-cell" aria-disabled="true">
            <CellBody n={{ id: "settings", icon: "nav-gear.svg", label: "Настроить меню", dim: true }} />
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
          <span className={`chrome-person-av${personLabel === "Бухгалтер" ? " chrome-person-av-accountant" : ""}`} />
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
