import { readFileSync } from 'fs';
import { join } from 'path';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const OPENAI_API_KEY = envFile.split('\n').find(l => l.startsWith('OPENAI_API_KEY='))?.split('=')[1]?.replace(/"/g, '') || '';
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const AMBULANS_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["document", "fields", "diagnoses", "procedures", "found", "validation"],
  "properties": {
    "document": {
      "type": "object", "additionalProperties": false,
      "required": ["template_id", "language", "source_type"],
      "properties": {
        "template_id": { "type": "string" },
        "language": { "type": "string", "enum": ["hu"] },
        "source_type": { "type": "string", "enum": ["transcript", "text", "note"] }
      }
    },
    "fields": {
      "type": "object", 
      "additionalProperties": false, 
      "required": [
        "ellatas_tipusa", "tovabbkuldes", "baleset_minositese", "beavatkozas_jellege",
        "labor_keres", "kepalkoto_keres", "ct_mri_pet", "keresokepesseg",
        "utikoltseg", "teritesi_kategoria", "fizioterapia", "veny_segedeszkoz",
        "veny_gyogyszer", "veny_gyogyfurdo"
      ],
      "properties": {
        "ellatas_tipusa": { "type": "string", "enum": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "K", "T"] },
        "tovabbkuldes": { "type": "string", "enum": ["0", "1", "2", "3", "4", "5", "6", "7", "8"] },
        "baleset_minositese": { "type": "string", "enum": ["00", "11", "16", "20", "21", "22", "31", "32", "34", "40", "41", "42", "43"] },
        "beavatkozas_jellege": { "type": "string", "enum": ["A", "V", "C", "D", "K", "R"] },
        "labor_keres": { "type": "string", "enum": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] },
        "kepalkoto_keres": { "type": "string", "enum": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] },
        "ct_mri_pet": { "type": "string", "enum": ["0", "1", "2", "3", "4"] },
        "keresokepesseg": { "type": "string", "enum": ["0", "1", "2", "3", "4", "5"] },
        "utikoltseg": { "type": "string", "enum": ["0", "1", "2", "3"] },
        "teritesi_kategoria": { "type": "string", "enum": ["01", "03", "04", "06", "61", "09", "0A", "0D", "0E", "0F", "0G", "0H", "0I", "0J", "0K", "0M", "0R", "0S", "0T", "0V", "0Y", "0W", "00", "0X", "BP", "F1", "F6"] },
        "fizioterapia": { "type": "string", "enum": ["0", "1", "2", "3", "4", "5", "6", "7", "8"] },
        "veny_segedeszkoz": { "type": "string" },
        "veny_gyogyszer": { "type": "string" },
        "veny_gyogyfurdo": { "type": "string" }
      }
    },
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
    },
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
    },
    "found": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["field", "value", "evidence", "confidence"],
        "properties": {
          "field": { "type": "string" },
          "value": { "anyOf": [{ "type": "string" }, { "type": "number" }, { "type": "integer" }, { "type": "boolean" }, { "type": "null" }] },
          "evidence": { "type": "string" },
          "confidence": { "type": "number" }
        }
      }
    },
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

async function test() {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "AmbulansAdatlapExtraction", strict: true, schema: AMBULANS_SCHEMA } },
      messages: [
        { role: "user", content: "hello" }
      ]
    })
  });
  console.log(await res.text());
}
test();
