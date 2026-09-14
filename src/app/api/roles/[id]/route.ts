import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_AUTHORIZATION);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();

    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (role?.isSystem && body.name !== role.name) {
      return NextResponse.json({ error: 'Cannot rename system role' }, { status: 400 });
    }

    await prisma.role.update({
      where: { id: params.id },
      data: { name: body.name, nameAr: body.nameAr, description: body.description },
    });

    if (body.permissionIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: params.id } });
      if (body.permissionIds.length) {
        await prisma.rolePermission.createMany({
          data: body.permissionIds.map((pid: string) => ({ roleId: params.id, permissionId: pid })),
        });
      }
    }

    const updated = await prisma.role.findUnique({
      where: { id: params.id },
      include: { permissions: { include: { permission: true } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_AUTHORIZATION);
  if (result instanceof NextResponse) return result;

  try {
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (role?.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system role' }, { status: 400 });
    }
    await prisma.role.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
