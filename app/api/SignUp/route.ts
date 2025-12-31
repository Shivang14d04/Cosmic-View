import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { userName, email, password } = await request.json();

    if (!userName || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Username, email and password are required",
        },
        { status: 400 }
      );
    }

    // ⛔ 2. Validate password length
    if (password.length < 6) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }
    const existingUser = await UserModel.findOne({
      email,
    });
    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "User already exits",
        },
        {
          status: 400,
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
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const response = Response.json(
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
        status: 200,
      }
    );

    response.headers.set(
      "Set-Cookie",
      `token=${token} ;HttpOnly;Secure;Path=/;SameSite=Strict;Max-Age=604800`
    );

    return response;
  } catch (error) {
    console.log("Error while registering user", error);
    return Response.json(
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
