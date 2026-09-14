import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { readExcelFile, importAssetsFromExcel, ColumnMapping } from '@/lib/excel-import';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.IMPORT_EXCEL);
  if (result instanceof NextResponse) return result;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingsJson = formData.get('mappings') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const { rows } = readExcelFile(buffer);
    const mappings: ColumnMapping[] = mappingsJson ? JSON.parse(mappingsJson) : [];

    const importResult = await importAssetsFromExcel(rows, mappings, result.user.id);

    await prisma.importLog.create({
      data: {
        fileName: file.name,
        totalRows: importResult.total,
        successCount: importResult.success,
        failedCount: importResult.failed,
        details: JSON.parse(JSON.stringify({ successes: importResult.successes, failures: importResult.failures })),
        createdById: result.user.id,
      },
    });

    return NextResponse.json(importResult);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import failed' }, { status: 500 });
  }
}
