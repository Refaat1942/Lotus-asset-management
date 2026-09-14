import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      email: body.email,
      roleId: body.roleId,
      isActive: body.isActive,
      canChangeUsername: body.canChangeUsername,
    };
    if (body.password) {
      data.passwordHash = await hashPassword(body.password);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      include: { role: true },
    });

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (result instanceof NextResponse) return result;

  try {
    if (params.id === result.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
