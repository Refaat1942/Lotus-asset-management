import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.TRANSFER_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { toBranchId, notes } = await request.json();
    if (!toBranchId) return NextResponse.json({ error: 'Target branch is required' }, { status: 400 });

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: { branch: true },
    });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const toBranch = await prisma.branch.findUnique({ where: { id: toBranchId } });
    if (!toBranch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    await prisma.assetTransfer.create({
      data: {
        assetId: params.id,
        fromBranchId: asset.branchId,
        toBranchId,
        transferredById: result.user.id,
        notes,
      },
    });

    await prisma.asset.update({
      where: { id: params.id },
      data: { branchId: toBranchId },
    });

    const fromName = asset.branch?.name || 'Unknown';
    await recordAssetHistory({
      assetId: params.id,
      eventType: 'TRANSFERRED',
      title: `Transferred from ${fromName} to ${toBranch.name}`,
      titleAr: `تم النقل من ${fromName} إلى ${toBranch.name}`,
      description: notes,
      metadata: { fromBranchId: asset.branchId, toBranchId },
      createdById: result.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to transfer asset' }, { status: 500 });
  }
}
