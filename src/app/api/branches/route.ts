import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(branches);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_BRANCHES);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const branch = await prisma.branch.create({
      data: { name: body.name, nameAr: body.nameAr, code: body.code, address: body.address },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
