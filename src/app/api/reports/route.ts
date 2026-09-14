import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { exportToExcel } from '@/lib/excel-import';

export async function GET(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.VIEW_REPORTS);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'assets';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const exportExcel = searchParams.get('export') === 'true';

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let data: Record<string, unknown>[] = [];

    switch (type) {
      case 'assets': {
        const assets = await prisma.asset.findMany({
          where: fromDate || toDate ? { createdAt: dateFilter } : undefined,
          include: { department: true, branch: true, currentAssignee: true },
          orderBy: { createdAt: 'desc' },
        });
        data = assets.map((a) => ({
          'Asset Code': a.assetCode,
          'Name': a.name,
          'Category': a.category,
          'Department': a.department?.name,
          'Branch': a.branch?.name,
          'Status': a.status,
          'Condition': a.condition,
          'Assignee': a.currentAssignee?.name,
          'Purchase Date': a.purchaseDate?.toISOString().split('T')[0],
          'Purchase Price': a.purchasePrice,
          'Current Value': a.currentValue,
          'Serial Number': a.serialNumber,
        }));
        break;
      }
      case 'assignments': {
        const assignments = await prisma.assetAssignment.findMany({
          where: fromDate || toDate ? { assignedAt: dateFilter } : undefined,
          include: {
            asset: true,
            person: true,
            assignedBy: { select: { username: true } },
          },
          orderBy: { assignedAt: 'desc' },
        });
        data = assignments.map((a) => ({
          'Asset Code': a.asset.assetCode,
          'Asset Name': a.asset.name,
          'Assigned To': a.person.name,
          'Assigned By': a.assignedBy.username,
          'Assigned Date': a.assignedAt.toISOString(),
          'Return Date': a.returnedAt?.toISOString() || '',
          'Notes': a.notes,
        }));
        break;
      }
      case 'transfers': {
        const transfers = await prisma.assetTransfer.findMany({
          where: fromDate || toDate ? { transferDate: dateFilter } : undefined,
          include: {
            asset: true,
            fromBranch: true,
            toBranch: true,
            transferredBy: { select: { username: true } },
          },
          orderBy: { transferDate: 'desc' },
        });
        data = transfers.map((t) => ({
          'Asset Code': t.asset.assetCode,
          'Asset Name': t.asset.name,
          'From Branch': t.fromBranch?.name || 'N/A',
          'To Branch': t.toBranch.name,
          'Transfer Date': t.transferDate.toISOString(),
          'Transferred By': t.transferredBy.username,
          'Notes': t.notes,
        }));
        break;
      }
      case 'history': {
        const history = await prisma.assetHistory.findMany({
          where: fromDate || toDate ? { createdAt: dateFilter } : undefined,
          include: {
            asset: true,
            createdBy: { select: { username: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = history.map((h) => ({
          'Asset Code': h.asset.assetCode,
          'Event Type': h.eventType,
          'Title': h.title,
          'Description': h.description,
          'Date': h.createdAt.toISOString(),
          'Recorded By': h.createdBy?.username,
        }));
        break;
      }
      case 'depreciation': {
        const records = await prisma.depreciationRecord.findMany({
          where: fromDate || toDate ? { recordedAt: dateFilter } : undefined,
          include: { asset: true },
          orderBy: { recordedAt: 'desc' },
        });
        data = records.map((r) => ({
          'Asset Code': r.asset.assetCode,
          'Asset Name': r.asset.name,
          'Previous Value': r.previousValue,
          'New Value': r.newValue,
          'Depreciation Amount': r.depreciationAmount,
          'Date': r.recordedAt.toISOString(),
          'Notes': r.notes,
        }));
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (exportExcel) {
      const exportPerm = await requirePermission(PERMISSIONS.EXPORT_EXCEL);
      if (exportPerm instanceof NextResponse) return exportPerm;

      const buffer = exportToExcel(data, type);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ type, count: data.length, data });
  } catch {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
