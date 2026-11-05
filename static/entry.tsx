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

const TITLES: Record<string, string> = {
  "/": "Главная",
  "/accountant": "Бухгалтер — главная",
  "/login": "Вход — Альфа-Бизнес",
  "/welcome": "Выбор вида главной",
  "/setup": "Настройка главного экрана",
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
