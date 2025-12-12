import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export async function POST(request: Request) {
  await dbConnect();
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return Response.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const PaswordMatch = await bcrypt.compare(password, user.password);
    if (!PaswordMatch) {
      return Response.json({
        success: false,
        message: "Password doesn't match",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userName: user.userName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const response = Response.json({
      success: true,
      message: "User log In successfull",
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
      },
    });

    response.headers.set(
      "Set-Cookie",
      `token=${token} ;HttpOnly;Secure;Path=/;SameSite=Strict;Max-Age=604800`
    );

    return response;
  } catch (error) {
    console.log("Error while logging in user", error);
    return Response.json({
      success: false,
      message: "Error while logging user",
    });
  }
}
