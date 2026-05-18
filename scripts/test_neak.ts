import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import { readFileSync } from "fs";

// Load environment variables
const envPath = join(process.cwd(), ".env.local");
config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing required OPENAI_API_KEY!");
  process.exit(1);
}

const API_KEYS = {
  openai: OPENAI_API_KEY,
  elevenlabs: process.env.ELEVENLABS_API_KEY || "",
  anthropic: process.env.ANTHROPIC_API_KEY || ""
};

// We will use the existing processAmbulansInternally function by importing it or copying its logic.
// Since it's a Deno function inside supabase/functions, we might not be able to just import it directly in a Node script due to Deno-specific syntax (if any).
// But looking at process-ambulans-internal.ts, it doesn't use any Deno-specific imports except native fetch. It should run in Node 18+.

// Let's copy the essential logic to run it directly to avoid module resolution issues:
const ADMIN_PROMPT = `Kinyerni a leiratból az ambuláns adatlap adminisztratív mezőit.
Alapértelmezett értékek (ha nem mondják másképp):
- ellatas_tipusa: "1" (első szakellátás), "2" (visszarendelés), "3" (konzílium). Alap: "1"
- tovabbkuldes: "0" (nem történt), "1" (más szakrendelésre), "2" (háziorvoshoz), "7" (fekvőbeteg). Alap: "0"
- baleset_minositese: "00" (nem baleset), "11" (munkahelyi), "21" (közúti), "31" (háztartási), "32" (sportbaleset). Alap: "00"
- beavatkozas_jellege: "A" (akut), "V" (tervezett/választott). Alap: "V"
- labor_keres: "0" (nem történt), "1" (labor és kémiai), "4" (tenyésztés). Alap: "0"
- kepalkoto_keres: "0" (nem), "1" (mellkas rtg), "2" (rtg), "7" (uh). Alap: "0"
- ct_mri_pet: "0" (nem), "1" (CT), "2" (MRI), "3" (PET). Alap: "0"
- keresokepesseg: "0" (nem történt elbírálás), "1" (táppénzre vétel), "2" (táppénz kontroll). Alap: "0"
- utikoltseg: "0" (nem), "1" (indokolt). Alap: "0"
- teritesi_kategoria: "01" (magyar biztosítás alapján), "04" (térítésköteles). Alap: "01"
- fizioterapia: "0" (nem történt), "1" (száraz egyéni), "6" (elektroterápia). Alap: "0"
- veny_segedeszkoz: felírt gyógyászati segédeszközök száma (pl. "0", "1", "2"). Alap: "0"
- veny_gyogyszer: felírt vények száma (pl. "0", "1", "2"). Alap: "0"
- veny_gyogyfurdo: felírt gyógyfürdő vények száma. Alap: "0"`;

const ADMIN_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["fields"],
  "properties": {
    "fields": {
      "type": "object", 
      "additionalProperties": false, 
      "required": [
        "ellatas_tipusa", "tovabbkuldes", "baleset_minositese", "beavatkozas_jellege",
        "labor_keres", "kepalkoto_keres", "ct_mri_pet", "keresokepesseg", "utikoltseg",
        "teritesi_kategoria", "fizioterapia", "veny_segedeszkoz", "veny_gyogyszer", "veny_gyogyfurdo"
      ],
      "properties": {
        "ellatas_tipusa": { "type": "string" },
        "tovabbkuldes": { "type": "string" },
        "baleset_minositese": { "type": "string" },
        "beavatkozas_jellege": { "type": "string" },
        "labor_keres": { "type": "string" },
        "kepalkoto_keres": { "type": "string" },
        "ct_mri_pet": { "type": "string" },
        "keresokepesseg": { "type": "string" },
        "utikoltseg": { "type": "string" },
        "teritesi_kategoria": { "type": "string" },
        "fizioterapia": { "type": "string" },
        "veny_segedeszkoz": { "type": "string" },
        "veny_gyogyszer": { "type": "string" },
        "veny_gyogyfurdo": { "type": "string" }
      }
    }
  }
};

