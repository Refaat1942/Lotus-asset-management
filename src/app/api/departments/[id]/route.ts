import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_DEPARTMENTS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const department = await prisma.department.update({
      where: { id: params.id },
      data: { name: body.name, nameAr: body.nameAr, code: body.code, description: body.description, isActive: body.isActive },
    });
    return NextResponse.json(department);
  } catch {
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_DEPARTMENTS);
  if (result instanceof NextResponse) return result;

  try {
    await prisma.department.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
