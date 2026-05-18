import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const supabaseUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.replace(/"/g, '').trim() || '';
const supabaseKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.replace(/"/g, '').trim() || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const files = readdirSync(join(process.cwd(), 'scripts', 'results'));
  const latestFile = files.filter(f => f.startsWith('eval_100_full_')).sort().pop();
  if (!latestFile) throw new Error("No results found");

  const results = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'results', latestFile), 'utf-8'));

  // Keresünk egy olyan esetet, aminek hosszú a szövege és van ellentmondás is
  let best = results[0];
  for (const r of results) {
    if (r.transcript.length > 250 && r.fullResult?.contradictions?.length > 0) {
      best = r;
      break;
    }
  }

  console.log(`Kiválasztott leirat hossza: ${best.transcript.length} karakter.`);

  // We need a valid patient ID. Let's fetch the first patient in the DB.
  const { data: patients, error: pError } = await supabase.from('patients').select('id, vezeteknev, keresztnev').limit(1);
  if (pError || !patients || patients.length === 0) {
    console.error("Nem találtam pácienst az adatbázisban.", pError);
    return;
  }
  const patient = patients[0];

  // Insert job
  const { data: job, error: jError } = await supabase.from('voice_jobs').insert({
    patient_id: patient.id,
    status: 'completed',
    mode: 'ambulans_adatlap',
    raw_audio_text: best.transcript,
    claude_cleaned_text: best.transcript, // testing
    result: best.fullResult,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress_percent: 100,
    progress_message: "Sikeres teszt futás",
  }).select().single();

  if (jError) {
    console.error("Hiba a mentés során:", jError);
    return;
  }

  console.log(`\nSikeresen beszúrtam az adatbázisba!`);
  console.log(`Beteg: ${patient.vezeteknev} ${patient.keresztnev} (ID: ${patient.id})`);
  console.log(`Job ID: ${job.id}`);
  
  console.log(`\n=== LEIRAT ===`);
  console.log(best.transcript);
  console.log(`\n=== ELLENTMONDÁSOK ===`);
  console.log(JSON.stringify(best.fullResult.contradictions, null, 2));
}

main().catch(console.error);
