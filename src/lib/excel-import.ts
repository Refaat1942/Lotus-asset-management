import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { recordAssetHistory } from './asset-history';
import { generateQrToken } from './qr-token';
import { AssetCondition, AssetStatus, Prisma } from '@prisma/client';

export interface ColumnMapping {
  excelColumn: string;
  systemField: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  successes: { row: number; assetCode: string; name: string }[];
  failures: { row: number; reason: string; data?: Record<string, unknown> }[];
}

// Official Lotus asset import template (2026)
export const LOTUS_ITEMS_MAPPING: ColumnMapping[] = [
  { excelColumn: 'Code', systemField: 'assetCode' },
  { excelColumn: 'Assigned Employee Code', systemField: 'employeeId' },
  { excelColumn: 'Assigned Employee Name', systemField: 'assignee' },
  { excelColumn: 'Employee Position', systemField: 'employeePosition' },
  { excelColumn: 'Department', systemField: 'department' },
  { excelColumn: 'Serial-Number', systemField: 'serialNumber' },
  { excelColumn: 'Device', systemField: 'device' },
  { excelColumn: 'Operating System', systemField: 'operatingSystem' },
  { excelColumn: 'Part No', systemField: 'partNo' },
  { excelColumn: 'Description', systemField: 'name' },
  { excelColumn: 'Manufacturer', systemField: 'manufacturer' },
  { excelColumn: 'Model-Name', systemField: 'model' },
  { excelColumn: 'Device Price', systemField: 'purchasePrice' },
  { excelColumn: 'Purchase Date', systemField: 'purchaseDate' },
  { excelColumn: 'Start-up date', systemField: 'startupDate' },
  { excelColumn: 'Device-Type', systemField: 'category' },
  { excelColumn: 'Site', systemField: 'site' },
  { excelColumn: 'Site Name', systemField: 'branch' },
  { excelColumn: 'Any Desk User', systemField: 'anyDeskUser' },
  { excelColumn: 'Password Anydesk', systemField: 'passwordAnydesk' },
  { excelColumn: 'User admin', systemField: 'userAdmin' },
  { excelColumn: 'Password admin', systemField: 'passwordAdmin' },
  { excelColumn: 'Ip', systemField: 'ipAddress' },
  { excelColumn: 'Vendor Name', systemField: 'vendorName' },
];

// Legacy Lotus-Items.xlsx format
export const LOTUS_LEGACY_MAPPING: ColumnMapping[] = [
  { excelColumn: 'Equipment', systemField: 'assetCode' },
  { excelColumn: 'Serial-Number', systemField: 'serialNumber' },
  { excelColumn: 'Device-Work', systemField: 'assignee' },
  { excelColumn: 'Description', systemField: 'name' },
  { excelColumn: 'Manufacturer', systemField: 'manufacturer' },
  { excelColumn: 'Model-Name', systemField: 'model' },
  { excelColumn: 'AcquistnValue', systemField: 'purchasePrice' },
  { excelColumn: 'Acquistion date', systemField: 'purchaseDate' },
  { excelColumn: 'Device-Type', systemField: 'category' },
  { excelColumn: 'Functional Loc.', systemField: 'branch' },
  { excelColumn: 'Description_1', systemField: 'department' },
];

export const LOTUS_EXTRA_NOTE_COLUMNS = ['Vendor-Name'];

