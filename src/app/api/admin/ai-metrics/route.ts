import { auth } from "@/auth";
import { getAIMetrics } from "@/lib/ai/metrics";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.isPlatformSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await getAIMetrics();
  return NextResponse.json(metrics);
}
