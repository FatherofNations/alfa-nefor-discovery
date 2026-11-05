import type { Metadata } from "next";
import Glavnaya from "@/components/dashboards/Glavnaya";

export const metadata: Metadata = { title: "Главная" };

export default function Page() {
  return <Glavnaya />;
}
