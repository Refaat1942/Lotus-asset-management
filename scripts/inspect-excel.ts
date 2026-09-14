import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { detectColumns, isLotusTemplate, LOTUS_ITEMS_MAPPING } from '../src/lib/excel-import';

const filePath = path.join(process.cwd(), 'Lotus-Items.xlsx');

if (!fs.existsSync(filePath)) {
  console.error('Lotus-Items.xlsx not found in project root');
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

console.log('Sheet:', sheetName);
console.log('Total rows:', jsonData.length);
console.log('\nColumns:');
const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
headers.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));

console.log('\nLotus template:', isLotusTemplate(headers) ? 'YES' : 'NO');
console.log('\nDetected mappings:');
const mappings = detectColumns(headers);
mappings.forEach((m) => console.log(`  "${m.excelColumn}" -> ${m.systemField}`));

if (isLotusTemplate(headers)) {
  console.log('\nLotus preset mapping:');
  LOTUS_ITEMS_MAPPING.forEach((m) => console.log(`  "${m.excelColumn}" -> ${m.systemField}`));
}

console.log('\nSample row (first):');
if (jsonData.length > 0) {
  console.log(JSON.stringify(jsonData[0], null, 2));
}
