import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { readExcelFile, detectColumns, isLotusTemplate } from '@/lib/excel-import';

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.IMPORT_EXCEL);
  if (result instanceof NextResponse) return result;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const { headers, rows } = readExcelFile(buffer);

    if (headers.length === 0) {
      return NextResponse.json({ error: 'Empty or invalid Excel file' }, { status: 400 });
    }

    const mappings = detectColumns(headers);
    const preview = rows.slice(0, 5);

    return NextResponse.json({
      headers,
      mappings,
      preview,
      totalRows: rows.length,
      isLotusTemplate: isLotusTemplate(headers),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to read file' }, { status: 500 });
  }
}
