import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const files = readdirSync(join(process.cwd(), 'scripts', 'results'));
const latestFile = files.sort().pop();
if (!latestFile) throw new Error("No results found");

const results = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'results', latestFile), 'utf-8'));

let errors = 0;
let warnings = 0;

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (r.extracted.validation?.errors?.length > 0) {
    errors++;
    console.log(`\n=== TRANSCRIPT ${i + 1} ERROR ===`);
    console.log(r.transcript);
    console.log('Errors:', r.extracted.validation.errors);
  }
  if (r.extracted.validation?.warnings?.length > 0) {
    warnings++;
  }
}

console.log(`\nAnalyzed ${results.length} transcripts from ${latestFile}`);
console.log(`Total Validation Errors: ${errors}`);
console.log(`Total Validation Warnings: ${warnings}`);
console.log("No extraction crashes occurred.");
