import cron from 'node-cron';
import { runBackup } from './backup';

let scheduled = false;

export function startBackupScheduler() {
  if (scheduled) return;
  scheduled = true;

  const cronExpression = process.env.BACKUP_CRON || '0 2 * * *';

  cron.schedule(cronExpression, async () => {
    console.log('[Backup] Starting scheduled daily backup...');
    const result = await runBackup();
    if (result.success) {
      console.log(`[Backup] Completed: ${result.filePath}`);
    } else {
      console.error(`[Backup] Failed: ${result.error}`);
    }
  });

  console.log(`[Backup] Scheduler started with cron: ${cronExpression}`);
}
