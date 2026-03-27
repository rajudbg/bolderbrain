"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast border border-white/10 bg-[#1A1A1E] text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl",
          title: "text-white/90",
          description: "text-white/60",
          success: "border-l-4 border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
          error: "border-l-4 border-l-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
          warning: "border-l-4 border-l-amber-500",
          info: "border-l-4 border-l-blue-500",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-rose-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-white/60 motion-reduce:animate-none" />,
      }}
      style={
        {
          "--normal-bg": "#1A1A1E",
          "--normal-text": "#fafafa",
          "--normal-border": "rgba(255,255,255,0.1)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
