import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { exportToExcel } from '@/lib/excel-import';
import { Prisma } from '@prisma/client';

function num(value: Prisma.Decimal | number | null | undefined): number {
  return value ? Number(value) : 0;
}

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
          'Manufacturer': a.manufacturer,
          'Model': a.model,
          'Department': a.department?.name,
          'Branch': a.branch?.name,
          'Status': a.status,
          'Condition': a.condition,
          'Assignee': a.currentAssignee?.name,
          'Purchase Date': a.purchaseDate?.toISOString().split('T')[0],
          'Purchase Price': num(a.purchasePrice),
          'Current Value': num(a.currentValue),
          'Serial Number': a.serialNumber,
        }));
        break;
      }
      case 'unassigned': {
        const assets = await prisma.asset.findMany({
          where: {
            OR: [{ currentAssigneeId: null }, { status: 'AVAILABLE' }],
            ...(fromDate || toDate ? { createdAt: dateFilter } : {}),
          },
          include: { department: true, branch: true },
          orderBy: { assetCode: 'asc' },
        });
        data = assets.map((a) => ({
          'Asset Code': a.assetCode,
          'Name': a.name,
          'Department': a.department?.name,
          'Branch': a.branch?.name,
          'Status': a.status,
          'Current Value': num(a.currentValue),
        }));
        break;
      }
      case 'by_department': {
        const grouped = await prisma.asset.groupBy({
          by: ['departmentId'],
          _count: true,
          _sum: { purchasePrice: true, currentValue: true },
        });
        const departments = await prisma.department.findMany();
        data = grouped.map((g) => ({
          'Department': departments.find((d) => d.id === g.departmentId)?.name || 'Unassigned',
          'Asset Count': g._count,
          'Total Purchase Value': num(g._sum.purchasePrice),
          'Total Current Value': num(g._sum.currentValue),
        }));
        break;
      }
      case 'by_branch': {
        const grouped = await prisma.asset.groupBy({
          by: ['branchId'],
          _count: true,
          _sum: { purchasePrice: true, currentValue: true },
        });
        const branches = await prisma.branch.findMany();
        data = grouped.map((g) => ({
          'Branch': branches.find((b) => b.id === g.branchId)?.name || 'Unassigned',
          'Asset Count': g._count,
          'Total Purchase Value': num(g._sum.purchasePrice),
          'Total Current Value': num(g._sum.currentValue),
        }));
        break;
      }
      case 'by_status': {
        const grouped = await prisma.asset.groupBy({
          by: ['status'],
          _count: true,
          _sum: { purchasePrice: true, currentValue: true },
        });
        data = grouped.map((g) => ({
          'Status': g.status,
          'Asset Count': g._count,
          'Total Purchase Value': num(g._sum.purchasePrice),
          'Total Current Value': num(g._sum.currentValue),
        }));
        break;
      }
      case 'by_category': {
        const assets = await prisma.asset.findMany({
          select: { category: true, purchasePrice: true, currentValue: true },
        });
        const map = new Map<string, { count: number; purchase: number; current: number }>();
        for (const asset of assets) {
          const key = asset.category?.trim() || 'Uncategorized';
          const entry = map.get(key) || { count: 0, purchase: 0, current: 0 };
          entry.count += 1;
          entry.purchase += num(asset.purchasePrice);
          entry.current += num(asset.currentValue);
          map.set(key, entry);
        }
        data = Array.from(map.entries()).map(([category, stats]) => ({
          'Category': category,
          'Asset Count': stats.count,
          'Total Purchase Value': stats.purchase,
          'Total Current Value': stats.current,
        }));
        break;
      }
      case 'by_manufacturer': {
        const assets = await prisma.asset.findMany({
          select: { manufacturer: true, purchasePrice: true, currentValue: true },
        });
        const map = new Map<string, { count: number; purchase: number; current: number }>();
        for (const asset of assets) {
          const key = asset.manufacturer?.trim() || 'Unknown';
          const entry = map.get(key) || { count: 0, purchase: 0, current: 0 };
          entry.count += 1;
          entry.purchase += num(asset.purchasePrice);
          entry.current += num(asset.currentValue);
          map.set(key, entry);
        }
        data = Array.from(map.entries()).map(([manufacturer, stats]) => ({
          'Manufacturer': manufacturer,
          'Asset Count': stats.count,
          'Total Purchase Value': stats.purchase,
          'Total Current Value': stats.current,
        }));
        break;
      }
      case 'by_assignee': {
        const grouped = await prisma.asset.groupBy({
          by: ['currentAssigneeId'],
          _count: true,
          _sum: { currentValue: true },
          where: { currentAssigneeId: { not: null } },
        });
        const persons = await prisma.person.findMany();
        data = grouped.map((g) => ({
          'Assignee': persons.find((p) => p.id === g.currentAssigneeId)?.name || 'Unknown',
          'Asset Count': g._count,
          'Total Current Value': num(g._sum.currentValue),
        }));
        break;
      }
      case 'departments': {
        const departments = await prisma.department.findMany({
          include: { _count: { select: { assets: true } } },
          orderBy: { name: 'asc' },
        });
        data = departments.map((d) => ({
          'Code': d.code,
          'Department': d.name,
          'Department (AR)': d.nameAr,
          'Asset Count': d._count.assets,
          'Description': d.description,
        }));
        break;
      }
      case 'branches': {
        const branches = await prisma.branch.findMany({
          include: { _count: { select: { assets: true } } },
          orderBy: { name: 'asc' },
        });
        data = branches.map((b) => ({
          'Code': b.code,
          'Branch': b.name,
          'Branch (AR)': b.nameAr,
          'Asset Count': b._count.assets,
          'Address': b.address,
        }));
        break;
      }
      case 'persons': {
        const persons = await prisma.person.findMany({
          include: {
            department: true,
            _count: { select: { assignments: true } },
          },
          orderBy: { name: 'asc' },
        });
        data = persons.map((p) => ({
          'Name': p.name,
          'Name (AR)': p.nameAr,
          'Employee ID': p.employeeId,
          'Department': p.department?.name,
          'Active': p.isActive ? 'Yes' : 'No',
          'Assignment Count': p._count.assignments,
        }));
        break;
      }
      case 'maintenance': {
        const assets = await prisma.asset.findMany({
          where: { status: { in: ['IN_MAINTENANCE', 'IN_REPAIR'] } },
          include: { department: true, branch: true, currentAssignee: true },
          orderBy: { updatedAt: 'desc' },
        });
        data = assets.map((a) => ({
          'Asset Code': a.assetCode,
          'Name': a.name,
          'Status': a.status,
          'Condition': a.condition,
          'Department': a.department?.name,
          'Branch': a.branch?.name,
          'Assignee': a.currentAssignee?.name,
          'Notes': a.notes,
        }));
        break;
      }
      case 'imports': {
        const logs = await prisma.importLog.findMany({
          where: fromDate || toDate ? { createdAt: dateFilter } : undefined,
          include: { createdBy: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
        });
        data = logs.map((l) => ({
          'File Name': l.fileName,
          'Total Rows': l.totalRows,
          'Success': l.successCount,
          'Failed': l.failedCount,
          'Imported By': l.createdBy.username,
          'Date': l.createdAt.toISOString(),
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
          'Previous Value': num(r.previousValue),
          'New Value': num(r.newValue),
          'Depreciation Amount': num(r.depreciationAmount),
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