const FIELD_ALIASES: Record<string, string[]> = {
  assetCode: ['code', 'equipment', 'asset code', 'asset id', 'asset number', 'item code', 'item no', 'رقم الأصل', 'كود الأصل', 'رقم الصنف'],
  name: ['description', 'name', 'asset name', 'item name', 'اسم الأصل', 'الوصف', 'item description'],
  device: ['device', 'الجهاز'],
  operatingSystem: ['operating system', 'os', 'نظام التشغيل'],
  partNo: ['part no', 'part number', 'رقم القطعة'],
  employeePosition: ['employee position', 'position', 'job title', 'المسمى الوظيفي', 'الوظيفة'],
  startupDate: ['start-up date', 'startup date', 'commission date', 'تاريخ التشغيل'],
  site: ['site', 'site code', 'كود الموقع'],
  vendorName: ['vendor name', 'vendor', 'المورد'],
  anyDeskUser: ['any desk user', 'anydesk user', 'مستخدم anydesk'],
  passwordAnydesk: ['password anydesk', 'anydesk password'],
  userAdmin: ['user admin', 'admin user', 'مستخدم admin'],
  passwordAdmin: ['password admin', 'admin password'],
  ipAddress: ['ip', 'ip address', 'عنوان ip'],
  nameAr: ['name ar', 'arabic name', 'الاسم بالعربي', 'اسم عربي'],
  category: ['device-type', 'category', 'type', 'asset type', 'item type', 'الفئة', 'النوع', 'التصنيف'],
  serialNumber: ['serial-number', 'serial number', 'serial no', 's/n', 'الرقم التسلسلي'],
  model: ['model-name', 'model', 'الموديل', 'الطراز'],
  manufacturer: ['manufacturer', 'brand', 'make', 'الشركة المصنعة', 'الماركة'],
  department: ['description_1', 'department', 'dept', 'القسم', 'الإدارة'],
  branch: ['site name', 'functional loc.', 'functional loc', 'functional location', 'branch', 'location', 'site', 'الفرع', 'الموقع'],
  status: ['status', 'الحالة'],
  condition: ['condition', 'الحالة الفنية', 'حالة الأصل'],
  purchaseDate: ['purchase date', 'acquistion date', 'acquisition date', 'date purchased', 'تاريخ الشراء'],
  purchasePrice: ['device price', 'acquistnvalue', 'acquisition value', 'purchase price', 'cost', 'سعر الشراء', 'التكلفة'],
  currentValue: ['current value', 'book value', 'القيمة الحالية', 'القيمة الدفترية'],
  depreciationRate: ['depreciation rate', 'dep rate', 'نسبة الإهلاك'],
  notes: ['vendor-name', 'device-work', 'notes', 'remarks', 'comments', 'ملاحظات', 'تعليقات'],
  assignee: ['assigned employee name', 'device-work', 'assignee', 'assigned to', 'employee', 'holder', 'المسؤول', 'الموظف', 'المستخدم'],
  employeeId: ['assigned employee code', 'employee id', 'emp id', 'staff id', 'رقم الموظف'],
};

export type ImportMode = 'create' | 'update' | 'upsert';

const STATUS_MAP: Record<string, AssetStatus> = {
  available: 'AVAILABLE',
  assigned: 'ASSIGNED',
  'in maintenance': 'IN_MAINTENANCE',
  maintenance: 'IN_MAINTENANCE',
  'in repair': 'IN_REPAIR',
  repair: 'IN_REPAIR',
  retired: 'RETIRED',
  lost: 'LOST',
  disposed: 'DISPOSED',
  متاح: 'AVAILABLE',
  'قيد الاستخدام': 'ASSIGNED',
  'في الصيانة': 'IN_MAINTENANCE',
  'قيد الإصلاح': 'IN_REPAIR',
  متقاعد: 'RETIRED',
  مفقود: 'LOST',
  'تم التخلص': 'DISPOSED',
};

const CONDITION_MAP: Record<string, AssetCondition> = {
  excellent: 'EXCELLENT',
  good: 'GOOD',
  fair: 'FAIR',
  poor: 'POOR',
  damaged: 'DAMAGED',
  ممتاز: 'EXCELLENT',
  جيد: 'GOOD',
  مقبول: 'FAIR',
  ضعيف: 'POOR',
  تالف: 'DAMAGED',
};

function normalizeHeader(header: string): string {
  return header.toString().trim().toLowerCase();
}

function isNewLotusFormat(headers: string[]): boolean {
  return ['Code', 'Serial-Number', 'Description', 'Device-Type'].every((col) => headers.includes(col));
}

function isLegacyLotusFormat(headers: string[]): boolean {
  return ['Equipment', 'Serial-Number', 'Description', 'Device-Type'].every((col) => headers.includes(col));
}

function isLotusItemsFormat(headers: string[]): boolean {
  return isNewLotusFormat(headers) || isLegacyLotusFormat(headers);
}

function getLotusMapping(headers: string[]): ColumnMapping[] {
  const base = isNewLotusFormat(headers) ? LOTUS_ITEMS_MAPPING : LOTUS_LEGACY_MAPPING;
  return base.filter((m) => headers.includes(m.excelColumn));
}

