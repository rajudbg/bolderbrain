import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeHrmsPayload } from '@/lib/hrms/normalizers';

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    const body = await req.json();
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new NextResponse('Unauthorized: Missing token', { status: 401 });
    }

    // Find integration by webhook secret
    const integration = await prisma.hrmsIntegration.findFirst({
      where: { provider, webhookSecret: token },
    });

    if (!integration) {
      return new NextResponse('Unauthorized: Invalid token or provider', { status: 401 });
    }

    const orgId = integration.organizationId;
    const employees = normalizeHrmsPayload(provider, body);

    for (const emp of employees) {
      if (!emp.email) continue;

      // 1. Upsert User
      const user = await prisma.user.upsert({
        where: { email: emp.email },
        create: {
          email: emp.email,
          name: emp.name || null,
          isActive: emp.isActive,
        },
        update: {
          name: emp.name || undefined,
          isActive: emp.isActive,
        },
      });

      // 2. Upsert Manager (if provided)
      let managerId = null;
      if (emp.managerEmail) {
        const managerUser = await prisma.user.findUnique({ where: { email: emp.managerEmail } });
        if (managerUser) managerId = managerUser.id;
      }

      // 3. Upsert OrganizationMember
      await prisma.organizationMember.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
        create: {
          userId: user.id,
          organizationId: orgId,
          role: emp.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
          department: emp.department || null,
          managerId,
        },
        update: {
          department: emp.department || undefined,
          managerId: managerId !== null ? managerId : undefined,
        },
      });
    }

    // Update last sync time
    await prisma.hrmsIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return new NextResponse('Sync successful', { status: 200 });
  } catch (error) {
    console.error('HRMS Webhook Error:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Server Error', { status: 500 });
  }
}
