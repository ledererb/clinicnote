import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const templates = [
  "A beteg kb. két hete kezdődő, tompa jellegű mellkasi fájdalomról számol be, amely köhögéskor és mélylégvételkor fokozódik. Hőemelkedése volt. Fizikális vizsgálat: jobb tüdőfél felett elszórtan apróhólyagos szörtyzörejek. Diagnózis: Pneumonia gyanú. Terápia: Augmentin 1000mg 2x1.",
  "Ismert hypertoniás beteg rutin kontrollja. Otthoni vérnyomásnaplója szerint az értékek 135/85 mmHg körül mozognak. Terápia (Coverex-AS 5mg 1x1) folytatása javasolt. Labor kontroll szükséges.",
  "Tegnap lépcsőn megcsúszott, jobb bokája kifordult. Státusz: Jobb külboka körül mérsékelt duzzanat, nyomásérzékenység. RTG törést nem igazolt. Flector kenőcs helyileg, rugalmas pólya javasolt.",
  "3 napja tartó produktív köhögés, sárgás köpettel. Tüdő felett érdesebb légzés. Diagnózis: Akut bronchitis. Terápia: ACC 600mg, Sinecod szirup éjszakára.",
  "Kórelőzményben migrén. Tegnap este óta erős, lüktető, bal oldali fejfájás fényérzékenységgel. Sumatriptan 50mg felírva rohamoldásra.",
  "Két napja emeléskor éles fájdalom hasított a derekába. Alsó végtagba nem sugárzik. Lumbális izomzat spazmusos. Lasegue negatív. Mydeton 150mg és Diclofenac 75mg javasolt.",
  "3 napja gyakori, sürgető vizelési inger, csípő érzés. Vizelet gyorsteszt: leukocyta pozitív. Monural 3g granulátum felírva, bő folyadékfogyasztás javasolt.",
  "T2DM kontroll. Éhomi vércukor értékek 7.0 mmol/l. Meforal 1000mg 2x1 szedése folytatandó. Szemészeti kontroll javasolt.",
  "Két napja új mosószert használt, hasán viszkető kiütések jelentkeztek. Allergiás kontakt dermatitis. Cetirizin 10mg és Advantan krém javasolt.",
  "Hónapok óta tartó epigastrialis égő érzés étkezés után. Pantoprazol 40mg napi 1x felírva, életmódi tanácsokkal ellátva."
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const { data: patient } = await supabase.from('patients').select('id, vezeteknev, keresztnev').eq('vezeteknev', 'Pepszi').eq('keresztnev', 'Béla').limit(1).single();
  if (!patient) {
    console.error('Patient Pepszi Béla not found!');
    return;
  }

  console.log(`Starting 100 FULL API evaluations for ${patient.vezeteknev} ${patient.keresztnev}...`);

  const jobIds: string[] = [];

  // Generate 100 jobs first in the DB
  for (let i = 0; i < 100; i++) {
    const { data: job, error } = await supabase
      .from('voice_jobs')
      .insert([{
        status: 'processing',
        mode: 'ambulans',
        patient_id: patient.id
      }])
      .select()
      .single();

    if (error || !job) {
      console.error("Failed to create job:", error);
      continue;
    }
    jobIds.push(job.id);
  }

  console.log(`Created ${jobIds.length} jobs in database.`);

  // Process in batches of 3 to avoid rate limits
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < jobIds.length; i += BATCH_SIZE) {
    const batch = jobIds.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(jobIds.length/BATCH_SIZE)}...`);

    const promises = batch.map(async (jobId, index) => {
      const template = templates[(i + index) % templates.length];
      
      // Randomly fuzz the template slightly to make them unique
      const pulse = 60 + Math.floor(Math.random() * 40);
      const text = `[Teszt ${i + index + 1}] ` + template + ` Pulzus: ${pulse}/min.`;

      const audioBlob = new Blob(["dummy audio bytes"], { type: "audio/webm" });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dummy.webm');
      formData.append('job_id', jobId);
      formData.append('override_transcript', text);

      try {
        const { error: fnError } = await supabase.functions.invoke('process-chart', {
          body: formData,
        });
        if (fnError) {
          console.error(`Error invoking function for job ${jobId}:`, fnError);
        } else {
          console.log(`Job ${jobId} triggered successfully.`);
        }
      } catch (err) {
        console.error(`Exception invoking job ${jobId}:`, err);
      }
    });

    await Promise.all(promises);
    
    // Wait 10 seconds between batches to avoid rate limits
    if (i + BATCH_SIZE < jobIds.length) {
      console.log("Waiting 10s for rate limit safety...");
      await delay(10000);
    }
  }

  console.log("All 100 jobs have been submitted to the Edge Function.");
  console.log("Now waiting for all to complete...");

  // Poll for completion
  let allDone = false;
  let attempts = 0;
  
  while (!allDone && attempts < 60) { // Max 10 minutes wait
    await delay(10000); // Check every 10s
    attempts++;

    const { data: currentJobs } = await supabase
      .from('voice_jobs')
      .select('id, status')
      .in('id', jobIds);

    if (!currentJobs) continue;

    const completed = currentJobs.filter(j => j.status === 'completed').length;
    const errorCount = currentJobs.filter(j => j.status === 'error').length;
    const processing = currentJobs.filter(j => j.status === 'processing').length;

    console.log(`Status poll [${attempts}]: Completed: ${completed}, Error: ${errorCount}, Processing: ${processing}`);

    if (processing === 0) {
      allDone = true;
    }
  }

  console.log("All jobs finished processing. Starting evaluation...");

  // Evaluation
  const { data: finalJobs } = await supabase
    .from('voice_jobs')
    .select('id, status, result, raw_audio_text')
    .in('id', jobIds);

  let successCount = 0;
  let validationErrorsCount = 0;
  let oenoMissingCount = 0;
  let bnoMissingCount = 0;

  if (finalJobs) {
    for (const job of finalJobs) {
      if (job.status === 'completed' && job.result) {
        successCount++;
        const res = job.result as any;
        
        if (res.validation?.errors?.length > 0) validationErrorsCount++;
        
        const hasOeno = res.procedures?.some((p: any) => p.oeno);
        if (!hasOeno) oenoMissingCount++;
        
        const hasBno = res.diagnoses?.some((d: any) => d.bno10);
        if (!hasBno) bnoMissingCount++;
      }
    }
  }

  console.log("\n================ REPORT ================");
  console.log(`Total jobs: ${jobIds.length}`);
  console.log(`Successfully completed: ${successCount}`);
  console.log(`Jobs with validation errors: ${validationErrorsCount}`);
  console.log(`Jobs missing BNO code: ${bnoMissingCount}`);
  console.log(`Jobs missing OENO code: ${oenoMissingCount}`);
  console.log("========================================");

}

main().catch(console.error);
