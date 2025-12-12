import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: "User logged out successfully",
  });

  response.headers.set(
    "Set-Cookie",
    `token= ; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0`
  );
  return response;
}
