import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // Vercel Cron

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find templates that have a cron schedule
  const templates = await prisma.assessmentTemplate.findMany({
    where: {
      cronSchedule: { not: null },
      isActive: true,
      type: "BEHAVIORAL_360",
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  const scheduledCount = templates.length;

  // In a real implementation, we would parse `cronSchedule` using cron-parser
  // and see if it should run now. For now, we will log them as part of the P3 prototype.
  for (const template of templates) {
    console.log(`[recurring-360] Would trigger 360 schedule for org ${template.organization.name}, template ${template.name} with cron ${template.cronSchedule}`);
    
    // Here we would typically:
    // 1. Find all active employees in the org.
    // 2. Create a new Assessment instance for each, or a bulk cycle.
    // 3. Send out notifications.
  }

  return NextResponse.json({ ok: true, scheduledCount });
}
