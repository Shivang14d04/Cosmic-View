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

    const { userName, email, password } = await request.json();

    if (!userName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username, email and password are required",
        },
        { status: 400 }
      );
    }

    // ⛔ 2. Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { userName }],
    });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      userName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        userName: newUser.userName,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          userName: newUser.userName,
        },
      },
      {
        status: 201,
      }
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
    console.log("Error while registering user", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error signing Up user",
      },
      {
        status: 500,
      }
    );
  }
}
