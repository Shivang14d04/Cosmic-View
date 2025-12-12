"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type User = {
  userName: string;
  email: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function logout() {
    await fetch("/api/logOut", { method: "GET" });
    window.location.href = "/logIn";
  }

  if (loading) return null;

  return (
    <nav className="w-full p-4 border-b flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        CosmoView
      </Link>

      <div className="flex items-center gap-3">
        {!user ? (
          <>
            <Link href="/logIn">
              <Button variant="ghost">Login</Button>
            </Link>

            <Link href="/signUp">
              <Button>Sign Up</Button>
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm">Hello, {user.userName}</span>
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
