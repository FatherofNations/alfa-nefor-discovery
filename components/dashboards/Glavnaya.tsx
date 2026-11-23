"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { accountsCountLabel, accountsTotal } from "@/data/accounts";
import { money } from "@/data/payments";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { menuItems } from "@/data/demo";
import { AccountsPanel, SummaryPanel, TariffsPanel } from "@/components/dashboards/TabPanels";
import { hasEntered, prepareDashboardRoleChange, resetEntry } from "@/lib/entry-session";
import { hasKeptTemplatePayment, setTemplatePaymentKept } from "@/lib/quick-actions";
import { canUsePrototypeShortcut } from "@/lib/prototype-shortcuts";
import { useClientName } from "@/lib/client-name";
import AssistantBar from "@/components/chrome/AssistantBar";
import CompanySwitcher from "@/components/chrome/CompanySwitcher";
import OperationsFeed, { downloadOperations } from "./OperationsFeed";
import NewPaymentForm from "./NewPaymentForm";
import TasksWidget from "./TasksWidget";
import ResearchScreens from "./ResearchScreens";
import type { ResearchScreen } from "@/data/research";
import AssistantHome from "@/components/dashboards/AssistantHome";
import { AssistantConversation, AssistantThreadMenu, threadAssets, type AssistantTopic } from "./AssistantThreads";
import { useMenuDnd } from "@/lib/menuOrder";

const asset = (name: string) => `/assets/figma/${name === "ops-table-ec6f5.png" ? name : name.replace(".png", ".webp")}`;
const balanceLabel = `${money(accountsTotal, " ")}\u2009₽`;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`icon ${className}`} src={asset(name)} alt="" aria-hidden="true" />;
}

function Indicator({ value, small = false }: { value: number; small?: boolean }) {
  return <span className={`indicator${small ? " indicator-small" : ""}`}>{value}</span>;
}

function AccountRow({ label, value, info, muted, children }: {
  label: string;
  value?: string;
  info?: boolean;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="account-panel-row">
      <span className="account-panel-label">{label}{info && <img className="account-panel-info" src="/assets/figma/info-icon.svg" alt="" />}</span>
      <span className="account-panel-right">
        {value && <span className={`account-panel-amount${muted ? " muted" : ""}`}>{value}</span>}
        {children}
      </span>
    </div>
  );
}

function RoleChip({ role, open, onToggle, triggerRef }: {
  role: "entrepreneur" | "accountant";
  open: boolean;
  onToggle: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button className="person-select" type="button" ref={triggerRef} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
      <span className="person-avatar">
        {role === "entrepreneur"
          ? <img src="/assets/figma/person-avatar.png" srcSet="/assets/figma/person-avatar@2x.png 2x" alt="" />
          : <img className="person-avatar-photo" src="/assets/figma/role-accountant.png" alt="" />}
      </span>
      <span>{role === "entrepreneur" ? "Предприниматель" : "Бухгалтер"}</span>
    </button>
  );
}

function MenuItem({ id, label, icon, muted, loyalty, href, secondary, fixed, current }: {
  id: string;
  label: string;
  icon: string;
  muted?: boolean;
  loyalty?: boolean;
  href?: string;
  secondary?: boolean;
  fixed?: "top" | "bottom";
  current?: boolean;
}) {
  const shared = {
    className: `menu-item${secondary ? " menu-secondary" : ""}`,
    "data-menu-id": id,
    "data-menu-fixed": fixed === "bottom" ? "bottom" : fixed ? "" : undefined,
  };
  const body = (
    <>
      <span className={`menu-item-icon${muted ? " muted" : ""}`}><Icon name={icon} /></span>
      <span>{label}</span>
      {loyalty && <span className="loyalty">100<Icon name="menu-a8252.svg" /></span>}
    </>
  );
  if (href) {
    return <Link {...shared} href={href} aria-current={current ? "page" : undefined} draggable={false}>{body}</Link>;
  }
  return (
    <button {...shared} type="button">
      {body}
    </button>
  );
}

/* Пункты левого меню по id: «Все сервисы» и «Альфа-Выгодно» неподвижны,
   порядок остальных и содержимое «Ещё» — в lib/menuOrder.ts (INITIAL.entrepreneur). */
const MENU_IDS = ["all", "bonus", "pay", "feed", "progress"] as const;
const MENU_BY_ID: Record<string, { label: string; icon: string; muted?: boolean; loyalty?: boolean; href?: string; secondary?: boolean }> = {
  ...Object.fromEntries(menuItems.map((item, i) => [MENU_IDS[i], item])),
  procurement: { label: "Госзакупки", icon: "menu-52c45.svg", muted: true, secondary: true },
  deposits: { label: "Депозиты", icon: "menu-353cb.svg", muted: true, secondary: true },
};
const MENU_FIXED = ["all", "bonus"] as const;
/* Пункты с пунктирной обводкой: всегда под «Ещё», не двигаются и не скрываются. */
const MENU_BOTTOM = ["procurement", "deposits"] as const;

const TABS = ["Ассистент", "Сводка", "Счета на главной", "Тарифы и подписки"];

/* Ширины шапки табов в макетах табло: 556 (Сводка), 558 (Счета), 559 (Тарифы)
   — кадры 59:27766 / 59:32554 / 59:33713; в кадре ассистента 585 с бейджем. */
const COMPACT_CLASS: Record<string, string> = {
  "Сводка": "summary",
  "Счета на главной": "accounts",
  "Тарифы и подписки": "tariffs",
};

/* Высота сцены вкладки = отступ + высота панели (включая field 36/40),
   чтобы смена вкладки анимировала height, а «Мои дела» ехали плавно. */
const TAB_HEIGHTS: Record<string, number> = {
  "Ассистент": 232,
  "Сводка": 424,
  "Счета на главной": 395,
  "Тарифы и подписки": 432,
};

