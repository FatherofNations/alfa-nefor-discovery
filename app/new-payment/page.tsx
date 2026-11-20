import type { Metadata } from "next";
import Glavnaya from "@/components/dashboards/Glavnaya";

export const metadata: Metadata = { title: "Новый платёж" };

export default function Page() {
  return <Glavnaya payment />;
}
