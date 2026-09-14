import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { recordAssetHistory } from '@/lib/asset-history';
import { generateQrToken } from '@/lib/qr-token';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.VIEW_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.AssetWhereInput = {};

    if (search) {
      where.OR = [
        { assetCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { currentAssignee: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status as 'AVAILABLE' | 'ASSIGNED' | 'IN_MAINTENANCE' | 'IN_REPAIR' | 'RETIRED' | 'LOST' | 'DISPOSED';

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          department: true,
          branch: true,
          currentAssignee: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({ assets, total, page, limit });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.CREATE_ASSETS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();

    const existing = await prisma.asset.findUnique({ where: { assetCode: body.assetCode } });
    if (existing) {
      return NextResponse.json({ error: 'Asset code already exists' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        assetCode: body.assetCode,
        name: body.name,
        nameAr: body.nameAr,
        category: body.category,
        serialNumber: body.serialNumber,
        model: body.model,
        manufacturer: body.manufacturer,
        departmentId: body.departmentId || null,
        branchId: body.branchId || null,
        status: body.status || 'AVAILABLE',
        condition: body.condition || 'GOOD',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice,
        currentValue: body.currentValue,
        depreciationRate: body.depreciationRate,
        notes: body.notes,
        qrToken: generateQrToken(),
      },
      include: { department: true, branch: true },
    });

    await recordAssetHistory({
      assetId: asset.id,
      eventType: 'CREATED',
      title: `Asset ${asset.assetCode} created`,
      titleAr: `تم إنشاء الأصل ${asset.assetCode}`,
      createdById: result.user.id,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
