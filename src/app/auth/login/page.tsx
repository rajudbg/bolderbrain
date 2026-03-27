import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function AuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030305] p-4 text-sm text-white/50">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
