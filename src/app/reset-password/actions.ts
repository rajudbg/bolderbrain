"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function resetPassword(input: z.infer<typeof resetPasswordSchema>) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid input." };
  }

  const { email, token, password } = parsed.data;

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token,
    },
  });

  if (!verificationToken) {
    return { error: "Invalid or expired reset link." };
  }

  if (new Date() > verificationToken.expires) {
    return { error: "Reset link has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      passwordHash,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase(), token },
  });

  return { ok: true };
}
