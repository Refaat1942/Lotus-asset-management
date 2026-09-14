import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_BRANCHES);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const branch = await prisma.branch.update({
      where: { id: params.id },
      data: { name: body.name, nameAr: body.nameAr, code: body.code, address: body.address, isActive: body.isActive },
    });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.MANAGE_BRANCHES);
  if (result instanceof NextResponse) return result;

  try {
    await prisma.branch.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
