"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SuperAdminNav } from "./super-admin-nav";

export function SuperAdminMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-white/80"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="w-72 border-white/10 bg-[#1A1A1E]/95 p-0 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <span className="font-heading font-semibold text-white">Super Admin</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            Close
          </Button>
        </div>
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col p-3">
          <SuperAdminNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
