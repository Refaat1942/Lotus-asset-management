import * as XLSX from 'xlsx';

/** Official Lotus asset import template columns */
export const LOTUS_TEMPLATE_HEADERS = [
  'Code',
  'Assigned Employee Code',
  'Assigned Employee Name',
  'Employee Position',
  'Department',
  'Serial-Number',
  'Device',
  'Operating System',
  'Part No',
  'Description',
  'Manufacturer',
  'Model-Name',
  'Device Price',
  'Purchase Date',
  'Start-up date',
  'Device-Type',
  'Site',
  'Site Name',
  'Any Desk User',
  'Password Anydesk',
  'User admin',
  'Password admin',
  'Ip',
  'Vendor Name',
];

export function generateLotusTemplateBuffer(): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([LOTUS_TEMPLATE_HEADERS]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