const DIAGNOSES_PROMPT = `Kinyerni a leiratból a diagnózisokat (BNO-10) a "diagnoses" tömbbe (max 5). 
Ha tudsz egyértelmű BNO kódot, töltsd ki, ha nem, a bno10 legyen null. Minden kinyert elemhez adj evidence (max 180 karakter) és confidence (0..1).`;

const DIAGNOSIS_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["diagnoses"],
  "properties": {
    "diagnoses": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["bno10", "text_label", "evidence", "confidence"],
        "properties": {
          "bno10": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "text_label": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "evidence": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "confidence": { "type": "number" }
        }
      }
    }
  }
};

const PROCEDURES_PROMPT = `Kinyerni a leiratból a beavatkozásokat a "procedures" tömbbe (max 6). 
FONTOS: A "beavatkozás" nem csak műtétet jelent! Ide tartozik minden orvosi vizsgálat is.
Ha nem tudod biztosan a pontos hivatalos magyar OENO kódot, az "oeno" mező legyen null!`;

const PROCEDURE_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["procedures"],
  "properties": {
    "procedures": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["oeno", "text_label", "quantity_me", "evidence", "confidence"],
        "properties": {
          "oeno": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "text_label": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "quantity_me": { "anyOf": [{ "type": "integer" }, { "type": "null" }] },
          "evidence": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
          "confidence": { "type": "number" }
        }
      }
    }
  }
};

const ANAMNEZIS_SYSTEM = `Feladat: Írj "Anamnézis" szekciót egy ambuláns laphoz a bemeneti szöveg alapján.`;
const THERAPY_SYSTEM = `Készítsd el a "Kezelések" és "Gyógyszerek" leírását a bemenet alapján.`;

const THERAPY_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["pap_treatments", "pap_drugs"],
  "properties": {
    "pap_treatments": { "type": "string" },
    "pap_drugs": { "type": "string" }
  }
};

const ORCHESTRATOR_SYSTEM = `Te egy orvosi Orchestrátor AI vagy.
Kaptál egy eredeti orvosi leiratot, és 5 specializált AI ügynök által kinyert részadatot.
Validáld az összes kapott adatot, keress ellentmondásokat, és állítsd össze a végső json-t.`;

const ORCHESTRATOR_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["document", "fields", "diagnoses", "procedures", "pap_history", "pap_treatments", "pap_drugs", "validation", "contradictions", "orchestrator_summary"],
  "properties": {
    "contradictions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["statement", "contradicted_by", "medical_assessment"],
        "properties": {
          "statement": { "type": "string" },
          "contradicted_by": { "type": "string" },
          "medical_assessment": { "type": "string" }
        }
      }
    },
    "document": {
      "type": "object", "additionalProperties": false,
      "required": ["template_id", "language", "source_type"],
      "properties": {
        "template_id": { "type": "string" },
        "language": { "type": "string" },
        "source_type": { "type": "string" }
      }
    },
    "orchestrator_summary": { "type": "string" },
    "fields": ADMIN_SCHEMA.properties.fields,
    "diagnoses": DIAGNOSIS_SCHEMA.properties.diagnoses,
    "procedures": PROCEDURE_SCHEMA.properties.procedures,
    "pap_history": { "type": "string" },
    "pap_treatments": { "type": "string" },
    "pap_drugs": { "type": "string" },
    "validation": {
      "type": "object", "additionalProperties": false,
      "required": ["errors", "warnings"],
      "properties": {
        "errors": { "type": "array", "items": { "type": "object", "additionalProperties": false, "required": ["field", "code", "message"], "properties": { "field": { "type": "string" }, "code": { "type": "string" }, "message": { "type": "string" } } } },
        "warnings": { "type": "array", "items": { "type": "object", "additionalProperties": false, "required": ["field", "code", "message"], "properties": { "field": { "type": "string" }, "code": { "type": "string" }, "message": { "type": "string" } } } }
      }
    }
  }
};

async function callClaudeText(system: string, userText: string, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: userText }]
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(d));
  return d.choices[0].message.content;
}

async function callClaudeJson(system: string, userText: string, schema: any, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: "json_schema", json_schema: { name: "Extract", strict: true, schema: schema } },
      messages: [{ role: "system", content: system }, { role: "user", content: userText }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return JSON.parse(data.choices[0].message.content);
}

