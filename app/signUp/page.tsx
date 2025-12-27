"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/SignUp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Signup failed");
      return;
    }

    setSuccess("Account created successfully");
    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
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
          <h1 className="mt-2 text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-sm text-white/60">
            Join the mission to explore space data
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            placeholder="Username"
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
          />

          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
          />

          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {success && (
            <p className="text-sm text-green-400 text-center">{success}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-white/90"
          >
            Sign Up
          </Button>
        </form>

        {/* FOOTER */}
        <p className="mt-6 text-sm text-center text-white/60">
          Already have an account?{" "}
          <Link
            href="/logIn"
            className="text-white underline underline-offset-4 hover:text-white/80"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
