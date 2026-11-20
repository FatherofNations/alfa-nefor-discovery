/* Точка входа статической сборки прототипа.

   Собирается esbuild в один IIFE-бандл (scripts/build-static.mjs) и кладётся
   рядом с index.html и ассетами. Работает из file:// — без Node, без HTTP:
   навигация через hash, данные в localStorage/sessionStorage, картинки
   относительными путями. */

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { usePathname } from "./shims/next-navigation";
import LoginScreen from "@/components/first-entry/LoginScreen";
import RoleScreen from "@/components/first-entry/RoleScreen";
import SetupScreen from "@/components/first-entry/SetupScreen";
import Glavnaya from "@/components/dashboards/Glavnaya";
import AccountantPage from "@/components/dashboards/AccountantPage";
import DashboardSkeletonGate from "@/components/skeletons/DashboardSkeletonGate";
import EntrepreneurSkeleton from "@/components/skeletons/EntrepreneurSkeleton";
import AccountantSkeleton from "@/components/skeletons/AccountantSkeleton";
import ClientNameModal from "@/components/client-name/ClientNameModal";
import { ACCOUNTANT_WIDGETS, ENTREPRENEUR_WIDGETS } from "@/lib/skeleton-widgets";
import { resetEntry } from "@/lib/entry-session";
import { setTemplatePaymentKept } from "@/lib/quick-actions";

// У file:// нет заголовков запроса. Обрабатываем команду, когда фокус на странице.
window.addEventListener("keydown", (event) => {
  if (event.code !== "KeyR" || !event.shiftKey || !(event.metaKey || event.ctrlKey) || event.altKey) return;
  event.preventDefault();
  setTemplatePaymentKept(false);
  resetEntry();
  window.location.reload();
}, { capture: true });

const TITLES: Record<string, string> = {
  "/": "Главная",
  "/accountant": "Бухгалтер — главная",
  "/login": "Вход — Альфа-Бизнес",
  "/welcome": "Выбор вида главной",
  "/setup": "Настройка главного экрана",
  "/new-payment": "Новый платёж",
};

function App() {
  const path = usePathname();

  useEffect(() => {
    document.title = TITLES[path] ?? "Альфа-Бизнес — прототип";
  }, [path]);

  let screen;
  switch (path) {
    case "/login":
      screen = <LoginScreen />;
      break;
    case "/welcome":
      screen = <RoleScreen />;
      break;
    case "/setup":
      screen = <SetupScreen />;
      break;
    case "/new-payment":
      screen = <Glavnaya payment />;
      break;
    case "/accountant":
      screen = (
        <DashboardSkeletonGate key="accountant" fallback={<AccountantSkeleton />} widgets={ACCOUNTANT_WIDGETS}>
          <AccountantPage />
        </DashboardSkeletonGate>
      );
      break;
    default:
      screen = (
        <DashboardSkeletonGate key="entrepreneur" fallback={<EntrepreneurSkeleton />} widgets={ENTREPRENEUR_WIDGETS}>
          <Glavnaya />
        </DashboardSkeletonGate>
      );
  }

  return (
    <>
      {screen}
      <ClientNameModal />
    </>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) createRoot(rootElement).render(<App />);
