type SolWeather = {
  First_UTC?: string;
  Last_UTC?: string;
  AT?: {
    av?: number;
    mn?: number;
    mx?: number;
  };
  PRE?: {
    av?: number;
  };
  HWS?: {
    av?: number;
  };
  Season?: string;
};

type InsightResponse = {
  sol_keys: string[];
  [sol: string]: SolWeather | string[];
};

// Helper to format date like "Aug 25"
function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function Page() {
  const res = await fetch(
    `https://api.nasa.gov/insight_weather/?api_key=${process.env.NASA_API_KEY}&feedtype=json&ver=1.0`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Mars weather data");
  }

  const data: InsightResponse = await res.json();

  const sols = data.sol_keys;
  const latestSol = sols[sols.length - 1];
  const latest = data[latestSol] as SolWeather;

  return (
    <main className="relative min-h-screen text-white">
      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/nasa.jpg)" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        {/* HEADER */}
        <h1 className="text-5xl font-bold leading-tight">
          Latest Weather
          <br />
          at Elysium Planitia
        </h1>

        <p className="mt-6 max-w-xl text-white/70">
          InSight is taking daily weather measurements (temperature, wind,
          pressure) on the surface of Mars at Elysium Planitia, a smooth plain
          near Mars’ equator.
        </p>

        {/* MAIN SOL */}
        <div className="mt-16 flex flex-col md:flex-row md:items-end gap-12">
          <div>
            <p className="text-4xl font-semibold">Sol {latestSol}</p>
            <p className="text-white/60 mt-1">{formatDate(latest.First_UTC)}</p>
          </div>

          <div className="text-lg space-y-2">
            <p>
              High: {latest.AT?.mx !== undefined ? `${latest.AT.mx} °C` : "N/A"}
            </p>
            <p>
              Low: {latest.AT?.mn !== undefined ? `${latest.AT.mn} °C` : "N/A"}
            </p>
          </div>
        </div>

        {/* SOL TIMELINE */}
        <div className="mt-26">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {sols.map((sol) => {
              const w = data[sol] as SolWeather;

              return (
                <div
                  key={sol}
                  className="bg-black/40 backdrop-blur rounded-xl p-4 border border-white/10"
                >
                  <p className="text-lg font-semibold">Sol {sol}</p>

                  {/* DATE */}
                  <p className="text-xs text-white/50 mt-1">
                    {formatDate(w.First_UTC)}
                  </p>

                  <div className="mt-3 text-xs text-white/90 space-y-1">
                    <p>High: {w.AT?.mx ?? "N/A"} °C</p>
                    <p>Low: {w.AT?.mn ?? "N/A"} °C</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTNOTE */}
        <p className="mt-12 text-xs text-white/40">
          Data gaps exist due to InSight power limitations and sensor
          availability.
        </p>
      </div>
    </main>
  );
}
