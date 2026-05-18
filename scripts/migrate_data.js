import { createClient } from '@supabase/supabase-js';

// TreatNote (Source)
const treatNoteUrl = 'https://bpjzgapmoyhtgryglcke.supabase.co';
const treatNoteKey = process.env.TREATNOTE_SECRET_KEY; // Service role key
const source = createClient(treatNoteUrl, treatNoteKey);

// ClinicNote (Target)
const clinicNoteUrl = 'https://ywnxjvnxhsocpsagzhqj.supabase.co';
const clinicNoteKey = process.env.CLINICNOTE_ANON_KEY; // Anon key, public insert enabled
const target = createClient(clinicNoteUrl, clinicNoteKey);

async function migrateData() {
  console.log('Starting migration...');

  // 1. Migrate BNO Codes
  console.log('Fetching BNO codes from TreatNote...');
  let hasMoreCodes = true;
  let codeOffset = 0;
  const BATCH_SIZE = 200;

  // 1. Migrate BNO Codes
  // console.log('Fetching BNO codes from TreatNote...');
  // ... (skipped)

  // 2. Migrate BNO Embeddings
  console.log('Fetching BNO embeddings from TreatNote...');
  let hasMoreEmbeddings = true;
  let embOffset = 0;
  
  while (hasMoreEmbeddings) {
    const { data: embeddings, error: embError } = await source
      .from('bno_embeddings')
      .select('*')
      .range(embOffset, embOffset + BATCH_SIZE - 1);

    if (embError) {
      console.error('Error fetching BNO embeddings:', embError);
      return;
    }

    if (!embeddings || embeddings.length === 0) {
      hasMoreEmbeddings = false;
      break;
    }

    console.log(`Inserting ${embeddings.length} BNO embeddings... (offset: ${embOffset})`);
    const { error: insertError } = await target
      .from('bno_embeddings')
      .upsert(embeddings, { onConflict: 'id' });

    if (insertError) {
      console.error('Error inserting BNO embeddings:', insertError);
      return;
    }

    embOffset += embeddings.length;
    if (embeddings.length < BATCH_SIZE) hasMoreEmbeddings = false;
  }
  console.log(`Migrated ${embOffset} BNO embeddings successfully!`);
}

migrateData().catch(console.error);
