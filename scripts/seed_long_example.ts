import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const supabaseUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]?.replace(/"/g, '').trim() || '';
const supabaseKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]?.replace(/"/g, '').trim() || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const files = readdirSync(join(process.cwd(), 'scripts', 'results'));
  const latestFile = files.filter(f => f.startsWith('eval_100_')).sort().pop();
  if (!latestFile) throw new Error("No results found");

  const results = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'results', latestFile), 'utf-8'));

  // Find the longest transcript
  let longest = results[0];
  for (const r of results) {
    if (r.transcript.length > longest.transcript.length) {
      longest = r;
    }
  }

  console.log(`Found longest transcript (${longest.transcript.length} characters).`);

  // We need a valid patient ID. Let's fetch the first patient in the DB.
  const { data: patients, error: pError } = await supabase.from('patients').select('id').limit(1);
  if (pError || !patients || patients.length === 0) {
    console.error("Could not find a patient to attach the job to.", pError);
    return;
  }
  const patientId = patients[0].id;

  // Insert job
  const { data: job, error: jError } = await supabase.from('voice_jobs').insert({
    patient_id: patientId,
    status: 'completed',
    mode: 'ambulans_adatlap',
    raw_audio_text: longest.transcript,
    claude_cleaned_text: longest.transcript, // usually cleaned text is the same for testing
    result: longest.extracted,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).select().single();

  if (jError) {
    console.error("Failed to insert voice job:", jError);
    return;
  }

  console.log(`\nSuccessfully inserted voice job!`);
  console.log(`Job ID: ${job.id}`);
  console.log(`Please check the ClinicNote application under patient ID: ${patientId}`);
  console.log(`The job should appear in the history sidebar.`);
}

main().catch(console.error);
