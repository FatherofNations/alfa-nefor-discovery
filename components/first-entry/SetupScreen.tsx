"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEntryRole, markEntered } from "@/lib/entry-session";

export default function SetupScreen() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const role = getEntryRole();
    const fade = window.setTimeout(() => setLeaving(true), 2100);
    const next = window.setTimeout(() => {
      markEntered();
      router.replace(role === "accountant" ? "/accountant" : "/");
    }, 2360);
    return () => {
      clearTimeout(fade);
      clearTimeout(next);
    };
  }, [router]);

  return (
    <div className={`entry-page entry-setup${leaving ? " is-leaving" : ""}`}>
      <div className="entry-setup-bg" aria-hidden="true" />
      <div className="entry-setup-orb">
        <span className="entry-setup-orb-inner"><img src="/assets/figma/neural-sphere.svg" alt="" /></span>
      </div>
      <p className="entry-setup-text">Настраиваю главный экран...</p>
    </div>
  );
}
