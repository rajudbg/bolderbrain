"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  X,
  Sparkles,
  Target,
  Brain,
  Heart,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

function typeIcon(type: string) {
  switch (type) {
    case "RESULTS_READY_360":
      return Brain;
    case "ACTION_ASSIGNED":
      return Target;
    case "EQ_RESULTS_READY":
      return Heart;
    case "PSYCH_RESULTS_READY":
      return Sparkles;
    default:
      return Bell;
  }
}

function typeColor(type: string) {
  switch (type) {
    case "RESULTS_READY_360":
      return "from-violet-500 to-purple-600";
    case "ACTION_ASSIGNED":
      return "from-indigo-500 to-blue-600";
    case "EQ_RESULTS_READY":
      return "from-rose-500 to-pink-600";
    case "PSYCH_RESULTS_READY":
      return "from-cyan-500 to-blue-500";
    default:
      return "from-white/20 to-white/10";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/app/notifications");
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore network errors
    }
  }, []);

  // Poll every 60s and on mount
  useEffect(() => {
    void fetchNotifications();
    const id = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      // Mark all read optimistically
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
      await fetch("/api/app/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    }
  }

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((n) => n.filter((x) => x.id !== id));
    await fetch("/api/app/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", id }),
    });
  }

  function handleNotificationClick(notif: Notification) {
    setOpen(false);
    if (notif.href) router.push(notif.href);
  }

  const visible = notifications.filter((n) => !n.isRead || open).slice(0, 20);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        type="button"
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        onClick={() => void handleOpen()}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl transition-all",
          "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
          open && "bg-white/[0.06] text-white/80",
        )}
      >
        <Bell className="size-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center",
                "rounded-full bg-gradient-to-br from-rose-500 to-pink-600 px-1",
                "text-[9px] font-bold leading-none text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]",
              )}
              style={{ height: 16 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))]",
              "overflow-hidden rounded-2xl border border-white/10",
              "bg-[#111115]/95 shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-white/60" />
                <span className="text-sm font-semibold text-white/90">Notifications</span>
                {notifications.length > 0 && (
                  <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[10px] text-white/50">
                    {notifications.length}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    setNotifications([]);
                    await fetch("/api/app/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "mark_all_read" }),
                    });
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  <CheckCheck className="size-3.5" />
                  Clear all
                </button>
              )}
            </div>

            {/* Notification list */}
            <div
              className="max-h-[min(400px,60dvh)] overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <Bell className="size-6 text-white/20" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/50">All caught up</p>
                    <p className="mt-0.5 text-xs text-white/30">No new notifications</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {notifications.map((notif) => {
                    const Icon = typeIcon(notif.type);
                    const gradient = typeColor(notif.type);
                    return (
                      <motion.li
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className={cn(
                          "group relative flex cursor-pointer gap-3 px-4 py-3.5 transition-colors",
                          "hover:bg-white/[0.04]",
                          !notif.isRead && "bg-white/[0.025]",
                        )}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        {/* Unread dot */}
                        {!notif.isRead && (
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-indigo-400" />
                        )}

                        {/* Icon */}
                        <div
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                            `bg-gradient-to-br ${gradient}`,
                          )}
                        >
                          <Icon className="size-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug text-white/90">
                            {notif.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-white/50 line-clamp-2">
                            {notif.body}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-white/30">
                            <Clock className="size-2.5" />
                            {relativeTime(notif.createdAt)}
                          </p>
                        </div>

                        {/* Dismiss */}
                        <button
                          type="button"
                          onClick={(e) => void handleDismiss(notif.id, e)}
                          aria-label="Dismiss notification"
                          className="mt-0.5 shrink-0 rounded-lg p-1 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/60 group-hover:opacity-100"
                        >
                          <X className="size-3.5" />
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