export function detectColumns(headers: string[]): ColumnMapping[] {
  if (isLotusItemsFormat(headers)) {
    const mapped = getLotusMapping(headers);
    const mappedColumns = new Set(mapped.map((m) => m.excelColumn));

    for (const header of headers) {
      if (mappedColumns.has(header)) continue;
      const normalized = normalizeHeader(header);
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
          mapped.push({ excelColumn: header, systemField: field });
          mappedColumns.add(header);
          break;
        }
      }
    }

    return mapped;
  }

  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let bestMatch: { field: string; score: number } | null = null;

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (usedFields.has(field)) continue;
      for (const alias of aliases) {
        let score = 0;
        if (normalized === alias) score = 100;
        else if (normalized.replace(/[_\s-]/g, '') === alias.replace(/[_\s-]/g, '')) score = 90;
        else if (normalized.startsWith(alias) || normalized.endsWith(alias)) score = 70;
        else if (normalized.includes(alias) && alias.length >= 4) score = 50;

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { field, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 50) {
      mappings.push({ excelColumn: header, systemField: bestMatch.field });
      usedFields.add(bestMatch.field);
    }
  }

  return mappings;
}

export function isLotusTemplate(headers: string[]): boolean {
  return isLotusItemsFormat(headers);
}

export function readExcelFile(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'all') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(jsonData[0]);
  return { headers, rows: jsonData };
}

function getMappedValue(row: Record<string, unknown>, mappings: ColumnMapping[], field: string): unknown {
  const mapping = mappings.find((m) => m.systemField === field);
  if (!mapping) return undefined;
  const val = row[mapping.excelColumn];
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
}

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? undefined : num;
}

function parseStatus(value: unknown): AssetStatus {
  if (!value) return 'AVAILABLE';
  const key = String(value).trim().toLowerCase();
  return STATUS_MAP[key] || 'AVAILABLE';
}

function parseCondition(value: unknown): AssetCondition {
  if (!value) return 'GOOD';
  const key = String(value).trim().toLowerCase();
  return CONDITION_MAP[key] || 'GOOD';
}

async function findOrCreateDepartment(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.department.findFirst({
    where: {
      OR: [{ name: { equals: trimmed, mode: 'insensitive' } }, { nameAr: trimmed }],
    },
  });
  if (existing) return existing.id;

  const dept = await prisma.department.create({
    data: { name: trimmed, nameAr: trimmed },
  });
  return dept.id;
}

async function findOrCreateBranch(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.branch.findFirst({
    where: {
      OR: [{ name: { equals: trimmed, mode: 'insensitive' } }, { nameAr: trimmed }],
    },
  });
  if (existing) return existing.id;

  const branch = await prisma.branch.create({
    data: { name: trimmed, nameAr: trimmed },
  });
  return branch.id;
}

async function findOrCreatePerson(name: string, employeeId?: string, departmentId?: string): Promise<string> {
  const trimmed = name.trim();
  if (employeeId) {
    const byEmpId = await prisma.person.findUnique({ where: { employeeId } });
    if (byEmpId) return byEmpId.id;
  }

  const existing = await prisma.person.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) return existing.id;

  const person = await prisma.person.create({
    data: { name: trimmed, nameAr: trimmed, employeeId, departmentId },
  });
  return person.id;
}

function buildNotes(row: Record<string, unknown>, mappings: ColumnMapping[]): string | undefined {
  const parts: string[] = [];
  const mappedColumns = new Set(mappings.map((m) => m.excelColumn));

  const noteMappings = mappings.filter((m) => m.systemField === 'notes');
  if (noteMappings.length > 0) {
    for (const mapping of noteMappings) {
      const value = row[mapping.excelColumn];
      if (value !== '' && value !== null && value !== undefined) {
        parts.push(`${mapping.excelColumn}: ${String(value)}`);
      }
    }
  } else {
    const notes = getMappedValue(row, mappings, 'notes');
    if (notes) parts.push(String(notes));
  }

  for (const col of LOTUS_EXTRA_NOTE_COLUMNS) {
    if (mappedColumns.has(col)) continue;
    const value = row[col];
    if (value === '' || value === null || value === undefined) continue;
    if (col === 'Start-up date') {
      const d = parseDate(value);
      parts.push(d ? `Start-up: ${d.toISOString().split('T')[0]}` : `Start-up: ${String(value)}`);
    } else {
      parts.push(`${col}: ${String(value)}`);
    }
  }

  const device = row['Device'];
  if (device && !mappedColumns.has('Device') && !parts.some((p) => p.startsWith('Device:'))) {
    parts.push(`Device: ${String(device)}`);
  }

  return parts.length ? parts.join(' | ') : undefined;
}

