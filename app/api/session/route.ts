import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.json({ user });
  } catch (error) {
    console.log("Error verifying token:", error);
    return NextResponse.json({ user: null });
  }
}
