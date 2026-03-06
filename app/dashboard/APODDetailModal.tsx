"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import Image from "next/image";

type APOD = {
  title: string;
  url: string;
  date: string;
  explanation: string;
  media_type: "image" | "video";
};

export default function APODDetailModal({
  apod,
  open,
  onClose,
}: {
  apod: APOD;
  open: boolean;
  onClose: () => void;
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal content */}
          <motion.div
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/95 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <div className="relative w-full">
              <Image
                src={apod.url}
                alt={apod.title}
                width={1200}
                height={800}
                className="w-full max-h-[50vh] object-contain rounded-t-2xl bg-black"
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Info section */}
            <div className="p-6 md:p-8 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white">
                {apod.title}
              </h2>

              <p className="text-sm text-white/60">{apod.date}</p>

              <p className="text-sm md:text-base leading-relaxed text-white/80">
                {apod.explanation}
              </p>

              <a
                href={apod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View full resolution image →
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
