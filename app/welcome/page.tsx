import type { Metadata } from "next";
import RoleScreen from "@/components/first-entry/RoleScreen";

export const metadata: Metadata = { title: "Выбор вида главной" };

export default function Page() {
  return <RoleScreen />;
}
