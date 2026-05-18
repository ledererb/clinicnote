import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { join } from 'path';

// Parse .env.local
const envFile = fs.readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getEnv = (k: string) => envFile.split('\n').find(l => l.startsWith(k+'='))?.split('=')[1]?.replace(/\"/g, '').trim();

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateSemantics(codes: { code: string, name: string }[]) {
  const promptText = `Te egy orvosi asszisztens vagy. Az alábbiakban magyar OENO (orvosi eljárás) kódokat és megnevezéseket kapsz.
Feladatod, hogy minden egyes kódhoz írj egy 1-2 mondatos laikus magyarázatot, ami tartalmazza a leggyakoribb orvosi és köznyelvi szinonimákat is.
KIZÁRÓLAG EGY ÉRVÉNYES JSON OBJEKTUMMAL TÉRJ VISSZA, szöveges körítés nélkül!
A JSON formátuma:
{
  "kód1": "leírás és szinonimák...",
  "kód2": "leírás és szinonimák..."
}

Kódok:
${codes.map(c => `${c.code}: ${c.name}`).join('\n')}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptText }],
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function main() {
  console.log("Üres szemantikus leírások keresése és folyamatos feldolgozása...");
  
  let totalProcessed = 0;

  while (true) {
    const { data: missingCodes, error } = await supabase
      .from('oeno_codes')
      .select('id, code, name')
      .is('semantic_description', null)
      .limit(1000);

    if (error) {
      console.error("Adatbázis hiba:", error);
      return;
    }

    if (!missingCodes || missingCodes.length === 0) {
      console.log("Minden kódhoz elkészült a szemantikus leírás!");
      break;
    }

    console.log(`\nÚj lekérdezés: ${missingCodes.length} kód vár szemantikus leírásra (A futás alatt eddig feldolgozva: ${totalProcessed}).`);

    const BATCH_SIZE = 40; 
    const codesToProcess = missingCodes; 

    for (let i = 0; i < codesToProcess.length; i += BATCH_SIZE) {
      const batch = codesToProcess.slice(i, i + BATCH_SIZE);
      console.log(`Feldolgozás: batch ${i / BATCH_SIZE + 1} / ${Math.ceil(codesToProcess.length / BATCH_SIZE)} (Kódok: ${batch.length} db)`);

      try {
        const generated = await generateSemantics(batch);
        
        for (const item of batch) {
          if (generated[item.code]) {
            const { error: updateErr } = await supabase
              .from('oeno_codes')
              .update({ semantic_description: generated[item.code] })
              .eq('id', item.id);
              
            if (updateErr) {
              console.error(`Hiba a frissítésnél (${item.code}):`, updateErr);
            }
          }
        }
        
        console.log(`✅ Batch ${i / BATCH_SIZE + 1} sikeresen frissítve.`);
        totalProcessed += batch.length;
      } catch (err) {
        console.error(`❌ Hiba a batch feldolgozásakor:`, err);
      }
      
      await delay(1000);
    }
  }
  
  console.log("Generálás befejeződött! Összesen feldolgozva a mostani futás alatt: " + totalProcessed);
}

main().catch(console.error);
