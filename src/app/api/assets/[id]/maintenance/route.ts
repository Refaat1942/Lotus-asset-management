import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.EDIT_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { type, description } = await request.json();
    const eventType = type === 'issue' ? 'ISSUE_REPORTED' : 'MAINTENANCE';
    const status = type === 'issue' ? 'IN_REPAIR' : 'IN_MAINTENANCE';

    await prisma.asset.update({
      where: { id: params.id },
      data: { status },
    });

    await recordAssetHistory({
      assetId: params.id,
      eventType,
      title: type === 'issue' ? 'Issue reported' : 'Maintenance recorded',
      titleAr: type === 'issue' ? 'تم الإبلاغ عن مشكلة' : 'تم تسجيل صيانة',
      description,
      createdById: result.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record maintenance' }, { status: 500 });
  }
}
