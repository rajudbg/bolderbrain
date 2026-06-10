import prisma from "@/lib/prisma";

export async function notifySlack(organizationId: string, message: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slackWebhookUrl: true }
    });

    if (!org?.slackWebhookUrl) return false;

    const response = await fetch(org.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });

    return response.ok;
  } catch (error) {
    console.error("Slack webhook error:", error);
    return false;
  }
}
