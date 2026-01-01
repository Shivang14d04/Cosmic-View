import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { success: false, message: "Server misconfigured" },
      { status: 500 }
    );
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    return NextResponse.json({ user });
  } catch (error) {
    console.log("Error verifying token:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
