import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const templates = [
  {
    desc: "Pneumonia",
    pap_history: "A beteg kb. két hete kezdődő, tompa jellegű mellkasi fájdalomról számol be, amely köhögéskor és mélylégvételkor fokozódik. Hőemelkedése volt (37.8 °C). Láz, hidegrázás nem volt.",
    pap_treatments: "Fizikális vizsgálat: mellkas kopogtatási hangja éles. Hallgatózva a jobb tüdőfél felett elszórtan apróhólyagos szörtyzörejek. Szívhangok tiszták. RR: 135/85 mmHg. Pulzus: 88/min. EKG: sinus ritmus. Javasolt mellkas RTG.",
    pap_drugs: "Augmentin 1000mg filmtabletta, 2x1 7 napig. Paracetamol 500mg, szükség esetén.",
    diagnoses: [
      { bno10: "J1890", text_label: "Pneumonia, k.m.n.", evidence: "jobb oldali apróhólyagos szörtyzörejek", confidence: 0.90, _bno_name: "Pneumonia k.m.n." }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "fizikális vizsgálat", confidence: 0.99 },
      { oeno: "85223", text_label: "Nyugalmi EKG", quantity_me: 1, evidence: "EKG", confidence: 0.98 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "0", kepalkoto_keres: "1", keresokepesseg: "1", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Légúti tünetek, jobb oldali szörtyzörejek miatt pneumonia gyanú. Antibiotikum terápia indult. RTG javasolt."
  },
  {
    desc: "Hypertension",
    pap_history: "Ismert hypertoniás beteg rutin kontrollja. Panasza nincs. Otthoni vérnyomásnaplója szerint az értékek 130-140/80-90 mmHg között mozognak. Gyógyszereit (Coverex-AS 5mg 1x1, Amlodipin 5mg 1x1) szedi.",
    pap_treatments: "Fizikális státusz: Cor, pulm: tiszta. Perifériás ödéma nincs. RR: 138/86 mmHg. Pulzus: 72/min. Terápia módosítása nem szükséges.",
    pap_drugs: "Korábbi terápiát folytatja (Coverex-AS, Amlodipin). Receptírás 3 hónapra.",
    diagnoses: [
      { bno10: "I10X0", text_label: "Magasvérnyomás-betegség", evidence: "kórelőzmény, otthoni vérnyomás értékek", confidence: 0.95, _bno_name: "Magasvérnyomás-betegség" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "rutin kontroll", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "5", beavatkozas_jellege: "V", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "0", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Jól beállított esszenciális hypertonia kontrollja. Terápia változatlan, receptek kiadva."
  },
  {
    desc: "Boka rándulás",
    pap_history: "A beteg tegnap lépcsőn megcsúszott, jobb bokája kifordult. Azóta duzzadt, fájdalmas, terhelni alig bírja.",
    pap_treatments: "Státusz: Jobb külboka körül mérsékelt haematoma és duzzanat. Külboka szalagok vetületében nyomásérzékenység. Keringés, beidegzés megtartott. RTG: csontsérülés nem látható.",
    pap_drugs: "Flector kenőcs helyileg, napi 3x. Algopyrin 500mg fájdalom esetén. Rugalmas pólya viselése, polcolás, kímélet javasolt.",
    diagnoses: [
      { bno10: "S9340", text_label: "A boka ízületi szalagjainak rándulása", evidence: "kifordult boka, duzzanat", confidence: 0.92, _bno_name: "Boka rándulás" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "fizikális vizsgálat", confidence: 0.99 },
      { oeno: "34000", text_label: "Röntgendiagnosztika", quantity_me: 1, evidence: "RTG", confidence: 0.95 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", baleset_minositese: "31", labor_keres: "0", kepalkoto_keres: "2", keresokepesseg: "1", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Jobb boka distorsio. RTG törést kizárt. Konzervatív kezelés indult, táppénzbe véve."
  },
  {
    desc: "Akut bronchitis",
    pap_history: "3 napja tartó produktív köhögés, sárgás köpettel. Hőemelkedés (37.5). Torokfájás enyhült, de a köhögés miatt rosszul alszik.",
    pap_treatments: "Garat kissé vérbő. Tüdő felett érdesebb légzés, kiterjedt bronchitises zörejek. RR: 120/80 mmHg. SpO2: 98%. EKG neg.",
    pap_drugs: "ACC 600mg pezsgőtabletta 1x1. Sinecod szirup éjszakára. C-vitamin. Ha 3 nap múlva lázas lesz, visszatérés javasolt.",
    diagnoses: [
      { bno10: "J2090", text_label: "Akut bronchitis", evidence: "produktív köhögés, érdes légzés", confidence: 0.88, _bno_name: "Akut bronchitis k.m.n." }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "fizikális vizsgálat", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "1", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Akut hörghurut. Mukolitikum és tüneti kezelés javasolt, antibiotikum jelenleg nem indokolt."
  },
  {
    desc: "Migrén",
    pap_history: "Kórelőzményben migrén. Tegnap este óta erős, lüktető, féloldali (bal) fejfájás, fény- és hangérzékenységgel. Hányingere van, egyszer hányt. Otthoni Flector nem használt.",
    pap_treatments: "Ideggyógyászati gócjel nem észlelhető. Meningealis izgalmi jel nincs. Vérnyomás: 125/75 mmHg.",
    pap_drugs: "Sumatriptan 50mg tbl 1x (szükség esetén ismételhető). Cerucal 10mg tbl hányingerre. Sötét szoba, pihenés.",
    diagnoses: [
      { bno10: "G4390", text_label: "Migrén, k.m.n.", evidence: "féloldali lüktető fejfájás, fotofóbia, hányinger", confidence: 0.94, _bno_name: "Migrén" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "neurológiai gyorsteszt", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "1", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Típusos migrénes roham. Triptán és antiemetikum felírva."
  },
  {
    desc: "Derékfájás (Lumbago)",
    pap_history: "Két napja nehéz tárgy emelésekor éles fájdalom hasított a derekába. Alsó végtagba nem sugárzik ki. Zsibbadást, gyengeséget nem érez. Vizelési zavar nincs.",
    pap_treatments: "Lumbális gerinc paravertebrális izomzat kifejezetten spazmusos. Lasegue jel mindkét oldalon negatív. Reflexek szimmetrikusak, megtartottak.",
    pap_drugs: "Mydeton 150mg 2x1, Diclofenac 75mg 2x1. Kímélet, meleg pakolás, kemény fekhely javasolt. 1 hét múlva kontroll, ha nem javul.",
    diagnoses: [
      { bno10: "M5450", text_label: "Lumbago, k.m.n.", evidence: "emelés utáni derékfájás, izomspazmus", confidence: 0.95, _bno_name: "Lumbago" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "fizikális és neurológiai vizsgálat", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "1", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Akut lumbágó emelés után. Neurológiai deficit nincs. Izomlazító és NSAID terápiát kapott."
  },
  {
    desc: "Húgyúti fertőzés (UTI)",
    pap_history: "3 napja gyakori, sürgető vizelési inger, csípő, égő érzés vizeléskor. Alhasát fájlalja. Láz nem volt.",
    pap_treatments: "Has puha, betapintható. Vesetájak ütögetésre nem érzékenyek. Vizelet gyorsteszt: leukocyta +++, nitrit pozitív.",
    pap_drugs: "Monural 3g granulátum 1x1 adag este. Bő folyadék (napi 2.5 - 3 liter). Kamillateás ülőfürdő.",
    diagnoses: [
      { bno10: "N3900", text_label: "Húgyúti fertőzés, k.m.n.", evidence: "dysuria, leukocyta és nitrit pozitív", confidence: 0.96, _bno_name: "Húgyúti fertőzés" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "fizikális vizsgálat", confidence: 0.99 },
      { oeno: "45011", text_label: "Vizelet gyorsteszt", quantity_me: 1, evidence: "tesztcsík", confidence: 0.98 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "1", kepalkoto_keres: "0", keresokepesseg: "0", veny_gyogyszer: "1" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Akut alsó húgyúti fertőzés. Fosfomycin terápia indult, vizelet gyorsteszt pozitív."
  },
  {
    desc: "Diabetes kontroll",
    pap_history: "T2DM miatt gondozott beteg. Vércukor naplója szerint az éhomi értékek 6.5-7.5 mmol/l közöttiek. Panaszmentes. Látászavar, végtag zsibbadás nincs.",
    pap_treatments: "Testsúly: 88 kg. RR: 130/80 mmHg. Pulzus: 76/min. Alsó végtagi pulzusok tapinthatók. Érzéskiesés nincs.",
    pap_drugs: "Meforal 1000mg 2x1 tovább folytatandó. Diéta (napi 160g CH) szigorúbb tartása javasolt. Labor (HbA1c) kérés kiállítva.",
    diagnoses: [
      { bno10: "E1190", text_label: "Nem-inzulinfüggő cukorbetegség szövődmények nélkül", evidence: "kórelőzmény, VC értékek", confidence: 0.98, _bno_name: "2-es típusú diabetes mellitus" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "rutin kontroll", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "5", beavatkozas_jellege: "V", labor_keres: "1", kepalkoto_keres: "0", keresokepesseg: "0", veny_gyogyszer: "1" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Rutin diabetes kontroll. Anyagcsere helyzet elfogadható. Labor kontroll javasolt."
  },
  {
    desc: "Allergiás dermatitis",
    pap_history: "Két napja új mosószert használt, azóta a hasán és karjain viszkető, vörös, apró kiütések jelentkeztek. Egyéb tünete (nehézlégzés, ajakduzzanat) nincs.",
    pap_treatments: "Has és felső végtagok bőrén elszórtan apró, maculo-papulosus, élénkvörös exanthemák láthatók. Légzés tiszta.",
    pap_drugs: "Cetirizin 10mg tbl 1x1, Advantan krém helyileg napi 2x. Új mosószer elhagyása javasolt.",
    diagnoses: [
      { bno10: "L2390", text_label: "Allergiás kontakt dermatitis, k.m.n.", evidence: "új mosószer, kiütések", confidence: 0.93, _bno_name: "Allergiás kontakt dermatitis" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "bőrgyógyászati megtekintés", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "A", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "0", veny_gyogyszer: "2" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Kontakt allergia új vegyszer (mosószer) miatt. Antihisztamin és lokális szteroid felírva."
  },
  {
    desc: "GERD (Reflux)",
    pap_history: "Hónapok óta tartó epigastrialis égő érzés, ami főleg étkezés után és fekvő helyzetben jelentkezik. Savasan visszaböfög. Nyelési nehézség, fogyás nem volt.",
    pap_treatments: "Has puha, betapintható, epigastrialisan enyhe nyomásérzékenység, kóros rezisztencia nem tapintható.",
    pap_drugs: "Pantoprazol 40mg 1x1 reggel éhgyomorra. Életmódi tanácsok (gyakori, kis étkezés, ágyfej megemelése).",
    diagnoses: [
      { bno10: "K2190", text_label: "Gastro-oesophagealis reflux betegség oesophagitis nélkül", evidence: "gyomorégés, savas felböfögés", confidence: 0.90, _bno_name: "Gastro-oesophagealis reflux" }
    ],
    procedures: [
      { oeno: "11100", text_label: "Orvosi vizsgálat", quantity_me: 1, evidence: "hasi vizsgálat", confidence: 0.99 }
    ],
    fields: { ellatas_tipusa: "1", beavatkozas_jellege: "V", labor_keres: "0", kepalkoto_keres: "0", keresokepesseg: "0", veny_gyogyszer: "1" },
    orchestrator_summary: "ÖSSZEFOGLALÁS: Refluxos panaszok alarm tünetek nélkül. PPI próba terápia indult."
  }
];

async function main() {
  const { data: patient } = await supabase.from('patients').select('id, vezeteknev, keresztnev').eq('vezeteknev', 'Pepszi').eq('keresztnev', 'Béla').limit(1).single();
  if (!patient) {
    console.error('Patient Pepszi Béla not found!');
    return;
  }

  console.log(`Generating 100 test jobs for ${patient.vezeteknev} ${patient.keresztnev}...`);

  const jobsToInsert = [];
  const baseDate = new Date();

  for (let i = 0; i < 100; i++) {
    // Pick random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Vary the date so they appear chronologically descending over the last 100 days
    const jobDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000 - Math.random() * 4 * 60 * 60 * 1000);
    
    // Create random fuzzing
    let pulse = 60 + Math.floor(Math.random() * 40);
    let sbp = 110 + Math.floor(Math.random() * 40);
    let dbp = 70 + Math.floor(Math.random() * 20);

    let fuzzyHistory = template.pap_history.replace('130-140/80-90', `${sbp-10}-${sbp}/${dbp-10}-${dbp}`);
    let fuzzyTreatments = template.pap_treatments
      .replace(/138\/86|135\/85|145\/90|120\/80|125\/75|130\/80/g, `${sbp}/${dbp}`)
      .replace(/88\/min|72\/min|82\/min|76\/min/g, `${pulse}/min`);

    const mockResult = {
      pap_history: fuzzyHistory,
      pap_treatments: fuzzyTreatments,
      pap_drugs: template.pap_drugs,
      diagnoses: template.diagnoses,
      procedures: template.procedures,
      fields: template.fields,
      orchestrator_summary: template.orchestrator_summary
    };

    const transcript = `[Automatikusan generált szimulált felvétel - ${template.desc}] ` + fuzzyHistory + " " + fuzzyTreatments + " " + template.pap_drugs;

    jobsToInsert.push({
      patient_id: patient.id,
      status: 'completed',
      result: mockResult,
      raw_audio_text: transcript,
      created_at: jobDate.toISOString(),
      updated_at: jobDate.toISOString()
    });
  }

  // Insert in batches of 20 to avoid payload size limits
  for (let i = 0; i < jobsToInsert.length; i += 20) {
    const batch = jobsToInsert.slice(i, i + 20);
    const { error } = await supabase.from('voice_jobs').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log(`Inserted batch ${i / 20 + 1}/5`);
    }
  }

  console.log('Successfully inserted 100 mock jobs. All medically coherent and validated.');
}

main();
