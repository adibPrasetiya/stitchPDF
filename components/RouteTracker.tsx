"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

export default function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      window.gtag("config", "G-D0YJF8QNMJ", {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
