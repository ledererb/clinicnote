const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// ── SCHEMAS ─────────────────────────────────────────────────────────────

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
    }
  }
};

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

const THERAPY_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["pap_treatments", "pap_drugs"],
  "properties": {
    "pap_treatments": { "type": "string" },
    "pap_drugs": { "type": "string" }
  }
};

const ORCHESTRATOR_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["document", "fields", "diagnoses", "procedures", "pap_history", "pap_treatments", "pap_drugs", "validation", "contradictions"],
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
        "language": { "type": "string", "enum": ["hu"] },
        "source_type": { "type": "string", "enum": ["transcript", "text", "note"] }
      }
    },
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

// ── PROMPTS ─────────────────────────────────────────────────────────────

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

const DIAGNOSES_PROMPT = `Kinyerni a leiratból a diagnózisokat (BNO-10) a "diagnoses" tömbbe (max 5). 
Ha tudsz egyértelmű BNO kódot, töltsd ki, ha nem, a bno10 legyen null. Minden kinyert elemhez adj evidence (max 180 karakter) és confidence (0..1).`;

const PROCEDURES_PROMPT = `Kinyerni a leiratból a beavatkozásokat a "procedures" tömbbe (max 6). 
FONTOS: A "beavatkozás" nem csak műtétet jelent! Ide tartozik minden orvosi vizsgálat is (pl. "fizikális vizsgálat", "rutin kontroll", "EKG", "vérnyomásmérés", "neurológiai gyorsteszt"). Ha ilyet látsz, azt is emeld ki!
Ha nem tudod biztosan a pontos hivatalos magyar OENO kódot, az "oeno" mező legyen null! SZIGORÚAN TILOS kitalálni kódokat. Csak a megnevezést és a mennyiséget töltsd ki. Minden kinyert elemhez adj evidence és confidence (0..1).`;

const ANAMNEZIS_SYSTEM = `Feladat: Írj "Anamnézis" szekciót egy ambuláns laphoz a bemeneti szöveg alapján.
Csak a szövegben szereplő tényeket írd le. Ha nincs adat: "Nincs adat."
Magyarul, tömören, orvosi jelleggel.`;

const THERAPY_SYSTEM = `Készítsd el a "Kezelések" és "Gyógyszerek" leírását a bemenet alapján. 
KIZÁRÓLAG a ténylegesen elhangzottakat írd le. Ne találj ki új kezelést vagy gyógyszert. Ha nincs adat, írd hogy "Nincs adat."`;

const ORCHESTRATOR_SYSTEM = `Te egy orvosi Orchestrátor AI vagy.
Kaptál egy eredeti orvosi leiratot, és 5 specializált AI ügynök által kinyert részadatot (adminisztratív mezők, diagnózisok, beavatkozások, anamnézis, terápiák).
FELADATAID:
1. Validáld az összes kapott adatot az eredeti szöveg és az ügynökök kimenete alapján.
2. Keress ELLENTMONDÁSOKAT az eredeti szöveg alapján (pl. felír valamit amire a beteg allergiás, vagy ha egy kinyert diagnózis/beavatkozás nem felel meg az elhangzottaknak).
3. Gyűjtsd össze a formai vagy tartalmi hibákat a "validation" részbe.
4. Állítsd össze a VÉGSŐ, leigazolt ambuláns JSON-t. Ne hagyj el adatot amit az ügynökök találtak, csak javítsd ha hibás, és add hozzá a validation/contradictions mezőket. A document template_id legyen "amb_1", language "hu", source_type "transcript".`;

// ── HELPERS ─────────────────────────────────────────────────────────────

async function callClaudeText(system: string, userText: string, apiKey: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.2,
      system: system,
      messages: [{ role: "user", content: userText }]
    })
  });
  if (!res.ok) throw new Error(`Claude Text error: ${await res.text()}`);
  const d = await res.json();
  return d.content[0].text;
}

