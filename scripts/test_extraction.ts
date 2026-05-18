import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Read .env.local manually
const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const OPENAI_API_KEY = envFile.split('\n').find(l => l.startsWith('OPENAI_API_KEY='))?.split('=')[1]?.replace(/"/g, '') || '';

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Import schema and prompt from the actual file
const internalText = readFileSync(join(process.cwd(), 'supabase/functions/process-chart/process-ambulans-internal.ts'), 'utf-8');

// Extract SCHEMA and PROMPT using regex or string parsing
const extractSchemaRegex = /const AMBULANS_SCHEMA = (\{[\s\S]*?\});\s*const EXTRACT_USER_PROMPT/m;
const schemaMatch = internalText.match(extractSchemaRegex);
const AMBULANS_SCHEMA = schemaMatch ? JSON.parse(schemaMatch[1]) : {};

const extractPromptRegex = /const EXTRACT_USER_PROMPT = `([\s\S]*?)`;/m;
const promptMatch = internalText.match(extractPromptRegex);
const EXTRACT_USER_PROMPT = promptMatch ? promptMatch[1] : '';

async function generateTranscripts(count: number): Promise<string[]> {
  console.log(`Generating ${count} edge-case transcripts...`);
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: 'You are generating medical dictation transcripts in Hungarian. Always output JSON in format { "transcripts": ["...", "..."] }.'
        },
        {
          role: 'user',
          content: `Generálj ${count} darab KÜLÖNBÖZŐ orvosi hangfelvétel leiratot Pepszi Béla professzor (állatorvos) vagy emberi orvos számára.
A páciens legyen mindig más (vagy állat vagy ember).
Minden leirat legyen HOSSZÚ, és tartalmazzon EXTRÉM edge-caseket, például:
- Elszólások (pl. "Legyen kettő doboz... jaj várj, nem, mégis csak egy doboz kell", vagy "CT-t kérek... hülyeség, sima röntgen elég").
- Zavaros beszéd, ellentmondások.
- Bizonytalanság (pl. "Nem is tudom, talán menjen el fizioterápiára, de mégse, inkább ne").
- Olyan adatok, amiket a séma keres (táppénz, ellátás típusa, beavatkozás, gyógyszer, továbbküldés).
Próbáld meg becsapni az AI-t azzal, hogy először rossz opciót mond, aztán egy teljesen másikat, hogy teszteljük az adatkinyerést! Ne formázd a szöveget, csak mintha szóban mondanák.`
        }
      ]
    })
  });
  
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed.transcripts || [];
}

async function extractData(transcript: string) {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "AmbulansAdatlapExtraction", strict: true, schema: AMBULANS_SCHEMA } },
      messages: [
        { role: "system", content: "Magyar orvosi dokumentum kinyerő asszisztens. Pontosan kövesd a JSON sémát." },
        { role: "user", content: EXTRACT_USER_PROMPT + transcript }
      ]
    })
  });
  
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  const TOTAL_BATCHES = 9;
  const BATCH_SIZE = 10;
  
  if (!existsSync(join(process.cwd(), 'scripts', 'results'))) {
    mkdirSync(join(process.cwd(), 'scripts', 'results'), { recursive: true });
  }

  const results = [];
  
  for (let b = 0; b < TOTAL_BATCHES; b++) {
    console.log(`\n--- BATCH ${b+1}/${TOTAL_BATCHES} ---`);
    const transcripts = await generateTranscripts(BATCH_SIZE);
    console.log(`Generated ${transcripts.length} transcripts. Extracting...`);

    for (let i = 0; i < transcripts.length; i++) {
      console.log(`Processing ${i + 1}/${transcripts.length}...`);
      try {
        const extracted = await extractData(transcripts[i]);
        results.push({
          transcript: transcripts[i],
          extracted
        });
      } catch (e) {
        console.error(`Error on ${i}:`, e);
      }
    }
  }

  const timestamp = Date.now();
  writeFileSync(
    join(process.cwd(), 'scripts', 'results', `batch_remaining_90_${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );

  console.log(`Batch finished. Saved to scripts/results/batch_remaining_90_${timestamp}.json`);
}

main().catch(console.error);
