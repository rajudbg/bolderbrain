import { redirect } from "next/navigation";
import { getEmployeeActionsPagePayload } from "@/lib/employee-actions-page";
import { MyActionsClient } from "./my-actions-client";

export default async function MyActionsPage() {
  const data = await getEmployeeActionsPagePayload();
  if (!data) redirect("/login?callbackUrl=/app/actions");

  return (
    <MyActionsClient
      weekKey={data.weekKey}
      thisWeek={data.thisWeek}
      history={data.history}
      streak={data.streak}
    />
  );
}
