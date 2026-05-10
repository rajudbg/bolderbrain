"use client";

import { useState, Suspense } from "react";
import { resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token || !email) {
    return (
      <div className="text-center text-red-400">
        <AlertCircle className="mx-auto mb-4 h-8 w-8" />
        <h3 className="mb-2 font-medium">Invalid Link</h3>
        <p className="text-sm">This password reset link is invalid or missing information.</p>
        <div className="mt-6">
          <Link href="/forgot-password" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resetPassword({ email: email as string, token: token as string, password });
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-emerald-400" />
        <h3 className="mb-2 font-medium text-emerald-400">Password Reset Successful</h3>
        <p className="text-sm text-emerald-200/70">
          You can now log in with your new password.
        </p>
        <div className="mt-6">
          <Link href="/login" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start space-x-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email as string}
          disabled
          className="bg-slate-900/50 text-slate-400 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">New Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="bg-slate-900/50 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="bg-slate-900/50 text-white placeholder:text-slate-500"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
      >
        {loading ? "Saving..." : "Set Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Set New Password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your new password below.
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-slate-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
