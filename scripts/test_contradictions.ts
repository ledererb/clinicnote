import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Read .env.local manually
const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const OPENAI_API_KEY = envFile.split('\n').find(l => l.startsWith('OPENAI_API_KEY='))?.split('=')[1]?.replace(/"/g, '') || '';

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Import schema and prompt
const internalText = readFileSync(join(process.cwd(), 'supabase/functions/process-chart/process-ambulans-internal.ts'), 'utf-8');

const extractSchemaRegex = /const AMBULANS_SCHEMA = (\{[\s\S]*?\});\s*const EXTRACT_USER_PROMPT/m;
const schemaMatch = internalText.match(extractSchemaRegex);
const AMBULANS_SCHEMA = schemaMatch ? JSON.parse(schemaMatch[1]) : {};

const extractPromptRegex = /const EXTRACT_USER_PROMPT = `([\s\S]*?)`;/m;
const promptMatch = internalText.match(extractPromptRegex);
const EXTRACT_USER_PROMPT = promptMatch ? promptMatch[1] : '';

async function generateTranscripts(count: number): Promise<string[]> {
  console.log(`Generating ${count} contradiction-heavy medical transcripts...`);
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
          content: 'You are generating human medical dictation transcripts in Hungarian. Always output JSON in format { "transcripts": ["...", "..."] }.'
        },
        {
          role: 'user',
          content: `Generálj ${count} darab KÜLÖNBÖZŐ orvosi hangfelvétel leiratot emberi páciensekről egy ambuláns rendelésen.
Minden leirat legyen HOSSZÚ, RÉSZLETES (kórtörténet, fizikális vizsgálat), és tartalmazzon REJTETT VAGY NYÍLT ORVOSI ELLENTMONDÁSOKAT VAGY ÖN-JAVÍTÁSOKAT, például:
- A beteg anamnézisében szerepel, hogy penicillin allergiás, de a kezelési tervben az orvos Augmentint vagy Aktil Duot (penicillin származék) ír fel neki.
- Az orvos a fizikális vizsgálatnál a bal térd duzzanatát írja le, de a diagnózisban vagy a kezelésnél jobb térd problémáról beszél.
- Az orvos felír egy vérnyomáscsökkentőt, de aztán eszébe jut valami és elveti, majd mégis megváltoztatja a döntését.
- A beteg asztmás, de az orvos béta-blokkolót ír fel (ami ellenjavallt).
- A pulzus 45/min, de tachycardia-t említ.

Kérlek, legyen minél valósághűbb és orvosi szaknyelvvel teli, mintha tényleg diktálna az orvos. A cél az, hogy a rendszerünk felismerje ezeket az ellentmondásokat.`
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
  const BATCH_SIZE = 20; // Generate 20 transcripts
  
  if (!existsSync(join(process.cwd(), 'scripts', 'results'))) {
    mkdirSync(join(process.cwd(), 'scripts', 'results'), { recursive: true });
  }

  const transcripts = await generateTranscripts(BATCH_SIZE);
  console.log(`Generated ${transcripts.length} transcripts. Extracting...`);

  const results = [];
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

  const timestamp = Date.now();
  writeFileSync(
    join(process.cwd(), 'scripts', 'results', `contradictions_${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );

  console.log(`Batch finished. Saved to scripts/results/contradictions_${timestamp}.json`);
}

main().catch(console.error);
