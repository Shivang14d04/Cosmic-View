import APODCard from "./APODCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const dynamic = "force-dynamic";

type APOD = {
  title: string;
  url: string;
  date: string;
  explanation: string;
  media_type: "image" | "video";
};

export default async function Page() {
  const apiKey = process.env.NASA_API_KEY;

  let data: APOD[] = [];
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&count=30`,
        {
          cache: "no-store",
        },
      );

      if (res.ok) {
        data = (await res.json()) as APOD[];
      }
    } catch {
      // Intentionally swallow errors so builds and renders don't hard-fail
      // when the external NASA API is unavailable.
      data = [];
    }
  }

  const imageItems = data.filter(
    (item) => item.media_type === "image" && typeof item.url === "string",
  );
  const ApodImage = imageItems[0];
  const imageGallery = imageItems.slice(1);

  return (
    <main className="min-h-screen bg-black text-white px-6 md:px-8 py-12">
      {/* DASHBOARD GRID */}

      {ApodImage ? (
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* LEFT SIDE — TEXT */}
          <div className="space-y-6">
            {/* Light heading */}
            <p className="text-sm uppercase tracking-widest text-white/50">
              Astronomy Picture of the Day
            </p>

            {/* Main title */}
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
              {ApodImage.title}
            </h1>

            {/* Date */}
            <p className="text-sm text-white/60">{ApodImage.date}</p>
            {/* Explanation */}
            <p className="text-sm md:text-base leading-relaxed text-white/80">
              {ApodImage.explanation}
            </p>
          </div>

          {/* RIGHT SIDE — IMAGE */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
            <img
              src={ApodImage.url}
              alt={ApodImage.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-widest text-white/50">
            Astronomy Picture of the Day
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Unable to load APOD right now
          </h1>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-white/80">
            {apiKey
              ? "The NASA API is currently unavailable. Please try again later."
              : "NASA_API_KEY is not configured."}
          </p>
        </div>
      )}
      <section className="mt-12 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-xl font-semibold tracking-tight">
            More from the Cosmos
          </h2>
          <p className="hidden md:block text-sm text-white/55">
            Scroll to explore recent picks
          </p>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-6 pb-4">
            {imageGallery.map((apod) => (
              <div key={apod.date} className="w-64 shrink-0">
                <APODCard apod={apod} />
              </div>
            ))}
          </div>

          {/* Horizontal scrollbar */}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    </main>
  );
}
