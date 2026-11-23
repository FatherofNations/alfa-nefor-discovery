import type { Metadata } from "next";
import Glavnaya from "@/components/dashboards/Glavnaya";

export const metadata: Metadata = { title: "Лента операций" };

export default function Page() {
  return <Glavnaya operations />;
}
