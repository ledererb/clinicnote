import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processAmbulansInternally } from '../supabase/functions/process-chart/process-ambulans-internal.ts';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
function getEnv(key: string) {
  const line = envFile.split('\n').find(l => l.startsWith(`${key}=`));
  return line ? line.split('=')[1]?.replace(/"/g, '').trim() : '';
}

const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
const ANTHROPIC_API_KEY = getEnv('ANTHROPIC_API_KEY');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

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
        content: `Generálj ${count} darab KÜLÖNBÖZŐ orvosi hangfelvétel leiratot emberi páciensekről egy ambuláns rendelésen. Különböző szakterületek legyenek. Némelyik tartalmazzon REJTETT VAGY NYÍLT ORVOSI ELLENTMONDÁSOKAT (pl. allergia egy gyógyszerre de mégis felírja, vagy helytelen diagnózis, vagy meggondolja magát közben) amiket a rendszernek észre kell vennie.`
      }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return JSON.parse((await res.json()).choices[0].message.content).transcripts || [];
}

async function evaluateAccuracy(transcript: string, finalResult: any) {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{
        role: 'system',
        content: 'You are an evaluator checking if a medical multi-agent orchestrator successfully processed a transcript. Output JSON with { "score": number (0-100), "reason": "short explanation", "contradictions_found": boolean }'
      }, {
        role: 'user',
        content: `Transcript: ${transcript}\n\nFinal Processed Data: ${JSON.stringify(finalResult)}\n\nCheck if the extracted data perfectly matches the final intent of the doctor in the transcript. Did the system catch any intended contradictions? Are there formatting errors? Rate from 0 to 100.`
      }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return JSON.parse((await res.json()).choices[0].message.content);
}

async function main() {
  const TOTAL = 10;
  console.log(`Starting generation of ${TOTAL} test transcripts...`);
  const transcripts = await generateTranscripts(TOTAL);
  
  const realSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const results = [];

  for (let i = 0; i < transcripts.length; i++) {
    console.log(`\n--- Processing Transcript ${i + 1}/${TOTAL} ---`);
    const transcript = transcripts[i];
    const jobId = `test_job_${i}`;
    let finalOutput: any = null;

    // Mock Supabase client to capture the update
    const mockSupabaseAdmin = {
      from: (table: string) => ({
        update: (data: any) => ({
          eq: (field: string, val: string) => {
            if (val === jobId && data.result) {
              finalOutput = data.result;
            }
          }
        })
      }),
      rpc: (name: string, args: any) => realSupabase.rpc(name, args)
    };

    try {
      console.log('Running Multi-Agent pipeline...');
      const apiKeys = { openai: OPENAI_API_KEY, elevenlabs: '', anthropic: ANTHROPIC_API_KEY };
      await processAmbulansInternally(jobId, null, mockSupabaseAdmin, apiKeys, transcript);
      
      console.log('Evaluating outcome...');
      const evalResult = await evaluateAccuracy(transcript, finalOutput);
      console.log(`Score: ${evalResult.score}/100. Contradictions found: ${evalResult.contradictions_found}`);
      console.log(`Reason: ${evalResult.reason}`);

      results.push({ transcript, finalOutput, evalResult });
    } catch (e) {
      console.error(`Error on transcript ${i}:`, e);
    }
  }

  const timestamp = Date.now();
  if (!existsSync(join(process.cwd(), 'scripts', 'results'))) {
    mkdirSync(join(process.cwd(), 'scripts', 'results'), { recursive: true });
  }
  const filename = join(process.cwd(), 'scripts', 'results', `eval_orchestrator_${timestamp}.json`);
  writeFileSync(filename, JSON.stringify(results, null, 2));

  // Print Summary
  console.log('\n=============================================');
  console.log('                 SUMMARY');
  console.log('=============================================');
  const scores = results.map(r => r.evalResult?.score || 0);
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const contradictionsFound = results.filter(r => r.evalResult?.contradictions_found).length;
  
  console.log(`Total Tested: ${results.length}`);
  console.log(`Average Score: ${avg.toFixed(2)}/100`);
  console.log(`Transcripts with contradictions found: ${contradictionsFound}`);
  console.log(`Saved detailed results to: ${filename}`);
}

main().catch(console.error);
