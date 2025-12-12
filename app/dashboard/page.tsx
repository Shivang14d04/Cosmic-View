import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user = null;
  if (token) {
    user = jwt.verify(token, process.env.JWT_SECRET);
  }
  return <h1>Welcome, {user?.name}</h1>;
}
