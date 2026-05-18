import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      return match ? [match[1], match[2].replace(/^["']|["']$/g, '')] : null;
    })
    .filter(Boolean)
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const texts = [
  "Egy 50 éves német állampolgár, aki államközi szerződés alapján jogosult az ellátásra, közúti balesetet szenvedett, egy autó ütötte el a zebrán. Az ellátás típusa tartósan gondozott kontroll, de a sérülés miatt akut beavatkozásra volt szükség, sebet varrtunk. Diagnózisa: S0190 - Fej seb, k.m.n., továbbá T0190 - Többszörös nyílt seb. Beavatkozásként OENO 58913 - Sebészi sebellátás történt. Mivel sok a sérülése, sürgősen kértem labor és kémiai vizsgálatot, valamint többféle röntgent a végtagjairól, és egy teljes CT, MRI és PET kombó vizsgálatot a belső sérülések kizárására. Fájdalomcsillapításra felírtam neki 3 doboz gyógyszert vényre, továbbá kapott 2 darab gyógyászati segédeszközt, köztük egy mankót, és kiírtam neki 1 darab gyógyfürdő vényt is utókezelésre, valamint elektroterápiát javasoltam a rehabilitációhoz. A beteget táppénzre vettem, keresőképtelen. A szállításához útiköltség utalványt állítottam ki. Miután elláttuk, visszaküldöm a beküldő szakrendeléshez."
];

async function run() {
  const { data: patient } = await supabase.from('patients').select('id').eq('vezeteknev', 'Pepszi').single();
  if (!patient) return console.log("Nincs Pepszi beteg");

  const dummyAudio = new Blob(['dummy audio content'], { type: 'audio/webm' });

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    console.log(`\n--- Teszt ${i+1} indítása ---`);
    console.log("Szöveg:", text.substring(0, 50) + "...");
    
    const { data: job } = await supabase.from('voice_jobs').insert({
      patient_id: patient.id,
      mode: 'ambulans',
      status: 'processing',
      raw_audio_text: text
    }).select().single();

    const formData = new FormData();
    formData.append('job_id', job.id);
    formData.append('audio', dummyAudio, 'dummy.webm');
    formData.append('override_transcript', text);

    // native fetch instead of supabase.functions.invoke to support FormData cleanly
    const response = await fetch(`${supabaseUrl}/functions/v1/process-chart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: formData
    });

    const resData = await response.json();
    if (!response.ok) {
      console.error("Hiba híváskor:", resData);
      continue;
    }

    console.log("Feldolgozó script elindult. Várakozás...");
    
    // Wait until it finishes
    let isDone = false;
    while(!isDone) {
      await new Promise(r => setTimeout(r, 2000));
      const { data: j } = await supabase.from('voice_jobs').select('status, result').eq('id', job.id).single();
      if (j.status !== 'processing') {
        isDone = true;
        console.log("Állapot:", j.status);
        if (j.status === 'completed') {
            console.log("Kinyert mezők:", JSON.stringify(j.result.fields, null, 2));
            console.log("Diagnózisok:", j.result.diagnoses?.map(d => `${d.bno10}: ${d.text_label}`).join(', '));
        }
      }
    }
  }
}

run();
