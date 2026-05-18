import * as xlsx from 'xlsx';
import * as fs from 'fs';

const buf = fs.readFileSync('oeno_torzslista.xls');
const workbook = xlsx.read(buf, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(0, 10);
console.log("First 10 rows:");
rows.forEach((r, i) => console.log(`Row ${i}:`, r));
