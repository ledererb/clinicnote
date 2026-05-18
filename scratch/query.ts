import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { join } from 'path';

const envFile = fs.readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getEnv = (k: string) => envFile.split('\n').find(l => l.startsWith(k+'='))?.split('=')[1]?.replace(/\"/g, '').trim();

const supabase = createClient(getEnv('VITE_SUPABASE_URL')!, getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')!);

async function test() {
  const { data } = await supabase.from('oeno_codes').select('code, name, semantic_description').not('semantic_description', 'is', null).limit(3);
  console.log(JSON.stringify(data, null, 2));
}
test();
