"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SparklesBackground from "@/components/SparklesBackground";

export default function SparklesGate() {
  const pathname = usePathname() || "/";

  // Exclude Mars page from the sparkles background.
  // Your route folder is `app/Mars`, so this may be `/Mars`.
  const isMars =
    pathname === "/Mars" ||
    pathname.startsWith("/Mars/") ||
    pathname === "/mars" ||
    pathname.startsWith("/mars/");

  if (isMars) return null;

  return <SparklesBackground />;
}
