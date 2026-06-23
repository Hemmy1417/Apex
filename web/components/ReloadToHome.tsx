"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ReloadToHome() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === "reload" && pathname !== "/") {
        router.replace("/");
      }
    } catch { /* unsupported — no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
