import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getEnv = (k: string) => envFile.split('\n').find(l => l.startsWith(k+'='))?.split('=')[1]?.replace(/\"/g, '').trim();

const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const realSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

async function testMatch() {
  const { data } = await realSupabase.from('oeno_codes').select('id, code, name').ilike('name', '%tonsill%');
  console.log('Tonsil:', data);
}
testMatch().catch(console.error);
