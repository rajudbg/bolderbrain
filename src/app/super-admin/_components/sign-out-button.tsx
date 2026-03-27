"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button variant="outline" className="w-full justify-start gap-2" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
