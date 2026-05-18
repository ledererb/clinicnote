import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const getEnv = (k: string) => envFile.split('\n').find(l => l.startsWith(k+'='))?.split('=')[1]?.replace(/\"/g, '').trim();

const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const realSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      dimensions: 1536,
      input: [text]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.data[0].embedding;
}

async function main() {
  const BATCH_SIZE = 50;
  console.log(`Starting continuous semantic embedding...`);

  let processedCount = 0;

  while (true) {
    const { data: codes, error } = await realSupabase
      .from('oeno_codes')
      .select('id, code, name, semantic_description')
      .not('semantic_description', 'is', null)
      .limit(BATCH_SIZE)
      // Only select those that don't have a semantic embedding yet
      .not('id', 'in', `(select oeno_code_id from oeno_embeddings where source_type = 'semantic_description')`);

    if (error) {
      console.error('Error fetching codes:', error);
      break;
    }

    if (!codes || codes.length === 0) {
      console.log('No more codes to embed. Finishing.');
      break;
    }

    console.log(`Embedding batch of ${codes.length} codes...`);

    for (const code of codes) {
      console.log(`Embedding semantics for: [${code.code}]`);
      try {
        const textToEmbed = `${code.name}. Szinonimák, köznapi kifejezések: ${code.semantic_description}`;
        const embedding = await generateEmbedding(textToEmbed);

        const { error: insertError } = await realSupabase
          .from('oeno_embeddings')
          .insert({
            oeno_code_id: code.id,
            source_type: 'semantic_description',
            embedding: `[${embedding.join(',')}]`
          });

        if (insertError) {
          console.error(`Failed to insert embedding for ${code.code}:`, insertError);
        } else {
          processedCount++;
        }
      } catch (e) {
        console.error(`Error processing ${code.code}:`, e);
      }
    }
    
    // Small delay between batches to respect rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`Total successfully embedded in this run: ${processedCount}`);
}

main().catch(console.error);
