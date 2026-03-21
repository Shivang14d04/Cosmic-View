"use client";

import { useState } from "react";
import APODDetailModal from "./APODDetailModal";

type APOD = {
  title: string;
  url: string;
  date: string;
  explanation: string;
  media_type: "image" | "video";
};

export default function APODCard({ apod }: { apod: APOD }) {
  const [open, setOpen] = useState(false);

  if (apod.media_type !== "image") return null;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group rounded-xl border border-white/10 bg-black/40 overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/25 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]"
      >
        <div className="relative">
          <img
            src={apod.url}
            alt={apod.title}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0" />
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold leading-snug line-clamp-1">
            {apod.title}
          </h3>{" "}
          <p className="mt-1 text-xs text-white/60">{apod.date}</p>
          <p className="mt-2 text-xs text-white/40 group-hover:text-white/60 transition-colors">
            Click to explore →
          </p>
        </div>
      </div>

      <APODDetailModal apod={apod} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
