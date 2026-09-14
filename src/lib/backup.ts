import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from './prisma';

const execAsync = promisify(exec);

export function getBackupDir(): string {
  const dir = process.env.BACKUP_DIR || './backups';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.resolve(dir);
}

export async function runBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { success: false, error: 'DATABASE_URL not configured' };
  }

  const backupDir = getBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `lotus_backup_${timestamp}.sql`;
  const filePath = path.join(backupDir, fileName);

  try {
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1).split('?')[0];
    const username = url.username;
    const password = url.password;

    const env = { ...process.env, PGPASSWORD: password };

    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filePath}"`;

    await execAsync(command, { env });

    await prisma.systemSetting.upsert({
      where: { key: 'last_backup' },
      update: { value: new Date().toISOString() },
      create: { key: 'last_backup', value: new Date().toISOString() },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'last_backup_file' },
      update: { value: filePath },
      create: { key: 'last_backup_file', value: filePath },
    });

    return { success: true, filePath };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Backup failed';
    console.error('Backup error:', error);
    return { success: false, error };
  }
}

export function listBackups(): string[] {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) return [];
  return fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .reverse();
}
