import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { generateLotusTemplateBuffer } from '@/lib/lotus-template';

export async function GET() {
  const result = await requirePermission(PERMISSIONS.IMPORT_EXCEL);
  if (result instanceof NextResponse) return result;

  const buffer = generateLotusTemplateBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Lotus-Asset-Template.xlsx"',
    },
  });
}