function buildAssetFields(
  row: Record<string, unknown>,
  mappings: ColumnMapping[],
  finalCode: string,
  finalName: string,
  departmentId?: string,
  branchId?: string,
  currentAssigneeId?: string
) {
  const purchasePrice = parseNumber(getMappedValue(row, mappings, 'purchasePrice'));
  const currentValue = parseNumber(getMappedValue(row, mappings, 'currentValue')) ?? purchasePrice;
  const assigneeName = getMappedValue(row, mappings, 'assignee');
  const status = parseStatus(getMappedValue(row, mappings, 'status'));
  const finalStatus = currentAssigneeId || assigneeName ? 'ASSIGNED' : status;

  const strField = (field: string) => {
    const value = getMappedValue(row, mappings, field);
    return value !== undefined ? String(value).trim() : undefined;
  };

  return {
    assetCode: finalCode,
    name: finalName,
    nameAr: strField('nameAr'),
    category: strField('category'),
    serialNumber: strField('serialNumber'),
    model: strField('model'),
    manufacturer: strField('manufacturer'),
    device: strField('device'),
    operatingSystem: strField('operatingSystem'),
    partNo: strField('partNo'),
    employeePosition: strField('employeePosition'),
    startupDate: parseDate(getMappedValue(row, mappings, 'startupDate')),
    site: strField('site'),
    vendorName: strField('vendorName'),
    anyDeskUser: strField('anyDeskUser'),
    passwordAnydesk: strField('passwordAnydesk'),
    userAdmin: strField('userAdmin'),
    passwordAdmin: strField('passwordAdmin'),
    ipAddress: strField('ipAddress'),
    status: finalStatus,
    condition: parseCondition(getMappedValue(row, mappings, 'condition')),
    purchaseDate: parseDate(getMappedValue(row, mappings, 'purchaseDate')),
    purchasePrice,
    currentValue,
    depreciationRate: parseNumber(getMappedValue(row, mappings, 'depreciationRate')),
    notes: buildNotes(row, mappings),
    departmentId: departmentId || null,
    branchId: branchId || null,
    currentAssigneeId: currentAssigneeId || null,
    assigneeName: assigneeName ? String(assigneeName) : undefined,
  };
}

