import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.EDIT_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { newValue, notes } = await request.json();
    if (newValue === undefined) return NextResponse.json({ error: 'New value is required' }, { status: 400 });

    const asset = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const previousValue = asset.currentValue ? Number(asset.currentValue) : 0;
    const depreciationAmount = previousValue - Number(newValue);

    await prisma.depreciationRecord.create({
      data: {
        assetId: params.id,
        previousValue: asset.currentValue,
        newValue,
        depreciationAmount: Math.max(0, depreciationAmount),
        notes,
      },
    });

    await prisma.asset.update({
      where: { id: params.id },
      data: { currentValue: newValue },
    });

    await recordAssetHistory({
      assetId: params.id,
      eventType: 'DEPRECIATION',
      title: `Value updated from ${previousValue} to ${newValue}`,
      titleAr: `تم تحديث القيمة من ${previousValue} إلى ${newValue}`,
      description: notes,
      createdById: result.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record depreciation' }, { status: 500 });
  }
}
