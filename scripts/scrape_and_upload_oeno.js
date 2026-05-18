import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ywnxjvnxhsocpsagzhqj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getEmbedding(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      dimensions: 1536,
      input: text
    })
  });
  if (!res.ok) {
    throw new Error(`OpenAI error: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

async function scrapePage(page) {
  console.log(`Scraping page ${page}...`);
  const res = await fetch(`https://finanszirozas.neak.gov.hu/szabalykonyv/index.asp?mid=1&pid=${page}`);
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-2"); 
  const text = decoder.decode(buffer);
  
  const regex = /<tr[^>]*>\s*<td[^>]*><a[^>]*kod=(\w+)[^>]*>\s*\1\s*<\/a><\/td>\s*<td[^>]*>(.*?)<\/td>/gi;
  
  let match;
  const results = [];
  while ((match = regex.exec(text)) !== null) {
    results.push({ code: match[1], name: match[2].trim() });
  }
  return results;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  let allCodes = [];
  for (let i = 1; i <= 34; i++) {
    const codes = await scrapePage(i);
    allCodes = allCodes.concat(codes);
  }
  
  console.log(`Total OENO codes scraped: ${allCodes.length}`);
  
  // Deduplicate just in case
  const uniqueCodes = [];
  const seen = new Set();
  for (const c of allCodes) {
    if (!seen.has(c.code)) {
      seen.add(c.code);
      uniqueCodes.push(c);
    }
  }
  console.log(`Unique OENO codes: ${uniqueCodes.length}`);
  
  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < uniqueCodes.length; i += BATCH_SIZE) {
    const batch = uniqueCodes.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(uniqueCodes.length / BATCH_SIZE)}`);
    
    // First, insert or get oeno_codes
    const codesToInsert = batch.map(b => ({ code: b.code, name: b.name }));
    const { data: insertedCodes, error: insertError } = await supabase
      .from('oeno_codes')
      .upsert(codesToInsert, { onConflict: 'code', ignoreDuplicates: false })
      .select('id, code');
      
    if (insertError) {
      console.error("Error inserting codes:", insertError);
      continue;
    }
    
    // Create map of code -> id
    const idMap = {};
    for (const row of insertedCodes) {
      idMap[row.code] = row.id;
    }
    
    // Generate embeddings for the names in parallel
    const embeddingsToInsert = [];
    const embeddingPromises = batch.map(async (item) => {
      try {
        const id = idMap[item.code];
        if (!id) return;
        
        const embedding = await getEmbedding(item.name);
        embeddingsToInsert.push({
          oeno_code_id: id,
          source_type: 'name',
          embedding: `[${embedding.join(',')}]`
        });
      } catch (err) {
        console.error(`Error embedding ${item.code}:`, err.message);
      }
    });
    
    await Promise.all(embeddingPromises);
    
    // Insert embeddings
    if (embeddingsToInsert.length > 0) {
      const { error: embedError } = await supabase
        .from('oeno_embeddings')
        .insert(embeddingsToInsert);
        
      if (embedError) {
        console.error("Error inserting embeddings:", embedError);
      }
    }
    
    // Small delay to avoid rate limits
    await delay(200);
  }
  
  console.log("Done!");
}

main().catch(console.error);
