import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api-rate-limit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 feedback submissions per minute per user
  const limitKey = `ai-feedback:${session.user.id}`;
  if (!checkRateLimit(limitKey, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before submitting more feedback." }, { status: 429 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rating = typeof body === "object" && body !== null && "rating" in body ? Number((body as { rating: unknown }).rating) : NaN;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  }

  const row = await prisma.aIInsight.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aIInsight.update({
    where: { id },
    data: { userRating: Math.round(rating) },
  });

  return NextResponse.json({ ok: true });
}