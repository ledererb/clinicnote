import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processAmbulansInternally } from '../supabase/functions/process-chart/process-ambulans-internal.ts';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getValue = (key: string) => envFile.split('\n').find(l => l.startsWith(`${key}=`))?.split('=')[1]?.replace(/"/g, '').trim() || '';

const supabaseUrl = getValue('VITE_SUPABASE_URL');
const supabaseKey = getValue('SUPABASE_SERVICE_ROLE_KEY') || getValue('VITE_SUPABASE_ANON_KEY'); // Should ideally use service role, but anon might work if RLS allows insert
const openaiKey = getValue('OPENAI_API_KEY');
const elevenlabsKey = getValue('ELEVENLABS_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateTranscript(): Promise<string> {
  console.log("Generálom a 20 mondatos, komplex orvosi leiratot...");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: 'You are an advanced medical dictation AI. Respond ONLY with the raw transcript text, no markdown.'
      }, {
        role: 'user',
        content: `Írj egy legalább 20 mondatból álló orvosi diktálást magyarul. Legyen benne nagyon részletes anamnézis és fizikális vizsgálat.
Feltételek:
1. Említs meg legalább 3 specifikus betegséget, amit a BNO kódrendszer felismerhet (pl. esszenciális hipertónia, 2-es típusú diabetes mellitus).
2. Tegyél bele egy nyílt ellentmondást, pl: 'a beteg allergiás a penicillinre, ezért írjunk fel neki augmentint', majd később jöjjön rá: 'Várjunk, az augmentin is penicillin származék, mégsem jó, írjunk fel klindamicint'.
3. Említs meg legalább 3 specifikus beavatkozást, ÉS a diktálásban konkrét OENO kódokat is mondj be hozzájuk (pl. 'Laborvizsgálat, oeno kódja huszonegyezer', 'EKG, oeno kód 12345').
Nagyon profi orvosi nyelvezetet használj, legyen legalább 20 mondat a teljes szöveg!`
      }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).choices[0].message.content;
}

async function main() {
  const transcript = await generateTranscript();
  console.log(`\n=== LEIRAT KÉSZ (${transcript.length} karakter) ===`);
  console.log(transcript);

  // Get a patient
  const { data: patients, error: pError } = await supabase.from('patients').select('id, vezeteknev, keresztnev').limit(1);
  if (pError || !patients || patients.length === 0) throw new Error("No patient found");
  const patient = patients[0];

  // Insert a dummy job
  console.log("\nLétrehozom a Voice Jobot az adatbázisban...");
  const { data: job, error: jError } = await supabase.from('voice_jobs').insert({
    patient_id: patient.id,
    status: 'processing',
    mode: 'ambulans_adatlap',
    progress_percent: 0,
    progress_message: "Feldolgozás indul..."
  }).select().single();

  if (jError) throw new Error(`Job insert error: ${JSON.stringify(jError)}`);
  
  console.log(`Job ID: ${job.id} - Indul a processAmbulansInternally (Production pipeline)...`);

  // Run the production pipeline!
  await processAmbulansInternally(
    job.id, 
    null, 
    supabase, 
    { openai: openaiKey, elevenlabs: elevenlabsKey, anthropic: openaiKey }, // Using OpenAI for Anthropic as defined in the edge function
    transcript
  );

  console.log("\nÉles pipeline lefutott! Ellenőrzöm a végeredményt...");

  const { data: finalJob } = await supabase.from('voice_jobs').select('*').eq('id', job.id).single();
  if (finalJob.status === 'completed') {
    console.log("KÉSZ! A BNO kódok és szövegek sikeresen párosítva.");
    console.log("\nKinyert BNO diagnózisok:");
    finalJob.result?.diagnoses?.forEach((d: any) => console.log(`- ${d.bno10}: ${d._bno_name || d.text_label} (Bizonyosság: ${d.confidence})`));
    console.log("\nKinyert OENO beavatkozások:");
    finalJob.result?.procedures?.forEach((p: any) => console.log(`- ${p.oeno}: ${p.text_label} (Bizonyosság: ${p.confidence})`));
    console.log("\nEllentmondások:");
    console.log(JSON.stringify(finalJob.result?.contradictions, null, 2));
  } else {
    console.log("Hiba történt a pipeline futása során:", finalJob.error);
  }
}

main().catch(console.error);
