import prisma from "@/lib/prisma";

const AI_MODEL_KEY = "ai_primary_model";

export async function getPlatformSetting(key: string): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value ?? null;
}

export async function setPlatformSetting(
  key: string,
  value: string,
  updatedBy?: string,
): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value, updatedBy: updatedBy ?? null },
    update: { value, updatedBy: updatedBy ?? null },
  });
}

export async function getPrimaryModelFromDb(): Promise<string | null> {
  return getPlatformSetting(AI_MODEL_KEY);
}

export async function setPrimaryModelInDb(model: string, updatedBy?: string): Promise<void> {
  await setPlatformSetting(AI_MODEL_KEY, model, updatedBy);
}

export async function resolveEffectiveModel(): Promise<string> {
  const dbModel = await getPrimaryModelFromDb();
  if (dbModel) return dbModel;
  return process.env.AI_PRIMARY_MODEL || "anthropic/claude-opus-4.7";
}