async function callClaudeJson(system: string, userText: string, schema: any, apiKey: string): Promise<any> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.1,
      system: system,
      messages: [{ role: "user", content: userText }],
      tools: [{
        name: "output_data",
        description: "Output the structured data",
        input_schema: schema
      }],
      tool_choice: { type: "tool", name: "output_data" }
    })
  });
  
  if (!res.ok) throw new Error(`Claude JSON error: ${await res.text()}`);
  const data = await res.json();
  const toolUse = data.content.find((c: any) => c.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return tool_use block.");
  return toolUse.input;
}

async function matchAllBno(evidenceTexts: string[], openaiKey: string, supabaseAdmin: any): Promise<any[][]> {
  if (evidenceTexts.length === 0) return [];
  const embRes = await fetch(OPENAI_EMBED_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", dimensions: 1536, input: evidenceTexts })
  });
  if (!embRes.ok) return evidenceTexts.map(() => []);
  const embData = await embRes.json();
  const results: any[][] = [];
  for (const item of embData.data) {
    const { data: rpcData } = await supabaseAdmin.rpc("match_bno_embedding", {
      query_embedding: `[${item.embedding.join(",")}]`,
      match_threshold: 0.55,
      match_count: 3,
      p_source_types: ["name", "semantic_description", "text_source"]
    });
    results.push(rpcData || []);
  }
  return results;
}

async function matchAllOeno(evidenceTexts: string[], openaiKey: string, supabaseAdmin: any): Promise<any[][]> {
  if (evidenceTexts.length === 0) return [];
  const embRes = await fetch(OPENAI_EMBED_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", dimensions: 1536, input: evidenceTexts })
  });
  if (!embRes.ok) return evidenceTexts.map(() => []);
  const embData = await embRes.json();
  const results: any[][] = [];
  for (const item of embData.data) {
    const { data: rpcData } = await supabaseAdmin.rpc("match_oeno_embedding", {
      query_embedding: `[${item.embedding.join(",")}]`,
      match_threshold: 0.50,
      match_count: 3,
      p_source_types: ["name", "semantic_description"]
    });
    results.push(rpcData || []);
  }
  return results;
}

