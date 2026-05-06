import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { LoginSkeleton } from "@/components/ui/skeleton-loading";

export default function AuthLoginPage() {
  return (
    <Suspense
      fallback={
        <LoginSkeleton />
      }
    >
      <LoginForm />
    </Suspense>
  );
}