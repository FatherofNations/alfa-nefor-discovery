import type { Metadata } from "next";
import AccountantPage from "@/components/dashboards/AccountantPage";
import AccountantSkeleton from "@/components/skeletons/AccountantSkeleton";
import DashboardSkeletonGate from "@/components/skeletons/DashboardSkeletonGate";
import { isHardReload } from "@/lib/reload-mode";
import { ACCOUNTANT_WIDGETS } from "@/lib/skeleton-widgets";


export const metadata: Metadata = { title: "Бухгалтер — главная" };

export default async function Page() {
  const hardReload = await isHardReload();
  return (
    <DashboardSkeletonGate fallback={<AccountantSkeleton />} hardReload={hardReload} widgets={ACCOUNTANT_WIDGETS}>
      <AccountantPage />
    </DashboardSkeletonGate>
  );
}