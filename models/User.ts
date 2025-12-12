import mongoose, { Document, Schema } from "mongoose";

export interface User extends Document {
  userName: string;
  email: string;
  password: string;
  profileImage?: string;
}

const UserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
