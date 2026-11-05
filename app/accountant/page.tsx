import type { Metadata } from "next";
import AccountantPage from "@/components/dashboards/AccountantPage";

export const metadata: Metadata = { title: "Бухгалтер — главная" };

export default function Page() {
  return <AccountantPage />;
}
