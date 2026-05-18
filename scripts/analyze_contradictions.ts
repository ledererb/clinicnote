import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const files = readdirSync(join(process.cwd(), 'scripts', 'results'));
const latestFile = files.filter(f => f.startsWith('contradictions_')).sort().pop();
if (!latestFile) throw new Error("No results found");

const results = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'results', latestFile), 'utf-8'));

let caught = 0;

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.extracted.contradictions?.length > 0) {
    caught++;
    console.log(`\n=== TRANSCRIPT ${i + 1} CONTRADICTIONS ===`);
    for (const c of r.extracted.contradictions) {
      console.log(`- Állítás: ${c.statement}`);
      console.log(`  Ellentmondás: ${c.contradicted_by}`);
      console.log(`  Orvosi értékelés: ${c.medical_assessment}`);
    }
  }
}

console.log(`\nAnalyzed ${results.length} transcripts from ${latestFile}`);
console.log(`Contradictions caught in ${caught} out of ${results.length} transcripts.`);