export default function Glavnaya({ payment = false, operations = false, research }: { payment?: boolean; operations?: boolean; research?: ResearchScreen }) {
  const router = useRouter();
  const currentMenuItem = payment ? "pay" : operations ? "feed" : undefined;
  const innerPage = Boolean(research || operations);
  const [activeTab, setActiveTab] = useState("Ассистент");
  const logout = useCallback(() => {
    resetEntry();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!hasEntered()) router.replace("/login");
  }, [router]);
  const clientName = useClientName();
  const menu = useMenuDnd("entrepreneur");
  const [shownTab, setShownTab] = useState("Ассистент");
  const [tabPhase, setTabPhase] = useState<"idle" | "out" | "in-prep" | "in">("idle");
  const tabTimers = useRef<number[]>([]);
  const [counter, setCounter] = useState<"shown" | "hiding" | "gone">("shown");
  const [accountOpen, setAccountOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<"import" | "suggested" | "kept">("import");
  const suggestTemplate = quickAction === "suggested";
  const showTemplate = suggestTemplate || quickAction === "kept";
  const fileRef = useRef<HTMLInputElement>(null);
  const quickActionRef = useRef<HTMLButtonElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPanelRef = useRef<HTMLElement>(null);
  const accountCloseRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (hasKeptTemplatePayment()) setQuickAction("kept");
  }, []);

  const closeAccount = useCallback(() => {
    setAccountOpen(false);
    accountTriggerRef.current?.focus({ preventScroll: true });
  }, []);
  const resolveTemplateSuggestion = (keep: boolean) => {
    if (keep) setTemplatePaymentKept(true);
    setQuickAction(keep ? "kept" : "import");
    quickActionRef.current?.focus();
  };
  /* closed → open → closing → closed; closing держит DOM для sink-анимации */
  const [assistantPhase, setAssistantPhase] = useState<"closed" | "open" | "closing">("closed");
  const assistantOpen = assistantPhase !== "closed";
  /* is-shown ставится кадром позже маунта: подъём/опускание — CSS transition,
     поэтому быстрый реверс и повторный клик продолжают движение с текущей точки. */
  const [assistantShown, setAssistantShown] = useState(false);
  const assistantCloseRef = useRef<HTMLButtonElement>(null);
  const [assistantTopic, setAssistantTopic] = useState<AssistantTopic>("expenses");
  const assistantReturnRef = useRef<HTMLButtonElement | null>(null);
  const [assistantFlip, setAssistantFlip] = useState(16);
  const [assistantBrand, setAssistantBrand] = useState<[number, number]>([17, 17]);
  const [assistantRootGutter, setAssistantRootGutter] = useState(0);
  /* повторный клик, пока панель ещё едет вниз: дашборд ещё скрыт, поэтому разворачиваемся сразу, без паузы 120 мс */
  const assistantClosingAtRef = useRef(0);
  const [assistantQuick, setAssistantQuick] = useState(false);
  const assistantRowRef = useRef<HTMLDivElement>(null);
  // предзагрузка логотипа бокового меню ассистента, чтобы в первом кадре панели он уже был
  useEffect(() => {
    for (const assetName of ["logo.svg", "logo-shadow.svg"]) {
      const img = new Image();
      img.src = threadAssets + assetName;
      void img.decode?.().catch(() => {});
    }
  }, []);
  const assistantGhostRef = useRef<HTMLButtonElement>(null);
  /* вид окна ассистента: чат (по умолчанию) или главная «Альфа-Интеллекта» */
  const [assistantView, setAssistantView] = useState<"chat" | "home">("chat");
  const [assistantSwitching, setAssistantSwitching] = useState(false);
  const assistantViewFromRef = useRef({ home: 0, chat: 1 });
  const assistantViewTracksRef = useRef<Animation[]>([]);
  const assistantViewRunRef = useRef(0);
  const switchAssistantView = (view: "home" | "chat") => {
    if (view === assistantView) return;
    // Read one composited pose, derive its complement: WebKit must not sample two clocks.
    const home = document.querySelector('.assistant-view-layer[data-view="home"]');
    const opacity = home ? Number(getComputedStyle(home).opacity) : 0;
    assistantViewFromRef.current = { home: opacity, chat: 1 - opacity };
    setAssistantSwitching(true);
    setAssistantView(view);
  };
  useLayoutEffect(() => {
    const run = ++assistantViewRunRef.current;
    assistantViewTracksRef.current.forEach((a) => a.cancel());
    assistantViewTracksRef.current = [];
    if (!assistantOpen) { if (assistantSwitching) setAssistantSwitching(false); return; }
    if (!assistantSwitching) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      if (run !== assistantViewRunRef.current) return;
      assistantViewTracksRef.current.forEach((a) => a.cancel());
      assistantViewTracksRef.current = [];
      setAssistantSwitching(false);
    };
    if (media.matches) { finish(); return; }
    const expose = () => { if (media.matches) finish(); };
    media.addEventListener("change", expose);
    assistantViewTracksRef.current = Array.from(document.querySelectorAll<HTMLElement>(".assistant-view-layer")).map((e) => {
      const view = e.dataset.view as "home" | "chat";
      return e.animate([{ opacity: assistantViewFromRef.current[view] }, { opacity: view === assistantView ? 1 : 0 }], {
        duration: 220, easing: "cubic-bezier(.4,0,.2,1)", fill: "both",
      });
    });
    const start = document.timeline.currentTime;
    assistantViewTracksRef.current.forEach((a) => { a.startTime = start; });
    const last = assistantViewTracksRef.current.at(-1);
    if (last) last.onfinish = finish;
    return () => media.removeEventListener("change", expose);
  }, [assistantView, assistantSwitching, assistantOpen]);
  useLayoutEffect(() => () => {
    assistantViewRunRef.current++;
    assistantViewTracksRef.current.forEach((a) => a.cancel());
  }, []);

  const openAssistant = useCallback((topic: AssistantTopic, from: HTMLButtonElement) => {
    setAssistantTopic(topic);
    setAssistantView("chat");
    assistantReturnRef.current = from;
    /* FLIP: кластер кнопок шапки стартует с текущего y дашборда (28 / sticky) и едет на y8 */
    const reopening = assistantClosingAtRef.current > 0; /* v12: при повторном открытии во время закрытия геометрию не перемеряем — элементы ещё в движении */
    if (!reopening) setAssistantRootGutter(Math.max(0, window.innerWidth - document.documentElement.offsetWidth));
    const row = topbarRef.current?.querySelector(".topbar-buttons");
    if (row && !reopening) setAssistantFlip(Math.round(row.getBoundingClientRect().top - 12));
    /* LogoCell «Альфа-Бизнес» стартует с места логотипа в карточке меню дашборда */
    const sign = document.querySelector(".dashboard-page > .sidebar .sidebar-logo .logo-sign");
    if (sign && !reopening) { const r = sign.getBoundingClientRect(); setAssistantBrand([Math.round(r.left - 12), Math.round(r.top - 12)]); }
    const sinceClose = performance.now() - assistantClosingAtRef.current;
    const wasClosing = assistantClosingAtRef.current > 0;
    setAssistantQuick(wasClosing && sinceClose < 500);
    assistantClosingAtRef.current = 0;
    /* классы меняются атомарно is-closing → is-shown, без промежуточного кадра (WebKit мигал) */
    if (wasClosing) setAssistantShown(true);
    setAssistantPhase("open");
  }, []);
  const finishAssistantClose = useCallback(() => {
    setAssistantPhase((phase) => {
      if (phase !== "closing") return phase;
      assistantReturnRef.current?.focus();
      assistantClosingAtRef.current = 0;
      return "closed";
    });
  }, []);
  const closeAssistant = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAssistantShown(false);
      setAssistantPhase("closed");
      assistantReturnRef.current?.focus();
      return;
    }
    assistantClosingAtRef.current = performance.now();
    setAssistantShown(false);
    setAssistantPhase("closing");
  }, []);
  const [creditVisible, setCreditVisible] = useState(true);
  const [creditDismissing, setCreditDismissing] = useState(false);
  const dismissCredit = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCreditVisible(false);
      return;
    }
    setCreditDismissing(true);
  }, []);
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState<"entrepreneur" | "accountant">("entrepreneur");
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const roleTriggerRef = useRef<HTMLButtonElement>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const closeRole = useCallback(() => {
    setRoleOpen(false);
    roleTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAccount();
    };
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountPanelRef.current?.contains(target)) return;
      if (accountTriggerRef.current?.contains(target)) return;
      setAccountOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    accountCloseRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [accountOpen, closeAccount]);

  useEffect(() => {
    if (assistantPhase === "closed") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAssistant();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    if (assistantPhase === "open") assistantCloseRef.current?.focus();
    let closeId = 0;
    let onEnd: ((event: TransitionEvent) => void) | null = null;
    const raf1 = 0;
    const raf2 = 0;
    if (assistantPhase === "open") {
      /* стартовые стили фиксируем принудительным расчётом и включаем морф сразу, без лишних двух кадров ожидания */
      void document.querySelector(".assistant")?.getBoundingClientRect();
      setAssistantShown(true);
    }
    if (assistantPhase === "closing") {
      setAssistantShown(false);
      /* страховка, если transitionend не придёт (вкладка в фоне и т.п.) */
      closeId = window.setTimeout(() => finishAssistantClose(), 1200);
      /* закрытие заканчивается, когда контент дашборда проявился (последний переход закрытия) */
      onEnd = (event: TransitionEvent) => {
        const t = event.target as Element | null;
        void t; /* v4: закрытие завершается по transitionend панели (onTransitionEnd), фейда дашборда больше нет */
      };
      document.addEventListener("transitionend", onEnd);
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      if (closeId) window.clearTimeout(closeId);
      if (onEnd) document.removeEventListener("transitionend", onEnd);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [assistantPhase, closeAssistant, finishAssistantClose]);
  /* The assistant replaces the dashboard header. Read live scroll for its
     backing, including when it opens before the dashboard reaches its sticky threshold. */
  useLayoutEffect(() => {
    if (!assistantOpen) return;
    const header = document.querySelector<HTMLElement>(".dashboard-page > .assistant");
    if (!header) return;
    const syncBacking = () => {
      header.toggleAttribute("data-scrolled", (window.scrollY || document.documentElement.scrollTop || 0) > 0);
    };
    /* Overflow locking does not cancel an already running smooth scroll.
       Freeze it at the current position before the first modal paint. */
    window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: "instant" });
    syncBacking();
    window.addEventListener("scroll", syncBacking, { passive: true });
    return () => window.removeEventListener("scroll", syncBacking);
  }, [assistantOpen]);
  /* v6: выезд панели — Web Animations вместо CSS-transition. WebKit на кадре завершения transition
     отдавал стартовое значение (y≈898 на один кадр); прерывание теперь — reverse() из текущей точки
     с той же скоростью, а не новый переход с нуля. Конец закрытия — finish анимации. */
  const assistantPanelRef = useRef<HTMLDivElement>(null);
  const assistantCollarRef = useRef<HTMLSpanElement>(null);
  const assistantSlideRef = useRef<Animation | null>(null);
  /* v7: тот же механизм для кроссфейда аккаунта (.2s linear) и проявления содержимого окна
     (открытие .3s m-ease с задержкой .2s, закрытие .2s linear) — тайминги прежние, из CSS v3/v4 */
  const assistantAnimsRef = useRef<Map<Element, Animation & { __down?: boolean }>>(new Map());
  useLayoutEffect(() => {
    const el = assistantPanelRef.current;
    const map = assistantAnimsRef.current;
    if (!el || assistantPhase === "closed") { map.forEach((a) => a.cancel()); map.clear(); assistantSlideRef.current = null; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { map.forEach((a) => a.cancel()); map.clear(); assistantSlideRef.current = null; return; }
    const closing = assistantPhase === "closing";
    if (!closing && !assistantShown) return;
    type Spec = { kf: Keyframe[]; kfClose?: Keyframe[]; open: KeyframeAnimationOptions; close: KeyframeAnimationOptions };
    const run = (target: Element, spec: Spec) => {
      const cur = map.get(target);
      const running = cur && cur.playState === "running";
      const goingDown = cur ? (cur.playbackRate < 0) !== Boolean(cur.__down) : false;
      if (cur && running) { if (goingDown !== closing) cur.reverse(); return cur; }
      cur?.cancel();
      const kf = closing ? (spec.kfClose ?? [...spec.kf].reverse().map((k) => (typeof k.offset === "number" ? { ...k, offset: 1 - k.offset } : k))) : spec.kf;
      const anim = target.animate(kf, { ...(closing ? spec.close : spec.open), fill: "both" }) as Animation & { __down?: boolean };
      anim.__down = closing;
      map.set(target, anim);
      return anim;
    };
    /* v13: one switch for all panel/collar/header opening tracks. Custom tuning, not Apple presets.
       V1 is the unwarped critical-spring reference; it cannot meet v12's 245ms t90 at response .55s.
       V2/V3 combine a higher-degree E core with a visible, monotone braking tail. */
    const ASSISTANT_OPEN_VARIANT: "V1" | "V2" | "V3" = "V1";
    const H = window.innerHeight, N = 600, CLOSE_N = 300;
    const clamp = (p: number) => Math.min(1, Math.max(0, p));
    const core = (p: number) => { const x = clamp(p); return 1 - (1 - x) ** 8 * (1 + 8 * x + 36 * x * x); };
    const omega = 2 * Math.PI / 0.55;
    const spring = (t: number) => 1 - (1 + omega * t) * Math.exp(-omega * t);
    let lo = 0, hi = 2;
    for (let k = 0; k < 40; k++) { const t = (lo + hi) / 2; if ((H - 44) * (1 - spring(t)) > 0.5) lo = t; else hi = t; }
    const springMs = hi * 1000;
    const blend = (p: number, ms: number, b: number) => 0.88 * core(p * ms / 400) + 0.12 * (1 - (1 - p) ** b * (1 + b * p));
    const variants = {
      V1: { ms: springMs, at: (p: number) => spring(p * springMs / 1000) / spring(springMs / 1000) },
      V2: { ms: 700, at: (p: number) => blend(p, 700, 2.5) },
      V3: { ms: 900, at: (p: number) => blend(p, 900, 3) },
    };
    const selected = variants[ASSISTANT_OPEN_VARIANT];
    const OPEN_MS = selected.ms, enter = selected.at;
    const stops = Array.from({ length: N + 1 }, (_, k) => enter(k / N));
    const enterLinear = `linear(${stops.map((q) => q.toFixed(9)).join(",")})`;
    const nativeLinear = CSS.supports("animation-timing-function", enterLinear);
    const slide = { duration: OPEN_MS, easing: nativeLinear ? enterLinear : "linear" };
    /* Full close stays exactly as before. Interrupted tracks use reverse() in place,
       preserving their current path and speed magnitude rather than retiming them. */
    const slideBack = { duration: 500, easing: "cubic-bezier(.8,0,.6,1)" };
    const downPanel = "translateY(calc(100% + 28px))";
    const downCollar = "translateY(calc(100vh - 44px))";
    /* Older engines without linear(): identical sampled progress via WAAPI keyframes. */
    const sampled = stops.map((q, k) => ({ transform: `translateY(${((H - 44) * (1 - q)).toFixed(7)}px)`, offset: k / N }));
    const panelAnim = run(el, {
      kf: nativeLinear ? [{ transform: downPanel }, { transform: "none" }] : sampled,
      kfClose: [{ transform: "none" }, { transform: downPanel }], open: slide, close: slideBack,
    });
    const collar = assistantCollarRef.current;
    if (collar) run(collar, {
      kf: nativeLinear ? [{ transform: downCollar }, { transform: "none" }] : sampled,
      kfClose: [{ transform: "none" }, { transform: downCollar }], open: slide, close: slideBack,
    });
    /* v13 «толчок» (Илья): элементы шапки стоят, пока край едущего блока (низ дашборда = верх окна − 8) не подойдёт,
       затем окно их «выталкивает» до финала. Ключевые кадры предвычислены по той же кривой окна, между ними linear,
       так reverse() и синхронность с окном сохраняются. Мягкое начало: зона 24 px до контакта (выбрано по пиковому ускорению). */
    /* cubic-bezier(.4,0,.2,1): x(t)=3·.4·t(1−t)²+3·.2·t²(1−t)+t³ → бисекцией t, y(t)=3t²(1−t)+t³ */
    const ease = (x: number) => { let lo = 0, hi = 1, t = x; for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; const bx = 1.2 * t * (1 - t) ** 2 + 0.6 * t * t * (1 - t) + t ** 3; if (bx < x) lo = t; else hi = t; } return 3 * t * t * (1 - t) + t ** 3; };
    const Z = 24; /* 601 open samples; full-close track remains v12's 301 samples. */
    /* f(p) ∈ [0,1] — доля пути элемента; d — насколько край «вдавился бы» в элемент без толчка */
    const pushFrac = (mx: number, down: boolean) => Array.from({ length: (down ? CLOSE_N : N) + 1 }, (_, k) => {
      const p = k / (down ? CLOSE_N : N); const e = down ? 1 - ease(1 - p) : stops[k];
      const d = mx - (H - 44) * (down ? e : 1 - e);
      const sh = d < -Z ? 0 : d < Z ? (d + Z) ** 2 / (4 * Z) : d;
      return Math.min(1, Math.max(0, sh / mx));
    });
    const linOpen = { duration: OPEN_MS, easing: "linear" }, linClose = { duration: 500, easing: "linear" };
    const pushRun = (target: Element | null, mx: number, frame: (f: number) => Keyframe) => {
      if (!target || mx <= 0.5) return;
      const mk = (fr: number[]) => fr.map((f, k) => ({ ...frame(f), offset: k / (fr.length - 1) }));
      run(target, { kf: mk(pushFrac(mx, false)), kfClose: mk(pushFrac(mx, true)), open: linOpen, close: linClose });
    };
    const [bdx, bdy] = assistantBrand;
    const fy = assistantFlip;
    pushRun(document.querySelector(".assistant .assistant-brand"), bdy, (f) => ({ translate: `${(1 - f) * bdx}px ${(1 - f) * bdy}px` }));
    pushRun(document.querySelector(".assistant .assistant-topbar-right"), fy, (f) => ({ translate: `0px ${(1 - f) * fy}px` }));
    /* карточка меню — тем же толчком, что логотип: сдвиг −brand и растворение фона/обводки */
    pushRun(document.querySelector(".dashboard-page > .sidebar"), bdy, (f) => ({ translate: `${-f * bdx}px ${-f * bdy}px`, backgroundColor: `rgba(255,255,255,${(.48 * (1 - f)).toFixed(4)})`, borderColor: `rgba(255,255,255,${(1 - f).toFixed(4)})` }));
    assistantSlideRef.current = panelAnim;
    panelAnim.onfinish = closing ? () => finishAssistantClose() : null;
    /* v10: содержимое окна видно с первого кадра и едет вместе с окном одним transform — без своей анимации */
  }, [assistantPhase, assistantShown, finishAssistantClose, assistantBrand, assistantFlip]);

  /* Answer-only replay: a fresh mounted answer starts from zero; a quick reopening
     resumes the same paused tracks, so visible text never snaps back to zero. */
  const assistantAnswerRef = useRef<HTMLDivElement>(null);
  const assistantAnswerNodeRef = useRef<HTMLDivElement | null>(null);
  const assistantAnswerAnimsRef = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const answer = assistantAnswerRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clear = () => { assistantAnswerAnimsRef.current.forEach((a) => a.cancel()); assistantAnswerAnimsRef.current = []; };
    const expose = () => { if (media.matches) clear(); };
    media.addEventListener("change", expose);
    const fresh = assistantAnswerNodeRef.current !== answer;
    if (fresh) { clear(); assistantAnswerNodeRef.current = answer; }
    if (!answer || assistantPhase === "closed") {
      clear(); assistantAnswerNodeRef.current = null;
    } else if (media.matches || assistantView !== "chat") {
      clear();
    } else if (assistantPhase === "closing") {
      assistantAnswerAnimsRef.current.forEach((a) => { if (a.playState === "running" || a.pending) a.pause(); });
    } else if (fresh) {
      const rows = answer.querySelectorAll(
        ":scope > :not([data-assistant-answer-group]), :scope > [data-assistant-answer-group] > *",
      );
      assistantAnswerAnimsRef.current = Array.from(rows).map((row, i) => row.animate([
        { opacity: 0, filter: "blur(5px)", transform: "translateY(6px)" },
        { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
      ], { duration: 440, delay: 240 + i * 55, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" }));
    } else {
      assistantAnswerAnimsRef.current.forEach((a) => { if (a.playState === "paused") a.play(); });
    }
    return () => media.removeEventListener("change", expose);
  }, [assistantPhase, assistantTopic, assistantView]);
  useEffect(() => () => {
    assistantAnswerAnimsRef.current.forEach((a) => a.cancel());
    assistantAnswerAnimsRef.current = [];
    assistantAnswerNodeRef.current = null;
  }, []);


  useEffect(() => {
    if (!creditDismissing) return;
    const id = window.setTimeout(() => {
      setCreditVisible(false);
      setCreditDismissing(false);
    }, 500);
    return () => window.clearTimeout(id);
  }, [creditDismissing]);

  useEffect(() => {
    if (!roleOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRole();
    };
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleMenuRef.current?.contains(target)) return;
      if (roleTriggerRef.current?.contains(target)) return;
      setRoleOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    roleMenuRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [roleOpen, closeRole]);

  useEffect(() => {
    const tabList = tabTimers.current;
    return () => tabList.forEach(clearTimeout);
  }, []);

  const changeTab = useCallback((tab: string) => {
    if (tab === activeTab) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveTab(tab);
      setShownTab(tab);
      setTabPhase("idle");
      return;
    }
    tabTimers.current.forEach(clearTimeout);
    tabTimers.current.length = 0;
    setActiveTab(tab);
    setTabPhase("out");
    tabTimers.current.push(window.setTimeout(() => {
      setShownTab(tab);
      setTabPhase("in-prep");
      tabTimers.current.push(window.setTimeout(() => setTabPhase("in"), 20));
      tabTimers.current.push(window.setTimeout(() => setTabPhase("idle"), 760));
    }, 240));
  }, [activeTab]);

  useEffect(() => {
    if (payment || innerPage || quickAction === "kept" || accountOpen || assistantOpen || roleOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "1" || event.shiftKey || event.repeat || !canUsePrototypeShortcut(event)) return;
      if (document.body.classList.contains("name-modal-open") || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      setQuickAction("suggested");
      changeTab("Ассистент");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [accountOpen, assistantOpen, changeTab, innerPage, payment, quickAction, roleOpen]);

  /* Счётчик «2» на «Сводка»: 3 s пауза, затем
     1) бейдж только opacity+scale (без обрезки overflow),
     2) с задержкой — сжатие слота/вкладки/шапки.
     Reduced motion → сразу gone. Уход с вкладки до 3 s отменяет таймер. */
  useEffect(() => {
    if (counter !== "shown" || activeTab !== "Сводка") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hideId = window.setTimeout(() => {
      if (reduce) setCounter("gone");
      else setCounter("hiding");
    }, 3000);
    return () => window.clearTimeout(hideId);
  }, [activeTab, counter]);

  useEffect(() => {
    if (counter !== "hiding") return;
    const hideId = window.setTimeout(() => setCounter("gone"), 620);
    return () => window.clearTimeout(hideId);
  }, [counter]);

  useLayoutEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    // Табы на высоте 120 px доходят до компактной шапки (56 px) после 64 px прокрутки.
    const compactStart = 64;
    const travel = 20; // Ряд кнопок поднимается с y=28 до y=8.
    let lastScroll = -1;
    const syncTopbar = () => {
      const scroll = Math.max(0, Math.min(window.scrollY, compactStart + travel));
      if (scroll === lastScroll) return;
      lastScroll = scroll;
      el.style.setProperty("--topbar-collapse", String(Math.max(0, (scroll - compactStart) / travel)));
      el.style.setProperty("--topbar-backdrop", String(Math.min(1, scroll / compactStart)));
    };
    syncTopbar();
    window.addEventListener("scroll", syncTopbar, { passive: true });
    return () => window.removeEventListener("scroll", syncTopbar);
  }, []);

  const openExpenses = (trigger: HTMLButtonElement) => openAssistant("expenses", trigger);

  return (
    <main style={{ ["--brand-dx" as string]: `${assistantBrand[0]}px`, ["--brand-dy" as string]: `${assistantBrand[1]}px`, ["--assistant-root-gutter" as string]: `${assistantOpen ? assistantRootGutter : 0}px` }} className={`dashboard-page${payment ? " payment-page" : ""}${innerPage ? " research-page" : ""}${assistantOpen ? " assistant-shift" : ""}${assistantShown ? " assistant-shown" : ""}${assistantPhase === "closing" ? " is-closing" : ""}`}>
      <aside className={`sidebar${accountOpen ? " sidebar-solid" : ""}`} aria-label="Основная навигация">
        <Link className="sidebar-logo" href="/" aria-label="Альфа-Бизнес — на главную">
          <span className="logo-sign"><img src={asset("logo-sign.svg")} alt="" /></span>
          <img className="logo-wordmark" src={asset("logo-wordmark.svg")} alt="Альфа-Бизнес" />
        </Link>
        <div className="sidebar-content">
          <div className="amounts">
            <button className="balance-cell" type="button" ref={accountTriggerRef} aria-expanded={accountOpen} aria-controls="account-details" onClick={() => setAccountOpen(true)}>
              <span className="balance-icon"><Icon name="rub-icon.svg" /></span>
              <span className="balance-copy"><strong>{balanceLabel}</strong><span>{accountsCountLabel}</span></span>
              <span className="balance-addon"><img className="bank-card-img" src="/assets/figma/bank-card.png" srcSet="/assets/figma/bank-card@2x.png 2x" alt="" /></span>
            </button>
            {creditVisible && (
              <div className={`balance-cell credit-guest${creditDismissing ? " is-dismissing" : ""}`}>
                <span className="balance-icon"><Icon name="percent-icon.svg" /></span>
                <span className="balance-copy"><strong>5 000 000 ₽</strong><span>Кредит наличными</span></span>
                <button
                  className="balance-dismiss"
                  type="button"
                  aria-label="Скрыть предложение кредита"
                  onClick={dismissCredit}
                >
                  <Icon name="menu-ed006.svg" />
                </button>
              </div>
            )}
          </div>
          <div className="sidebar-menu-wrap">
            <div className="menu-divider"><span /></div>
            <nav className="menu-list" ref={menu.rootRef as Ref<HTMLElement>} data-menu-root="entrepreneur">
              <div className="menu-main">
                {MENU_FIXED.map((id) => <MenuItem key={id} id={id} fixed="top" {...MENU_BY_ID[id]} />)}
                <div data-menu-zone="main">
                  {menu.state.main.map((id) => <MenuItem key={id} id={id} current={id === currentMenuItem} {...MENU_BY_ID[id]} />)}
                </div>
                <div className="menu-folder">
                  <button className="menu-item menu-category" type="button" data-menu-folder="" aria-expanded={menu.state.folderOpen} aria-controls="menu-folder-body" onClick={menu.toggleFolder}>
                    <Icon name={menu.state.folderOpen ? "chevron-up-inc.svg" : "menu-331ba.svg"} /><span>Ещё</span>
                  </button>
                  <div className="menu-folder-body" id="menu-folder-body" data-menu-folder-body="" data-open={menu.state.folderOpen ? "true" : "false"} inert={!menu.state.folderOpen}>
                    <div data-menu-zone="folder">
                      {menu.state.folder.map((id) => <MenuItem key={id} id={id} current={id === currentMenuItem} {...MENU_BY_ID[id]} />)}
                      {menu.state.folder.length === 0 && <p className="menu-folder-empty">Перетащите разделы сюда, чтобы скрыть их из меню</p>}
                    </div>
                  </div>
                </div>
                <div className="menu-divider"><span /></div>
                {MENU_BOTTOM.map((id) => <MenuItem key={id} id={id} fixed="bottom" {...MENU_BY_ID[id]} />)}
              </div>
              <span data-menu-drop-line="" hidden />
              <span className="menu-dnd-live" data-menu-live="" aria-live="polite" />
            </nav>
          </div>
        </div>
      </aside>

      <header className="topbar" ref={topbarRef}>
        {(innerPage || payment) && <Link className="research-back" href="/">
          <img src={asset("research/back-chevron.svg")} alt="" />
          <span>Назад</span>
        </Link>}
        <div className="topbar-buttons">
          <button className="icon-button" type="button" aria-label="Письма"><img src={asset("mail-icon.svg")} alt="" /></button>
          <button className="icon-button" type="button" aria-label="Уведомления"><img src={asset("notifications-icon.svg")} alt="" /></button>
        </div>
        <span className="vertical-divider" />
        <CompanySwitcher className="company-account" role="Руководитель">
          {(companyName) => (
            <>
              <span className="account-avatar"><img src="/assets/figma/avatar-photo.png" alt="" /></span>
              <span><strong>{companyName}</strong><small>{clientName.headerLabel}</small></span>
            </>
          )}
        </CompanySwitcher>
        <span className="vertical-divider" />
        <RoleChip role={role} open={roleOpen} onToggle={() => setRoleOpen((open) => !open)} triggerRef={roleTriggerRef} />
        <span className="vertical-divider" />
        <button className="icon-button" type="button" aria-label="Выйти" onClick={logout}><img src={asset("logout-icon.svg")} alt="" /></button>
      </header>

      {research ? <ResearchScreens key={research} screen={research} openExpenses={openExpenses} />
        : payment ? <NewPaymentForm />
        : operations ? <OperationsFeed standalone openExpenses={openExpenses} /> : (
      <div className="dashboard-content">
        <nav
          className={`tabs${counter !== "shown" ? ` tabs-compact tabs-${COMPACT_CLASS[activeTab] ?? "summary"}` : ""}${counter === "hiding" ? " tabs-counter-dismiss" : ""}`}
          aria-label="Разделы главной"
        >
          {TABS.map((tab) => (
            <button key={tab} type="button" className={`tab${activeTab === tab ? " active" : ""}`} onClick={() => changeTab(tab)} aria-pressed={activeTab === tab}>
              <span>{tab}</span>
              {tab === "Сводка" && counter !== "gone" && (
                <span className={`tab-counter-slot${counter === "hiding" ? " hiding" : ""}`} aria-hidden={counter === "hiding"}>
                  <span className={`tab-counter${counter === "hiding" ? " hiding" : ""}`}><Indicator value={2} /></span>
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={`tab-stage phase-${tabPhase}`} style={{ height: TAB_HEIGHTS[activeTab] }}>
        {shownTab === "Ассистент" && (<section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-heading"><span className="hero-dash">—</span><h1 id="hero-title">{clientName.greetingName}, добрый день</h1></div>
            <div className="hero-subtitle">
              <button type="button" onClick={(event) => openAssistant("tasks", event.currentTarget)} aria-haspopup="dialog">
                <span>Расходы за октябрь выросли на 12%. Подготовил разбор и два изменения в законодательстве,</span>
                <span className="hero-summary-last">
                  <span>на которые стоит обратить внимание</span>
                  <span className="hero-subtitle-action"><Icon name="hero-6a06a.svg" /><span>Узнать больше</span></span>
                </span>
              </button>
            </div>
          </div>
          <div className="hero-actions">
            <button className="hero-chip hero-chip-analytics" type="button" onClick={(event) => openAssistant("expenses", event.currentTarget)} aria-haspopup="dialog"><Icon name="financial-analytics-icon.svg" /><span>Расходы за месяц</span></button>
            <button className="hero-chip" type="button"><Icon name="hero-92b54.svg" /><span>Себе в Альфу</span></button>
            <button className="hero-chip" type="button" onClick={downloadOperations}><Icon name="hero-b373c.svg" /><span>Скачать выписку</span></button>
            <div className={`hero-action-slot${showTemplate ? " has-template" : ""}`}>
              <button
                className={`hero-chip${suggestTemplate ? " hero-chip-suggested" : ""}`}
                type="button"
                ref={quickActionRef}
                aria-disabled={showTemplate || undefined}
                onClick={showTemplate ? undefined : () => fileRef.current?.click()}
              >
                <Icon name={showTemplate ? `quick-actions/template-${suggestTemplate ? "suggested" : "kept"}.svg` : "hero-c5c76.svg"} />
                <span>{showTemplate ? "Платёж по шаблону" : "Импорт платежей"}</span>
              </button>
              {suggestTemplate && (
                <section
                  className="quick-action-offer"
                  aria-labelledby="quick-action-offer-title"
                  onKeyDown={(event) => { if (event.key === "Escape") resolveTemplateSuggestion(false); }}
                >
                  <img className="quick-action-stars" src={asset("quick-actions/stars.svg")} alt="" />
                  <img className="quick-action-tail" src={asset("quick-actions/tail.svg")} alt="" />
                  <div className="quick-action-card">
                    <div className="quick-action-head">
                      <div className="quick-action-copy">
                        <h2 id="quick-action-offer-title">Заменили действие</h2>
                        <p>Вместо Импорт платежей —<br />теперь то, чем вы пользуетесь чаще</p>
                      </div>
                      <button className="quick-action-close" type="button" aria-label="Отклонить замену действия" onClick={() => resolveTemplateSuggestion(false)}>
                        <img src={asset("quick-actions/close.svg")} alt="" />
                      </button>
                    </div>
                    <div className="quick-action-buttons">
                      <button className="quick-action-keep" type="button" onClick={() => resolveTemplateSuggestion(true)}>Оставить</button>
                      <button className="quick-action-configure" type="button" disabled>Настроить</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
            <button className="hero-chip hero-chip-more" type="button">Ещё</button>
            <input ref={fileRef} className="visually-hidden" type="file" accept=".csv,.txt,.pdf" tabIndex={-1} />
          </div>
        </section>
        )}

        {shownTab === "Сводка" && <SummaryPanel />}
        {shownTab === "Счета на главной" && <AccountsPanel />}
        {shownTab === "Тарифы и подписки" && <TariffsPanel />}
        </div>

        <section className="promo-banners" aria-label="Предложения для бизнеса">
          <div className="promo-banner promo-banner-credit">
            <div className="promo-banner-copy">
              <strong>Кредитная карта</strong>
              <span>Льготный период 60&nbsp;дней</span>
            </div>
            <span className="promo-banner-art"><img src="/assets/figma/main-banner-credit.png" alt="" /></span>
          </div>
          <div className="promo-banner promo-banner-protection">
            <div className="promo-banner-copy">
              <strong>Защита бизнеса</strong>
              <span>На один месяц от&nbsp;блокировок</span>
            </div>
            <span className="promo-banner-art"><img src="/assets/figma/main-banner-protection.png" alt="" /></span>
          </div>
          <div className="promo-banner promo-banner-savings">
            <div className="promo-banner-copy">
              <strong>Накопительный счёт</strong>
              <span>Лизинг, бизнес-карты<br />и&nbsp;другие продукты</span>
            </div>
            <span className="promo-banner-art"><img src="/assets/figma/main-banner-savings.png" alt="" /></span>
          </div>
        </section>

        <TasksWidget afterPanel={activeTab !== "Ассистент"} />

        <OperationsFeed openExpenses={openExpenses} />
      </div>
      )}

      {roleOpen && (
        <div className="role-menu" role="menu" aria-label="Вид главной" ref={roleMenuRef} tabIndex={-1}>
          <div className="role-menu-top">
            <p className="role-menu-title">Вид главной</p>
            <div className="role-menu-list">
              <button className="role-option" type="button" role="menuitemradio" aria-checked={role === "entrepreneur"} onClick={() => { setRole("entrepreneur"); closeRole(); }}>
                <span className="role-avatar"><img src="/assets/figma/role-entrepreneur.png" alt="" /></span>
                <span className="role-copy"><strong>Предприниматель</strong><span>Легкий интерфейс для ведения бизнеса</span></span>
                {role === "entrepreneur" && <img className="role-check" src="/assets/figma/role-check.svg" alt="" />}
              </button>
              <button className="role-option" type="button" role="menuitemradio" aria-checked={role === "accountant"} onClick={() => {
                setRole("accountant");
                setRoleOpen(false);
                router.push(prepareDashboardRoleChange("accountant"), { scroll: false });
              }}>
                <span className="role-avatar"><img src="/assets/figma/role-accountant.png" alt="" /></span>
                <span className="role-copy"><strong>Бухгалтер</strong><span>Продвинутый интерфейс для работы с финансами</span></span>
                {role === "accountant" && <img className="role-check" src="/assets/figma/role-check.svg" alt="" />}
              </button>
            </div>
          </div>
          <div className="role-banner">
            <img className="role-banner-img" src="/assets/figma/role-banner.png" alt="" />
            <div className="role-banner-text">
              <div className="role-banner-head"><strong>Персонализированный банк</strong><span className="role-beta">БЕТА</span></div>
              <p>Мы уже подстроили главную под ваши задачи и дальше шаг за шагом будем делать сервис ещё удобнее именно для вас</p>
            </div>
          </div>
        </div>
      )}

      <section className="account-panel" id="account-details" role="dialog" aria-label="Детализация остатка"
        data-open={accountOpen} inert={!accountOpen} ref={accountPanelRef}>
        <div className="account-panel-head">
          <h2>Детализация остатка</h2>
          <button className="account-panel-close" type="button" aria-label="Закрыть детализацию" onClick={closeAccount} ref={accountCloseRef}>
            <img src="/assets/figma/close-icon.svg" alt="" />
          </button>
        </div>
        <div className="account-panel-body">
          <AccountRow label="Исходящий остаток" value={balanceLabel} info />
          <span className="account-panel-divider" />
          <AccountRow label="Фиксированный остаток" value={"0,00\u2009₽"} muted />
          <AccountRow label="Ожидает списания" value={"0,00\u2009₽"} muted />
          <AccountRow label="Арест" value={"0,00\u2009₽"} muted />
          <AccountRow label="Блокировка ФНС" value={"0,00\u2009₽"} muted />
          <div className="account-panel-subdivider"><p>Включить в доступный остаток</p></div>
          <AccountRow label="Остаток по овердрафту" value={"0,00\u2009₽"} muted>
            <span className="account-panel-switch" aria-hidden="true" />
          </AccountRow>
          <AccountRow label="Депозит">
            <button className="account-panel-link" type="button">Открыть</button>
          </AccountRow>
          <span className="account-panel-divider" />
          <AccountRow label="Доступный остаток" value={balanceLabel} info />
        </div>
        <button className="account-panel-cta" type="button">К счетам</button>
      </section>

      <AssistantBar />

      {assistantOpen && (
        <section style={{ ["--flip-dy" as string]: `${assistantFlip}px`, ["--brand-dx" as string]: `${assistantBrand[0]}px`, ["--brand-dy" as string]: `${assistantBrand[1]}px` }} className={`assistant${assistantShown ? " is-shown" : ""}${assistantPhase === "closing" ? " is-closing" : ""}${assistantQuick ? " is-quick" : ""}`} role="dialog" aria-modal="true" aria-label="Альфа-Интеллект" data-topic={assistantTopic}>
          <header className="assistant-topbar">
            <div className="assistant-brand">
              <span className="logo-sign"><img src={asset("logo-sign.svg")} alt="" /></span>
              <img className="logo-wordmark" src={asset("logo-wordmark.svg")} alt="Альфа-Бизнес" />
            </div>
            {/* ряд = копия ряда дашборда (те же x); едет только по Y одной траекторией */}
            <div className="assistant-topbar-right" ref={assistantRowRef}>
              <div className="ai-btn-group">
                <button className="icon-button" data-flip="mail" type="button" aria-label="Письма"><img src={asset("mail-icon.svg")} alt="" /></button>
                <button className="icon-button" data-flip="notif" type="button" aria-label="Уведомления"><img src={asset("notifications-icon.svg")} alt="" /></button>
              </div>
              <span className="ai-divider" data-flip="div1" />
              <CompanySwitcher className="ai-account" role="Руководитель" flipKey="account">
                {(companyName) => (
                  <>
                    <span className="ai-av">
                      <span className="account-avatar ai-av-from" aria-hidden="true"><img src="/assets/figma/avatar-photo.png" alt="" /></span>
                    </span>
                    <span className="ai-account-copy">
                      <strong>{companyName}</strong>
                      <span className="ai-sub"><small className="ai-sub-from">{clientName.headerLabel}</small></span>
                    </span>
                  </>
                )}
              </CompanySwitcher>
              <span className="ai-divider" data-flip="div2" />
              <span className="ai-role" data-flip="role"><RoleChip role={role} open={false} onToggle={() => {}} triggerRef={assistantGhostRef} /></span>
              <span className="ai-divider" data-flip="div3" />
              <button className="icon-button" data-flip="logout" type="button" aria-label="Выйти" onClick={logout}><img src={asset("logout-icon.svg")} alt="" /></button>
            </div>
          </header>

          <span className="ai-gap-collar" ref={assistantCollarRef} aria-hidden="true" />
          <div className="assistant-panel" ref={assistantPanelRef}>
          {/* граница меню/окна (x248): отдельный слой поверх содержимого панели, у края панели, без своей анимации и фейда */}
          <span className="ai-window-line" aria-hidden="true" />
          <AssistantThreadMenu
            topic={assistantTopic}
            home={assistantView === "home"}
            onHome={() => switchAssistantView("home")}
            onThread={() => switchAssistantView("chat")}
          />

          <div className="assistant-chat">
            <div className="assistant-head-actions">
              <button className="assistant-round" type="button" aria-label="О Альфа-Интеллекте">
                <img src={threadAssets + assistantTopic + "-info.svg"} alt="" />
              </button>
              <button className="assistant-round assistant-close" type="button" aria-label="Закрыть" onClick={closeAssistant} ref={assistantCloseRef}>
                <img src={assistantTopic === "tasks" ? threadAssets + "tasks-close.svg" : asset("ai-close.svg")} alt="" />
              </button>
            </div>
            {/* Motion-only presence layers preserve the developer's containing-block geometry. */}
            <div className="assistant-view-layer" data-view="home" data-switching={assistantSwitching} data-from-opacity={assistantViewFromRef.current.home} data-active={assistantView === "home"} inert={assistantView !== "home"} aria-hidden={assistantView !== "home"}>
              <AssistantHome greetingName={clientName.greetingName} active={assistantView === "home"} switching={assistantSwitching} />
            </div>
            <div className="assistant-view-layer" data-view="chat" data-switching={assistantSwitching} data-from-opacity={assistantViewFromRef.current.chat} data-active={assistantView === "chat"} inert={assistantView !== "chat"} aria-hidden={assistantView !== "chat"}>
              <AssistantConversation topic={assistantTopic} answerRef={assistantAnswerRef} />
            </div>
          </div>
          </div>
        </section>
      )}
    </main>
  );
}
