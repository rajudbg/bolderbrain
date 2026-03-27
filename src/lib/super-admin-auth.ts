import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requirePlatformSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/super-admin");
  }
  if (!session.user.isPlatformSuperAdmin) {
    redirect("/");
  }
  return session;
}
