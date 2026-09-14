import { runBackup, getBackupDir } from '../src/lib/backup';

async function main() {
  console.log(`Running backup to ${getBackupDir()}...`);
  const result = await runBackup();
  if (result.success) {
    console.log(`Backup completed: ${result.filePath}`);
  } else {
    console.error(`Backup failed: ${result.error}`);
    process.exit(1);
  }
}

main();
