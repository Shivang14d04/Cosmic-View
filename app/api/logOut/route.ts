import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: "User logged out successfully",
  });

  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
