import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requirePermission(PERMISSIONS.ASSIGN_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { personId, notes } = await request.json();
    if (!personId) return NextResponse.json({ error: 'Person is required' }, { status: 400 });

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: { currentAssignee: true },
    });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    if (asset.currentAssigneeId) {
      await prisma.assetAssignment.updateMany({
        where: { assetId: params.id, returnedAt: null },
        data: { returnedAt: new Date() },
      });
      if (asset.currentAssignee) {
        await recordAssetHistory({
          assetId: params.id,
          eventType: 'RETURNED',
          title: `Returned from ${asset.currentAssignee.name}`,
          titleAr: `تم الإرجاع من ${asset.currentAssignee.name}`,
          createdById: result.user.id,
        });
      }
    }

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 });

    await prisma.assetAssignment.create({
      data: {
        assetId: params.id,
        personId,
        assignedById: result.user.id,
        notes,
      },
    });

    await prisma.asset.update({
      where: { id: params.id },
      data: { currentAssigneeId: personId, status: 'ASSIGNED' },
    });

    await recordAssetHistory({
      assetId: params.id,
      eventType: 'ASSIGNED',
      title: `Assigned to ${person.name}`,
      titleAr: `تم التعيين إلى ${person.name}`,
      description: notes,
      createdById: result.user.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to assign asset' }, { status: 500 });
  }
}
