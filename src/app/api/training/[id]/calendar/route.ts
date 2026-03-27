import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { listAdminTenants } from "@/lib/admin/context";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const adminTenants = listAdminTenants(session.user.tenants);
  const orgIds = adminTenants.map((t) => t.organizationId);
  const { id } = await params;

  const program = await prisma.trainingProgram.findFirst({
    where: { id, organizationId: { in: orgIds } },
  });
  if (!program) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dt = program.trainingDate;
  const stamp = formatIcsDate(dt);
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  const endStamp = formatIcsDate(end);
  const uid = `${program.id}@bolderbrain`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BolderBrain//Training//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${stamp}`,
    `DTEND:${endStamp}`,
    `SUMMARY:${escapeIcs(program.name)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="training-${program.id.slice(0, 8)}.ics"`,
    },
  });
}

function formatIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
