import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        employeeId: body.employeeId,
        departmentId: body.departmentId || null,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(person);
  } catch {
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  try {
    const assigned = await prisma.asset.count({ where: { currentAssigneeId: params.id } });
    if (assigned > 0) {
      return NextResponse.json({ error: 'Cannot delete person with assigned assets' }, { status: 400 });
    }
    await prisma.person.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
