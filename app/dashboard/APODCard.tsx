type APOD = {
  title: string;
  url: string;
  date: string;
  media_type: "image" | "video";
};

export default function APODCard({ apod }: { apod: APOD }) {
  if (apod.media_type !== "image") return null;

  return (
    <div className="group rounded-xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="relative">
        <img
          src={apod.url}
          alt={apod.title}
          className="h-48 w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0" />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug">{apod.title}</h3>
        <p className="mt-1 text-xs text-white/60">{apod.date}</p>
      </div>
    </div>
  );
}