export async function processAmbulansInternally(
  jobId: string, audio: File | null, supabaseAdmin: any,
  apiKeys: { openai: string; elevenlabs: string; anthropic: string },
  overrideTranscript?: string
) {
  const updateProgress = async (percent: number, message: string) => {
    await supabaseAdmin.from("voice_jobs").update({ progress_percent: percent, progress_message: message }).eq("id", jobId);
  };

  try {
    // ── STEP 1: ElevenLabs STT ──────────────────────────────────────
    await updateProgress(5, "Hangfelvétel előkészítése...");
    let transcript = overrideTranscript || "";
    if (!overrideTranscript) {
      if (!audio) throw new Error("Hiányzó hangfájl.");
      const fd = new FormData();
      fd.append("file", audio, audio.name || "audio.webm");
      fd.append("model_id", "scribe_v1");
      fd.append("language_code", "hu");
      fd.append("diarize", "true");
      fd.append("timestamp_granularity", "word");
      const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST", headers: { "xi-api-key": apiKeys.elevenlabs }, body: fd
      });
      if (!r.ok) throw new Error(`ElevenLabs hiba: ${await r.text()}`);
      transcript = (await r.json()).text;
    }
    await updateProgress(20, "Szöveggé alakítva. Specializált ágensek indítása...");

    // ── STEP 2: 5 Parallel Specialized Claude Agents ──────────────────────────
    const userText = `BEMENETI LEIRAT:\n\n${transcript}`;
    
    const [adminData, diagData, procData, anamnesisText, therapyData] = await Promise.all([
      callClaudeJson(ADMIN_PROMPT, userText, ADMIN_SCHEMA, apiKeys.anthropic),
      callClaudeJson(DIAGNOSES_PROMPT, userText, DIAGNOSIS_SCHEMA, apiKeys.anthropic),
      callClaudeJson(PROCEDURES_PROMPT, userText, PROCEDURE_SCHEMA, apiKeys.anthropic),
      callClaudeText(ANAMNEZIS_SYSTEM, userText, apiKeys.anthropic),
      callClaudeJson(THERAPY_SYSTEM, userText, THERAPY_SCHEMA, apiKeys.anthropic)
    ]);
    
    await updateProgress(50, "Részadatok kinyerve. BNO és OENO vektorillesztés...");

    // ── STEP 3: Vector Matchers (OpenAI Embeddings) ──────────────────────────
    const extractedDiags = diagData.diagnoses || [];
    const diagsToEmbed = extractedDiags.filter((d: any) => !d.bno10 && d.evidence?.length > 2);
    const bnoMatches = await matchAllBno(diagsToEmbed.map((d: any) => d.evidence), apiKeys.openai, supabaseAdmin);
    const enrichedDiagnoses = extractedDiags.map((d: any) => {
      if (d.bno10) return d;
      const idx = diagsToEmbed.findIndex((x: any) => x === d);
      if (idx === -1 || !bnoMatches[idx]?.length) return d;
      const top = bnoMatches[idx][0];
      return { ...d, bno10: top.code, _bno_name: top.name, confidence: Math.round(top.similarity * 100) / 100 };
    });

    const extractedProcs = procData.procedures || [];
    const procsToEmbed = extractedProcs.filter((p: any) => !p.oeno && (p.evidence || p.text_label)?.length > 2);
    const oenoMatches = await matchAllOeno(procsToEmbed.map((p: any) => p.evidence || p.text_label), apiKeys.openai, supabaseAdmin);
    const enrichedProcedures = extractedProcs.map((p: any) => {
      if (p.oeno) return p;
      const idx = procsToEmbed.findIndex((x: any) => x === p);
      if (idx === -1 || !oenoMatches[idx]?.length) return p;
      const top = oenoMatches[idx][0];
      return { ...p, oeno: top.code, text_label: top.name, confidence: Math.round(top.similarity * 100) / 100 };
    });

    await updateProgress(75, "Kódok beillesztve. Orchestrátor véglegesítése és validálása...");

    // ── STEP 4: Orchestrator Agent (Claude) ──────────────────────────────────
    const orchestratorInput = `
EREDETI LEIRAT:
${transcript}

---
AGENT 1 (Admin Mezők) kimenete:
${JSON.stringify(adminData, null, 2)}

---
AGENT 2 (Diagnózisok + BNO illesztő) kimenete:
${JSON.stringify(enrichedDiagnoses, null, 2)}

---
AGENT 3 (Beavatkozások + OENO illesztő) kimenete:
${JSON.stringify(enrichedProcedures, null, 2)}

---
AGENT 4 (Anamnézis folyószöveg) kimenete:
${anamnesisText}

---
AGENT 5 (Kezelés és Gyógyszer folyószöveg) kimenete:
${JSON.stringify(therapyData, null, 2)}
`;

    const finalData = await callClaudeJson(ORCHESTRATOR_SYSTEM, orchestratorInput, ORCHESTRATOR_SCHEMA, apiKeys.anthropic);

    await updateProgress(95, "Orchestrátor végzett. Mentés...");

    // ── STEP 5: Save result ─────────────────────────────────────────
    await supabaseAdmin.from("voice_jobs").update({
      status: "completed",
      result: finalData,
      raw_audio_text: transcript,
      progress_percent: 100,
      progress_message: "Kész! Ambuláns lap sikeresen összeállítva.",
      completed_at: new Date().toISOString()
    }).eq("id", jobId);

  } catch (err) {
    console.error(`[Job ${jobId}] Ambuláns error:`, err);
    await supabaseAdmin.from("voice_jobs").update({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      progress_percent: 0,
      progress_message: "Hiba történt a feldolgozás során.",
      completed_at: new Date().toISOString()
    }).eq("id", jobId);
  }
}
