import type { Metadata } from "next";
import LoginScreen from "@/components/first-entry/LoginScreen";

export const metadata: Metadata = { title: "Вход — Альфа-Бизнес" };

export default function Page() {
  return <LoginScreen />;
}