const transcript = `A beteg egy súlyosan krónikus beteg, ismert hypertoniás és diabeteses, aki egy kisebb autóbaleset után érkezett a traumatológiai ambulanciára. Enyhe nyaki fájdalmat és jobb váll fájdalmat panaszol. Eszméletvesztés nem volt.

Az ellátás adminisztratív kódjai a következők:
Az ellátás típusa 1-es.
A továbbküldés 1-es, más szakrendelésre küldöm.
Baleset minősítése 21-es, közúti baleset.
Beavatkozás jellege A.
Labor kérés 1-es.
Képalkotó kérés 2-es.
CT kérés 1-es.
Keresőképesség elbírálása 1-es, táppénzre veszem.
Útiköltség 1-es.
Térítési kategória 01-es.
Fizioterápia 0.
Vény segédeszköz 0.
Vény gyógyszer 2.
Vény gyógyfürdő 0.

A beteg hivatalos adatai a jegyzőkönyv kedvéért:
A páciens TAJ száma: 1 2 3 4 5 6 7 8 9.
Személyi igazolvány száma: 1 2 3 4 5 6 A B.
Irányítószáma: 1 2 3 4.
Az ellátás naplósorszáma: 1 2 3 4 5 6.
Az orvos pecsétszáma: 1 2 3 4 5.
Az intézmény azonosítója: 1 2 3 4 5 6 7 8 9.

Diagnózisok:
Nyaki rándulás (BNO: S1340).
Jobb váll zúzódása (BNO: S4000).

Beavatkozások:
Traumatológiai szakvizsgálat (OENO: 1 2 3 4 5).
Röntgen felvétel a nyakról (OENO: 3 4 5 6 7).
Vérnyomásmérés, ahol 160/90 Hgmm értéket rögzítettünk.

Kezelés és javaslat:
Nyakrögzítő gallér viselése és kímélet javasolt.
Felírtam neki Diclofenac 50mg-os tablettát napi 2x1-et, valamint Pantoprazol 40mg-ot gyomorvédelem céljából.
Kontroll vizsgálat egy hét múlva esedékes, de panasz esetén hamarabb jöjjön vissza.`;

async function main() {
  console.log("Starting analysis on specialized text...");
  console.log("Transcript length:", transcript.length);
  
  const userText = `BEMENETI LEIRAT:\n\n${transcript}`;

  console.log("Running Agents...");
  const [adminData, diagData, procData, anamnesisText, therapyData] = await Promise.all([
    callClaudeJson(ADMIN_PROMPT, userText, ADMIN_SCHEMA, API_KEYS.openai),
    callClaudeJson(DIAGNOSES_PROMPT, userText, DIAGNOSIS_SCHEMA, API_KEYS.openai),
    callClaudeJson(PROCEDURES_PROMPT, userText, PROCEDURE_SCHEMA, API_KEYS.openai),
    callClaudeText(ANAMNEZIS_SYSTEM, userText, API_KEYS.openai),
    callClaudeJson(THERAPY_SYSTEM, userText, THERAPY_SCHEMA, API_KEYS.openai)
  ]);
  
  console.log("Agents Finished. Running Orchestrator...");
  
  const orchestratorInput = `
EREDETI LEIRAT:
${transcript}

---
AGENT 1 (Admin Mezők) kimenete:
${JSON.stringify(adminData, null, 2)}

---
AGENT 2 (Diagnózisok) kimenete:
${JSON.stringify(diagData.diagnoses, null, 2)}

---
AGENT 3 (Beavatkozások) kimenete:
${JSON.stringify(procData.procedures, null, 2)}

---
AGENT 4 (Anamnézis folyószöveg) kimenete:
${anamnesisText}

---
AGENT 5 (Kezelés és Gyógyszer folyószöveg) kimenete:
${JSON.stringify(therapyData, null, 2)}
`;

  const finalData = await callClaudeJson(ORCHESTRATOR_SYSTEM, orchestratorInput, ORCHESTRATOR_SCHEMA, API_KEYS.openai);
  
  console.log("\\n\\n===================================");
  console.log("SUCCESSFULLY PROCESSED");
  console.log("===================================");
  console.log(JSON.stringify(finalData, null, 2));
}

main().catch(console.error);

