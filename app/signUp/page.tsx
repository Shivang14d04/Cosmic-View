"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ userName: "", email: "", password: "" });
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

    setSuccess("Account created! Redirecting...");
    setTimeout(() => router.push("/logIn"), 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle className="text-center">Create Account</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <Input
              placeholder="Username"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
            />

            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 text-center">{success}</p>
            )}

            <Button type="submit" className="w-full">
              Sign Up
            </Button>

            <p className="text-sm text-center mt-2">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600">
                Log in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
