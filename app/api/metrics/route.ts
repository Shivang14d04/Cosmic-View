import { NextResponse } from "next/server";
import client from "prom-client";

// collect default metrics
client.collectDefaultMetrics();

export async function GET() {
  const metrics = await client.register.metrics();

  return new Response(metrics, {
    headers: {
      "Content-Type": client.register.contentType,
    },
  });
}
