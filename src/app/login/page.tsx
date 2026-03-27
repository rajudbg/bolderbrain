import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030305] p-4 text-sm text-white/50">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
