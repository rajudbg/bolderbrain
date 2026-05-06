import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getUnreadNotifications,
  markAllNotificationsRead,
  dismissNotification,
} from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getUnreadNotifications(session.user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { action?: string; id?: string };

  if (body.action === "mark_all_read") {
    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "dismiss" && body.id) {
    await dismissNotification(session.user.id, body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
