import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { recordAssetHistory } from './asset-history';
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

const FIELD_ALIASES: Record<string, string[]> = {
  assetCode: ['asset code', 'asset id', 'asset number', 'code', 'id', 'رقم الأصل', 'كود الأصل', 'رقم الصنف', 'item code', 'item no', 'item number', 'no', 'number', '#'],
  name: ['name', 'asset name', 'item name', 'description', 'اسم الأصل', 'الوصف', 'item', 'item description'],
  nameAr: ['name ar', 'arabic name', 'الاسم بالعربي', 'اسم عربي'],
  category: ['category', 'type', 'asset type', 'item type', 'الفئة', 'النوع', 'التصنيف'],
  serialNumber: ['serial', 'serial number', 's/n', 'الرقم التسلسلي', 'serial no'],
  model: ['model', 'الموديل', 'الطراز'],
  manufacturer: ['manufacturer', 'brand', 'make', 'الشركة المصنعة', 'الماركة'],
  department: ['department', 'dept', 'القسم', 'الإدارة'],
  branch: ['branch', 'location', 'site', 'الفرع', 'الموقع'],
  status: ['status', 'الحالة'],
  condition: ['condition', 'الحالة الفنية', 'حالة الأصل'],
  purchaseDate: ['purchase date', 'date purchased', 'تاريخ الشراء', 'purchase', 'date'],
  purchasePrice: ['purchase price', 'cost', 'price', 'سعر الشراء', 'التكلفة', 'القيمة'],
  currentValue: ['current value', 'value', 'book value', 'القيمة الحالية', 'القيمة الدفترية'],
  depreciationRate: ['depreciation', 'depreciation rate', 'dep rate', 'نسبة الإهلاك', 'الإهلاك'],
  notes: ['notes', 'remarks', 'comments', 'ملاحظات', 'تعليقات'],
  assignee: ['assignee', 'assigned to', 'employee', 'holder', 'المسؤول', 'الموظف', 'المستخدم'],
  employeeId: ['employee id', 'emp id', 'staff id', 'رقم الموظف'],
};

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

export function detectColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (usedFields.has(field)) continue;
      if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        mappings.push({ excelColumn: header, systemField: field });
        usedFields.add(field);
        break;
      }
    }
  }

  return mappings;
}

export function readExcelFile(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
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

export async function importAssetsFromExcel(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[],
  userId: string
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
      const assetCode = String(getMappedValue(row, mappings, 'assetCode') || '').trim();
      const name = String(getMappedValue(row, mappings, 'name') || '').trim();

      if (!assetCode && !name) {
        result.failed++;
        result.failures.push({ row: rowNum, reason: 'Missing asset code and name', data: row as Record<string, unknown> });
        continue;
      }

      const finalCode = assetCode || `AUTO-${Date.now()}-${i}`;
      const finalName = name || assetCode;

      const existing = await prisma.asset.findUnique({ where: { assetCode: finalCode } });
      if (existing) {
        result.failed++;
        result.failures.push({ row: rowNum, reason: `Duplicate asset code: ${finalCode}`, data: row as Record<string, unknown> });
        continue;
      }

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

      const status = parseStatus(getMappedValue(row, mappings, 'status'));
      const finalStatus = currentAssigneeId ? 'ASSIGNED' : status;

      const assetData: Prisma.AssetCreateInput = {
        assetCode: finalCode,
        name: finalName,
        nameAr: getMappedValue(row, mappings, 'nameAr') ? String(getMappedValue(row, mappings, 'nameAr')) : undefined,
        category: getMappedValue(row, mappings, 'category') ? String(getMappedValue(row, mappings, 'category')) : undefined,
        serialNumber: getMappedValue(row, mappings, 'serialNumber') ? String(getMappedValue(row, mappings, 'serialNumber')) : undefined,
        model: getMappedValue(row, mappings, 'model') ? String(getMappedValue(row, mappings, 'model')) : undefined,
        manufacturer: getMappedValue(row, mappings, 'manufacturer') ? String(getMappedValue(row, mappings, 'manufacturer')) : undefined,
        status: finalStatus,
        condition: parseCondition(getMappedValue(row, mappings, 'condition')),
        purchaseDate: parseDate(getMappedValue(row, mappings, 'purchaseDate')),
        purchasePrice: parseNumber(getMappedValue(row, mappings, 'purchasePrice')),
        currentValue: parseNumber(getMappedValue(row, mappings, 'currentValue')),
        depreciationRate: parseNumber(getMappedValue(row, mappings, 'depreciationRate')),
        notes: getMappedValue(row, mappings, 'notes') ? String(getMappedValue(row, mappings, 'notes')) : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
        branch: branchId ? { connect: { id: branchId } } : undefined,
        currentAssignee: currentAssigneeId ? { connect: { id: currentAssigneeId } } : undefined,
      };

      const asset = await prisma.asset.create({ data: assetData });

      await recordAssetHistory({
        assetId: asset.id,
        eventType: 'IMPORTED',
        title: 'Asset imported from Excel',
        titleAr: 'تم استيراد الأصل من Excel',
        description: `Imported with code ${finalCode}`,
        createdById: userId,
      });

      if (currentAssigneeId) {
        await prisma.assetAssignment.create({
          data: {
            assetId: asset.id,
            personId: currentAssigneeId,
            assignedById: userId,
            notes: 'Imported with assignment',
          },
        });
        await recordAssetHistory({
          assetId: asset.id,
          eventType: 'ASSIGNED',
          title: `Assigned to ${assigneeName}`,
          titleAr: `تم التعيين إلى ${assigneeName}`,
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
