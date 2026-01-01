import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    await dbConnect();
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, message: "Server misconfigured" },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password required",
        },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const PaswordMatch = await bcrypt.compare(password, user.password);
    if (!PaswordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userName: user.userName,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "User log In successfull",
        user: {
          id: user._id,
          email: user.email,
          userName: user.userName,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.log("Error while logging in user", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error while logging user",
      },
      { status: 500 }
    );
  }
}
