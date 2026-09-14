import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAuth } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_DEPARTMENTS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const department = await prisma.department.create({
      data: { name: body.name, nameAr: body.nameAr, code: body.code, description: body.description },
    });
    return NextResponse.json(department, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
