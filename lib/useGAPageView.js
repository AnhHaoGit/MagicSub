"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as gtag from "./gtag";

export default function useGAPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const url = pathname + searchParams.toString();
    gtag.pageview(url);
  }, [pathname, searchParams]);
}
