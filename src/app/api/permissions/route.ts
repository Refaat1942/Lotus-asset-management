import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const result = await requirePermission(PERMISSIONS.MANAGE_AUTHORIZATION);
  if (result instanceof NextResponse) return result;

  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    return NextResponse.json(permissions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
