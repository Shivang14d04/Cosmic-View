"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LoaderFive } from "@/components/ui/loader";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 9000); // teleport after 2s

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black flex items-center justify-center">
      {/* Teleport content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 text-center space-y-6"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Welcome to the Cosmos
        </h1>

        <LoaderFive text="Preparing your journey through space…" />
      </motion.div>
    </div>
  );
}
