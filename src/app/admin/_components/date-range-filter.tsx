"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") ?? "90";

  return (
    <div className="flex items-center gap-2">
      <Calendar className="size-4 text-white/50" />
      <Select
        value={currentDays}
        onValueChange={(val) => {
          const params = new URLSearchParams(searchParams.toString());
          if (val === "90") {
            params.delete("days");
          } else if (val !== null && val !== undefined) {
            params.set("days", val);
          }
          router.push(`?${params.toString()}`, { scroll: false });
        }}
      >
        <SelectTrigger className="w-[160px] border-white/10 bg-white/[0.02] text-sm text-white/90 backdrop-blur-md">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="180">Last 6 months</SelectItem>
          <SelectItem value="365">Last 12 months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
