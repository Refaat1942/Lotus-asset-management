import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAuth } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { getBackupDir, listBackups } from '@/lib/backup';
import { getLogoApiUrl, hasLogo, saveLogo } from '@/lib/logo-storage';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    return NextResponse.json({
      companyName: settingsMap.company_name || 'Lotus Asset Management',
      companyNameAr: settingsMap.company_name_ar || 'نظام إدارة أصول لوتس',
      logo: (await hasLogo()) ? getLogoApiUrl() : null,
      lastBackup: settingsMap.last_backup || null,
      lastBackupFile: settingsMap.last_backup_file || null,
      backupDir: getBackupDir(),
      backups: listBackups(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  if (result instanceof NextResponse) return result;

  try {
    const body = await request.json();

    if (body.companyName) {
      await prisma.systemSetting.upsert({
        where: { key: 'company_name' },
        update: { value: body.companyName },
        create: { key: 'company_name', value: body.companyName },
      });
    }
    if (body.companyNameAr) {
      await prisma.systemSetting.upsert({
        where: { key: 'company_name_ar' },
        update: { value: body.companyNameAr },
        create: { key: 'company_name_ar', value: body.companyNameAr },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const result = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  if (result instanceof NextResponse) return result;

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const { logoUrl } = await saveLogo(file);
    return NextResponse.json({ logo: logoUrl });
  } catch (err) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}
