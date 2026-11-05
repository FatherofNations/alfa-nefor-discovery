import type { Metadata } from "next";
import { preload } from "react-dom";
import "@/styles/tokens.css";
import "@/styles/fonts.css";
import "@/styles/canon.css";
import "@/styles/app.css";
import "@/styles/first-entry.css";

export const metadata: Metadata = {
  title: "Альфа-Бизнес — Ассистент",
  robots: { index: false, follow: false },
};

const FONTS = [
  "/fonts/alfa-interface-sans_bold.woff2",
  "/fonts/alfa-interface-sans_medium.woff2",
  "/fonts/alfa-interface-sans_regular.woff2",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const font of FONTS) {
    preload(font, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return <html lang="ru"><body>{children}</body></html>;
}
