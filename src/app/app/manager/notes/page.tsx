import { redirect } from "next/navigation";
import { getManagerTeamPayload } from "@/lib/manager-dashboard";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { NotesClient } from "./notes-client";

export default async function ManagerNotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const data = await getManagerTeamPayload();
  
  if (!data || data.teamMembers.length === 0) {
    redirect("/app/dashboard");
  }

  const teamMemberIds = data.teamMembers.map(m => m.id);

  const notes = await prisma.managerNote.findMany({
    where: {
      managerId: session.user.id,
      employeeId: { in: teamMemberIds }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-2">
        <p className="text-caption-cerebral">Manager</p>
        <h1 className="text-gradient-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Coaching Notes
        </h1>
        <p className="text-body-cerebral max-w-2xl">
          Private 1:1 notes and coaching logs for your direct reports.
        </p>
      </header>

      <NotesClient teamMembers={data.teamMembers} initialNotes={notes} />
    </div>
  );
}
