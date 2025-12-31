"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/logIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.refresh();
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-[#050b18] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-white/50">
            Mission Access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Log In</h1>
          <p className="mt-2 text-sm text-white/60">
            Access your mission dashboard
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-black/70 border-white/10 text-white placeholder:text-white/40"
          />

          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <Button
            disabled={loading}
            type="submit"
            aria-busy={loading}
            className="w-full bg-white text-black hover:bg-white/90"
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
              />
            )}
            Log In
          </Button>
        </form>

        {/* FOOTER */}
        <p className="mt-6 text-sm text-center text-white/60">
          Don’t have an account?{" "}
          <Link
            href="/signUp"
            className="text-white underline underline-offset-4 hover:text-white/80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
