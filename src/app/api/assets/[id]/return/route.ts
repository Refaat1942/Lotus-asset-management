import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.ASSIGN_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { notes } = await request.json();
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: { currentAssignee: true },
    });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    if (!asset.currentAssigneeId) {
      return NextResponse.json({ error: 'Asset is not assigned' }, { status: 400 });
    }

    await prisma.assetAssignment.updateMany({
      where: { assetId: params.id, returnedAt: null },
      data: { returnedAt: new Date(), notes },
    });

    await prisma.asset.update({
      where: { id: params.id },
      data: { currentAssigneeId: null, status: 'AVAILABLE' },
    });

    await recordAssetHistory({
      assetId: params.id,
      eventType: 'RETURNED',
      title: `Returned from ${asset.currentAssignee?.name}`,
      titleAr: `تم الإرجاع من ${asset.currentAssignee?.name}`,
      description: notes,
      createdById: result.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to return asset' }, { status: 500 });
  }
}
