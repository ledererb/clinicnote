import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  throw new Error("Missing Supabase or OpenAI credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatch() {
  const testPhrase = "jobb oldali apróhólyagos szörtyzörejek"; // From Pneumonia test
  
  const embRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", dimensions: 1536, input: [testPhrase] })
  });
  
  if (!embRes.ok) {
    console.error("OpenAI Error:", await embRes.text());
    return;
  }
  
  const embData = await embRes.json();
  const embedding = embData.data[0].embedding;
  
  const { data: bnoData, error: bnoErr } = await supabase.rpc("match_bno_embedding", {
    query_embedding: `[${embedding.join(",")}]`,
    match_threshold: 0.3, // Lower threshold just to see what comes back
    match_count: 5,
    p_source_types: ["name", "semantic_description", "text_source"]
  });
  
  if (bnoErr) console.error("BNO RPC Error:", bnoErr);
  else {
    console.log(`Top BNO matches for '${testPhrase}':`);
    console.table(bnoData);
  }
  
  const testProcedure = "fizikális vizsgálat"; // From Pneumonia test
  const embRes2 = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", dimensions: 1536, input: [testProcedure] })
  });
  const embedding2 = (await embRes2.json()).data[0].embedding;
  
  const { data: oenoData, error: oenoErr } = await supabase.rpc("match_oeno_embedding", {
    query_embedding: `[${embedding2.join(",")}]`,
    match_threshold: 0.3,
    match_count: 5,
    p_source_types: ["name", "semantic_description"]
  });
  
  if (oenoErr) console.error("OENO RPC Error:", oenoErr);
  else {
    console.log(`Top OENO matches for '${testProcedure}':`);
    console.table(oenoData);
  }
}

testMatch();
