import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.VIEW_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        branch: true,
        currentAssignee: true,
        assignments: {
          include: { person: true, assignedBy: { select: { username: true } } },
          orderBy: { assignedAt: 'desc' },
        },
        transfers: {
          include: {
            fromBranch: true,
            toBranch: true,
            transferredBy: { select: { username: true } },
          },
          orderBy: { transferDate: 'desc' },
        },
        history: {
          include: { createdBy: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        depreciation: { orderBy: { recordedAt: 'desc' } },
      },
    });

    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.EDIT_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();
    const existing = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        category: body.category,
        serialNumber: body.serialNumber,
        model: body.model,
        manufacturer: body.manufacturer,
        departmentId: body.departmentId || null,
        branchId: body.branchId || null,
        status: body.status,
        condition: body.condition,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice,
        currentValue: body.currentValue,
        depreciationRate: body.depreciationRate,
        notes: body.notes,
      },
      include: { department: true, branch: true, currentAssignee: true },
    });

    if (body.status && body.status !== existing.status) {
      await recordAssetHistory({
        assetId: asset.id,
        eventType: 'STATUS_CHANGED',
        title: `Status changed from ${existing.status} to ${body.status}`,
        titleAr: `تم تغيير الحالة من ${existing.status} إلى ${body.status}`,
        createdById: result.user.id,
      });
    }

    if (body.condition && body.condition !== existing.condition) {
      await recordAssetHistory({
        assetId: asset.id,
        eventType: 'CONDITION_CHANGED',
        title: `Condition changed from ${existing.condition} to ${body.condition}`,
        titleAr: `تم تغيير الحالة الفنية`,
        createdById: result.user.id,
      });
    }

    await recordAssetHistory({
      assetId: asset.id,
      eventType: 'UPDATED',
      title: 'Asset information updated',
      titleAr: 'تم تحديث معلومات الأصل',
      createdById: result.user.id,
    });

    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.DELETE_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    await prisma.asset.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
