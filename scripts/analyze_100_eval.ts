import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const files = readdirSync(join(process.cwd(), 'scripts', 'results'));
const latestFile = files.filter(f => f.startsWith('eval_100_full_')).sort().pop();
if (!latestFile) throw new Error("No results found");

const results = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'results', latestFile), 'utf-8'));

let totalScore = 0;
let scoredCount = 0;
let contradictionsCaught = 0;
let interestingFindings = [];

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  
  if (r.evalResult && r.evalResult.score != null) {
    totalScore += r.evalResult.score;
    scoredCount++;
    
    if (r.evalResult.score < 90) {
      interestingFindings.push(`- Transzkript ${i+1}: AI Score ${r.evalResult.score}%. Ok: ${r.evalResult.reason}`);
    }
  }

  if (r.fullResult && r.fullResult.contradictions && r.fullResult.contradictions.length > 0) {
    contradictionsCaught++;
    if (interestingFindings.length < 5) {
      interestingFindings.push(`- Érdekesség ${i+1}: ${r.fullResult.contradictions[0].medical_assessment}`);
    }
  }
}

const avgScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(2) : 0;

console.log(`\n=== 100 FUTÁS EREDMÉNYE ===`);
console.log(`Feldolgozott esetek száma: ${results.length}`);
console.log(`Átlagos adatkinyerési pontosság (AI értékelés alapján): ${avgScore}%`);
console.log(`Ellentmondásokat sikeresen detektált a ${results.length} esetből: ${contradictionsCaught} esetben.`);
console.log(`\nÉrdekességek / Észrevételek / Hibák (Első 5):`);
interestingFindings.slice(0, 5).forEach(f => console.log(f));
