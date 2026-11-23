import type { Metadata } from "next";
import { preload } from "react-dom";
import { reloadScrollScript } from "@/lib/reload-scroll.mjs";
import "@/styles/tokens.css";
import "@/styles/fonts.css";
import "@/styles/canon.css";
import "@/styles/app.css";
import "@/styles/first-entry.css";
import "@/styles/assistant-home.css";
import "@/styles/wide.css";
import "@/styles/skeleton.css";
import "@/styles/focus-reset.css";
import "@/styles/company-switcher.css";
import "@/styles/tasks-cards.css";
import "@/styles/tasks-options.css";
import "@/styles/tasks-flow.css";
import "@/styles/new-payment.css";
import "@/styles/research.css";
import ClientNameModal from "@/components/client-name/ClientNameModal";

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
  return <html lang="ru"><head><script dangerouslySetInnerHTML={{ __html: reloadScrollScript }} /></head><body>
        {children}
        <ClientNameModal />
      </body></html>;
}
