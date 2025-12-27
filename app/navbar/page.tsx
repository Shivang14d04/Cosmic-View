"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/nav-items";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";

type User = {
  userName: string;
  email: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
  }, [pathname]);

  async function logout() {
    await fetch("/api/logOut", { method: "GET" });
    router.refresh();
    router.push("/");
  }

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-black">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg text-white font-semibold tracking-wide"
        >
          CosmicView
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            if (item.auth && !user) return null;

            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "text-sm transition",
                  isActive
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Section (Auth) */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/logIn"
                className="text-sm text-white/60 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/signUp"
                className="text-sm text-white/60 hover:text-white transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-white/70 flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="User Avatar"
                  />
                  <AvatarFallback></AvatarFallback>
                </Avatar>
                @{user.userName}
              </span>
              <Button variant="destructive" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
