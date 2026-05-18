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
// Use the service role key to avoid RLS policies preventing us from inserting the job
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'); 

const transcript = `A beteg egy súlyosan krónikus beteg, ismert hypertoniás és diabeteses, aki egy kisebb autóbaleset után érkezett a traumatológiai ambulanciára. Enyhe nyaki fájdalmat és jobb váll fájdalmat panaszol. Eszméletvesztés nem volt.

Az ellátás adminisztratív kódjai a következők:
Az ellátás típusa 1-es.
A továbbküldés 1-es, más szakrendelésre küldöm.
Baleset minősítése 21-es, közúti baleset.
Beavatkozás jellege A.
Labor kérés 1-es.
Képalkotó kérés 2-es.
CT kérés 1-es.
Keresőképesség elbírálása 1-es, táppénzre veszem.
Útiköltség 1-es.
Térítési kategória 01-es.
Fizioterápia 0.
Vény segédeszköz 0.
Vény gyógyszer 2.
Vény gyógyfürdő 0.

A beteg hivatalos adatai a jegyzőkönyv kedvéért:
A páciens TAJ száma: 1 2 3 4 5 6 7 8 9.
Személyi igazolvány száma: 1 2 3 4 5 6 A B.
Irányítószáma: 1 2 3 4.
Az ellátás naplósorszáma: 1 2 3 4 5 6.
Az orvos pecsétszáma: 1 2 3 4 5.
Az intézmény azonosítója: 1 2 3 4 5 6 7 8 9.

Diagnózisok:
Nyaki rándulás (BNO: S1340).
Jobb váll zúzódása (BNO: S4000).

Beavatkozások:
Traumatológiai szakvizsgálat (OENO: 1 2 3 4 5).
Röntgen felvétel a nyakról (OENO: 3 4 5 6 7).
Vérnyomásmérés, ahol 160/90 Hgmm értéket rögzítettünk.

Kezelés és javaslat:
Nyakrögzítő gallér viselése és kímélet javasolt.
Felírtam neki Diclofenac 50mg-os tablettát napi 2x1-et, valamint Pantoprazol 40mg-ot gyomorvédelem céljából.
Kontroll vizsgálat egy hét múlva esedékes, de panasz esetén hamarabb jöjjön vissza.`;

async function main() {
  const realSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Pick an existing patient_id
  const PATIENT_ID = "0ca444da-4b1f-4636-bd12-d9c8a85891b5";

  console.log(`\n--- Seeding Special Job ---`);
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
    return;
  }

  try {
    console.log('Running Multi-Agent pipeline...');
    const apiKeys = { openai: OPENAI_API_KEY, elevenlabs: '', anthropic: '' };
    await processAmbulansInternally(jobId, null, realSupabase, apiKeys, transcript);
    console.log(`Job ${jobId} successfully processed and saved to database! Check your UI.`);
  } catch (e) {
    console.error(`Error processing job ${jobId}:`, e);
  }
}

main().catch(console.error);
