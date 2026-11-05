import type { Metadata } from "next";
import Glavnaya from "@/components/dashboards/Glavnaya";
import DashboardSkeletonGate from "@/components/skeletons/DashboardSkeletonGate";
import EntrepreneurSkeleton from "@/components/skeletons/EntrepreneurSkeleton";
import { isHardReload } from "@/lib/reload-mode";
import { ENTREPRENEUR_WIDGETS } from "@/lib/skeleton-widgets";


export const metadata: Metadata = { title: "Главная" };

export default async function Page() {
  const hardReload = await isHardReload();
  return (
    <DashboardSkeletonGate fallback={<EntrepreneurSkeleton />} hardReload={hardReload} widgets={ENTREPRENEUR_WIDGETS}>
      <Glavnaya />
    </DashboardSkeletonGate>
  );
}