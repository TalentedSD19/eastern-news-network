"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard/articles");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-background flex items-center justify-center px-4">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 shadow-sm p-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 mb-6">
          <Image src="/android-chrome-192x192.png" alt="Eastern News Network" width={72} height={72} className="mb-2" />
          <span className="font-display font-medium tracking-tight text-2xl text-gray-900 dark:text-gray-50">Eastern News Network</span>
          <span className="text-[0.6rem] tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase font-sans">Admin Access</span>
          <div className="w-6 h-0.5 bg-brand-accent mt-3" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
