import APODCard from "./APODCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type APOD = {
  title: string;
  url: string;
  date: string;
  explanation: string;
  media_type: "image" | "video";
};

export default async function Page() {
  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    throw new Error("NASA_API_KEY is missing");
  }

  // Last 10 days of APOD
  const res = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&count=30`,
    {
      // Cache on the server and revalidate periodically so navigating
      // Mars -> Dashboard doesn't refetch every time.
      next: { revalidate: 60 * 60 },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch APOD list");
  }

  const data: APOD[] = await res.json();
  const ApodImage = data[0];
  const imageGallery = data.slice(1);

  return (
    <main className="min-h-screen bg-black text-white px-6 md:px-8 py-12">
      {/* DASHBOARD GRID */}

      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* LEFT SIDE — TEXT */}
        <div className="space-y-6">
          {/* Light heading */}
          <p className="text-sm uppercase tracking-widest text-white/50">
            Astronomy Picture of the Day
          </p>

          {/* Main title */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            {data[0].title}
          </h1>

          {/* Date */}
          <p className="text-sm text-white/60">{data[0].date}</p>
          {/* Explanation */}
          <p className="text-sm md:text-base leading-relaxed text-white/80">
            {data[0].explanation}
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