export async function importAssetsFromExcel(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[],
  userId: string,
  mode: ImportMode = 'upsert'
): Promise<ImportResult> {
  const result: ImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    successes: [],
    failures: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      let assetCode = String(getMappedValue(row, mappings, 'assetCode') || '').trim();
      const name = String(getMappedValue(row, mappings, 'name') || '').trim();

      if (!assetCode && !name) {
        result.failed++;
        result.failures.push({ row: rowNum, reason: 'Missing asset code and name', data: row as Record<string, unknown> });
        continue;
      }

      const finalCode = assetCode || `AUTO-${Date.now()}-${i}`;
      const finalName = name || assetCode;

      let departmentId: string | undefined;
      const deptName = getMappedValue(row, mappings, 'department');
      if (deptName) departmentId = await findOrCreateDepartment(String(deptName));

      let branchId: string | undefined;
      const branchName = getMappedValue(row, mappings, 'branch');
      if (branchName) branchId = await findOrCreateBranch(String(branchName));

      let currentAssigneeId: string | undefined;
      const assigneeName = getMappedValue(row, mappings, 'assignee');
      const empId = getMappedValue(row, mappings, 'employeeId');
      if (assigneeName) {
        currentAssigneeId = await findOrCreatePerson(
          String(assigneeName),
          empId ? String(empId) : undefined,
          departmentId
        );
      }

      const fields = buildAssetFields(row, mappings, finalCode, finalName, departmentId, branchId, currentAssigneeId);
      const existing = await prisma.asset.findUnique({ where: { assetCode: finalCode } });

      if (existing && mode === 'create') {
        result.failed++;
        result.failures.push({ row: rowNum, reason: `Duplicate asset code: ${finalCode}`, data: row as Record<string, unknown> });
        continue;
      }

      if (existing && (mode === 'update' || mode === 'upsert')) {
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            name: fields.name,
            nameAr: fields.nameAr,
            category: fields.category,
            serialNumber: fields.serialNumber,
            model: fields.model,
            manufacturer: fields.manufacturer,
            device: fields.device,
            operatingSystem: fields.operatingSystem,
            partNo: fields.partNo,
            employeePosition: fields.employeePosition,
            startupDate: fields.startupDate,
            site: fields.site,
            vendorName: fields.vendorName,
            anyDeskUser: fields.anyDeskUser,
            passwordAnydesk: fields.passwordAnydesk,
            userAdmin: fields.userAdmin,
            passwordAdmin: fields.passwordAdmin,
            ipAddress: fields.ipAddress,
            status: fields.status,
            condition: fields.condition,
            purchaseDate: fields.purchaseDate,
            purchasePrice: fields.purchasePrice,
            currentValue: fields.currentValue,
            depreciationRate: fields.depreciationRate,
            notes: fields.notes,
            departmentId: fields.departmentId,
            branchId: fields.branchId,
            currentAssigneeId: fields.currentAssigneeId,
            qrToken: existing.qrToken || generateQrToken(),
          },
        });

        await recordAssetHistory({
          assetId: existing.id,
          eventType: 'UPDATED',
          title: 'Asset updated from Excel import',
          titleAr: 'تم تحديث الأصل من استيراد Excel',
          description: `Bulk update for ${finalCode}`,
          createdById: userId,
        });

        result.success++;
        result.successes.push({ row: rowNum, assetCode: finalCode, name: finalName });
        continue;
      }

      if (!existing && mode === 'update') {
        result.failed++;
        result.failures.push({ row: rowNum, reason: `Asset not found: ${finalCode}`, data: row as Record<string, unknown> });
        continue;
      }

      const asset = await prisma.asset.create({
        data: {
          assetCode: fields.assetCode,
          name: fields.name,
          nameAr: fields.nameAr,
          category: fields.category,
          serialNumber: fields.serialNumber,
          model: fields.model,
          manufacturer: fields.manufacturer,
          device: fields.device,
          operatingSystem: fields.operatingSystem,
          partNo: fields.partNo,
          employeePosition: fields.employeePosition,
          startupDate: fields.startupDate,
          site: fields.site,
          vendorName: fields.vendorName,
          anyDeskUser: fields.anyDeskUser,
          passwordAnydesk: fields.passwordAnydesk,
          userAdmin: fields.userAdmin,
          passwordAdmin: fields.passwordAdmin,
          ipAddress: fields.ipAddress,
          status: fields.status,
          condition: fields.condition,
          purchaseDate: fields.purchaseDate,
          purchasePrice: fields.purchasePrice,
          currentValue: fields.currentValue,
          depreciationRate: fields.depreciationRate,
          notes: fields.notes,
          departmentId: fields.departmentId,
          branchId: fields.branchId,
          currentAssigneeId: fields.currentAssigneeId,
          qrToken: generateQrToken(),
        },
      });

      await recordAssetHistory({
        assetId: asset.id,
        eventType: 'IMPORTED',
        title: 'Asset imported from Excel',
        titleAr: 'تم استيراد الأصل من Excel',
        description: `Imported with code ${finalCode}`,
        createdById: userId,
      });

      if (fields.currentAssigneeId && fields.assigneeName) {
        await prisma.assetAssignment.create({
          data: {
            assetId: asset.id,
            personId: fields.currentAssigneeId,
            assignedById: userId,
            notes: 'Imported with assignment',
          },
        });
        await recordAssetHistory({
          assetId: asset.id,
          eventType: 'ASSIGNED',
          title: `Assigned to ${fields.assigneeName}`,
          titleAr: `تم التعيين إلى ${fields.assigneeName}`,
          createdById: userId,
        });
      }

      result.success++;
      result.successes.push({ row: rowNum, assetCode: finalCode, name: finalName });
    } catch (err) {
      result.failed++;
      result.failures.push({
        row: rowNum,
        reason: err instanceof Error ? err.message : 'Unknown error',
        data: row as Record<string, unknown>,
      });
    }
  }

  return result;
}

export function exportToExcel(data: Record<string, unknown>[], sheetName = 'Report'): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
