import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envFile = fs.readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getEnv = (k: string) => envFile.split('\n').find(l => l.startsWith(k+'='))?.split('=')[1]?.replace(/\"/g, '').trim();

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const EXCEL_FILE = 'oeno_torzslista.xls';

async function main() {
  console.log(`Beolvasás: ${EXCEL_FILE}...`);
  const buf = fs.readFileSync(EXCEL_FILE);
  const workbook = xlsx.read(buf, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Header is row 1 (0-indexed 0)
  const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });
  
  // Első sor a header, kihagyjuk
  const dataRows = rows.slice(1).filter(r => r[0] && String(r[0]).trim() !== '');

  console.log(`Összesen ${dataRows.length} OENO kód található az Excelben.`);

  const codesToInsert = dataRows.map(row => ({
    code: String(row[0]).trim(),
    name: String(row[3]).trim()
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < codesToInsert.length; i += BATCH_SIZE) {
    const batch = codesToInsert.slice(i, i + BATCH_SIZE);
    console.log(`Feldolgozás: ${i} - ${i + batch.length} / ${codesToInsert.length}`);

    const { error } = await supabase
      .from('oeno_codes')
      .upsert(batch, { onConflict: 'code', ignoreDuplicates: true }); // Ha már létezik, ne írjuk felül a nevét vagy a szemantikus leírást. Ha felül akarjuk, ignoreDuplicates: false.
      
    if (error) {
      console.error('Hiba az upsert során:', error);
    }
  }

  console.log('✅ Importálás befejezve!');
}

main().catch(console.error);
