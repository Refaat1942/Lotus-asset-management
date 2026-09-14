import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { runBackup, getBackupDir, listBackups } from '@/lib/backup';

export async function GET() {
  const result = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({
    backupDir: getBackupDir(),
    backups: listBackups(),
  });
}

export async function POST() {
  const result = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  if (result instanceof NextResponse) return result;

  const backupResult = await runBackup();
  if (!backupResult.success) {
    return NextResponse.json({ error: backupResult.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, filePath: backupResult.filePath });
}
