import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyDemoRequest } from "@/lib/email";

const demoRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(160),
  size: z.string().trim().min(1).max(40),
  message: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please complete the required fields with valid details." },
      { status: 400 },
    );
  }

  await notifyDemoRequest(parsed.data);
  return NextResponse.json({ ok: true });
}
