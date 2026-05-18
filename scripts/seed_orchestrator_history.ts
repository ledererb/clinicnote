import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processAmbulansInternally } from '../supabase/functions/process-chart/process-ambulans-internal.ts';
import { randomUUID } from 'crypto';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
function getEnv(key: string) {
  const line = envFile.split('\n').find(l => l.startsWith(`${key}=`));
  return line ? line.split('=')[1]?.replace(/"/g, '').trim() : '';
}

const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function generateTranscripts(count: number): Promise<string[]> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [{
        role: 'system',
        content: 'You are generating human medical dictation transcripts in Hungarian. Always output JSON in format { "transcripts": ["...", "..."] }.'
      }, {
        role: 'user',
        content: `Generálj ${count} darab KÜLÖNBÖZŐ orvosi hangfelvétel leiratot emberi páciensekről egy ambuláns rendelésen. Némelyik tartalmazzon REJTETT VAGY NYÍLT ORVOSI ELLENTMONDÁSOKAT (pl. allergia egy gyógyszerre de mégis felírja, vagy meggondolja magát közben) amiket a rendszernek észre kell vennie.`
      }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return JSON.parse((await res.json()).choices[0].message.content).transcripts || [];
}

async function main() {
  const TOTAL = 10;
  console.log(`Generating ${TOTAL} test transcripts...`);
  const transcripts = await generateTranscripts(TOTAL);
  
  const realSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Pick an existing patient_id or just let it be null if not strictly required
  // Let's use the one we found earlier just in case
  const PATIENT_ID = "0ca444da-4b1f-4636-bd12-d9c8a85891b5";

  for (let i = 0; i < transcripts.length; i++) {
    console.log(`\n--- Seeding Job ${i + 1}/${TOTAL} ---`);
    const transcript = transcripts[i];
    const jobId = randomUUID();

    // Insert dummy record into voice_jobs
    const { error: insertError } = await realSupabase.from("voice_jobs").insert({
      id: jobId,
      status: "processing",
      raw_audio_text: transcript,
      mode: "ambulans",
      patient_id: PATIENT_ID,
      progress_percent: 0,
      progress_message: "Előkészítés...",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (insertError) {
      console.error(`Failed to insert job ${jobId}:`, insertError);
      continue;
    }

    try {
      console.log('Running Multi-Agent pipeline (via OpenAI)...');
      const apiKeys = { openai: OPENAI_API_KEY, elevenlabs: '', anthropic: '' };
      await processAmbulansInternally(jobId, null, realSupabase, apiKeys, transcript);
      console.log(`Job ${jobId} successfully processed and saved to database!`);
    } catch (e) {
      console.error(`Error processing job ${jobId}:`, e);
    }
  }

  console.log('\nFinished seeding database. Check the UI history!');
}

main().catch(console.error);
