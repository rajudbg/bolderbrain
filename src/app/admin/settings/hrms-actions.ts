'use server';

import { requireAdminOrganizationId } from '@/lib/admin/context';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import type { HrmsProvider } from '@/generated/prisma/enums';

export async function createHrmsIntegration(provider: HrmsProvider) {
  const orgId = await requireAdminOrganizationId();
  // Generate a secure webhook secret
  const secret = randomBytes(32).toString('hex');

  await prisma.hrmsIntegration.upsert({
    where: {
      organizationId_provider: { organizationId: orgId, provider },
    },
    create: {
      organizationId: orgId,
      provider,
      webhookSecret: secret,
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });
  revalidatePath('/admin/settings');
}

export async function disableHrmsIntegration(id: string) {
  const orgId = await requireAdminOrganizationId();
  await prisma.hrmsIntegration.update({
    where: { id, organizationId: orgId },
    data: { isActive: false },
  });
  revalidatePath('/admin/settings');
}

export async function regenerateHrmsSecret(id: string) {
  const orgId = await requireAdminOrganizationId();
  const secret = randomBytes(32).toString('hex');
  await prisma.hrmsIntegration.update({
    where: { id, organizationId: orgId },
    data: { webhookSecret: secret },
  });
  revalidatePath('/admin/settings');
}
