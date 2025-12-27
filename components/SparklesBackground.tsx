"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function SparklesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Sparkles background */}
      <SparklesCore
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={90}
        className="absolute inset-0"
        particleColor="#ffffff"
      />
      <div className="absolute inset-0 mask-[radial-gradient(circle,transparent_0%,black_55%,black_100%)]" />
    </div>
  );
}
