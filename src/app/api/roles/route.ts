import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const result = await requirePermission(PERMISSIONS.MANAGE_AUTHORIZATION);
  if (result instanceof NextResponse) return result;

  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_AUTHORIZATION);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const role = await prisma.role.create({
      data: { name: body.name, nameAr: body.nameAr, description: body.description },
    });

    if (body.permissionIds?.length) {
      await prisma.rolePermission.createMany({
        data: body.permissionIds.map((pid: string) => ({ roleId: role.id, permissionId: pid })),
      });
    }

    return NextResponse.json(role, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
