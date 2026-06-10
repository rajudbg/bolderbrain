"use server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createManagerNote(employeeId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // Find org id
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id }
  });
  if (!member) throw new Error("No org");

  await prisma.managerNote.create({
    data: {
      organizationId: member.organizationId,
      managerId: session.user.id,
      employeeId,
      content,
    },
  });
  revalidatePath("/app/manager/notes");
}
