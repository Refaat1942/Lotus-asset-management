import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  try {
    const [
      totalAssets,
      assignedAssets,
      byDepartment,
      byBranch,
      byStatus,
      valueAgg,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.groupBy({ by: ['departmentId'], _count: true }),
      prisma.asset.groupBy({ by: ['branchId'], _count: true }),
      prisma.asset.groupBy({ by: ['status'], _count: true }),
      prisma.asset.aggregate({
        _sum: { currentValue: true, purchasePrice: true },
      }),
    ]);

    const departments = await prisma.department.findMany();
    const branches = await prisma.branch.findMany();

    const departmentStats = byDepartment.map((d) => ({
      id: d.departmentId,
      name: departments.find((dep) => dep.id === d.departmentId)?.name || 'Unassigned',
      nameAr: departments.find((dep) => dep.id === d.departmentId)?.nameAr || 'غير محدد',
      count: d._count,
    }));

    const branchStats = byBranch.map((b) => ({
      id: b.branchId,
      name: branches.find((br) => br.id === b.branchId)?.name || 'Unassigned',
      nameAr: branches.find((br) => br.id === b.branchId)?.nameAr || 'غير محدد',
      count: b._count,
    }));

    const statusStats = byStatus.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    const totalValue = valueAgg._sum.currentValue || valueAgg._sum.purchasePrice || 0;
    const purchaseTotal = valueAgg._sum.purchasePrice || 0;
    const depreciation = Number(purchaseTotal) - Number(totalValue);

    return NextResponse.json(
      {
        totalAssets,
        assignedAssets,
        unassignedAssets: totalAssets - assignedAssets,
        byDepartment: departmentStats,
        byBranch: branchStats,
        byStatus: statusStats,
        totalValue: Number(totalValue),
        totalDepreciation: depreciation > 0 ? depreciation : 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
