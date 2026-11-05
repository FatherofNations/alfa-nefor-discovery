import type { Metadata } from "next";
import SetupScreen from "@/components/first-entry/SetupScreen";

export const metadata: Metadata = { title: "Настройка главного экрана" };

export default function Page() {
  return <SetupScreen />;
}
