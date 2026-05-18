import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  // Get the first patient
  const { data: patient } = await supabase.from('patients').select('id, vezeteknev, keresztnev').limit(1).single();
  if (!patient) {
    console.error('No patient found');
    return;
  }

  console.log(`Inserting mock job for ${patient.vezeteknev} ${patient.keresztnev} (${patient.id})...`);

  const mockResult = {
    pap_history: "A beteg kb. két hete kezdődő, tompa jellegű mellkasi fájdalomról számol be, amely köhögéskor és mélylégvételkor fokozódik. Korábbi betegségei között hypertonia és enyhe fokú asztma szerepel. Rendszeresen szedi a vérnyomáscsökkentőit, de a legutóbbi hetekben kihagyott pár adagot a sok munka miatt. Étvágya rendben van, testsúlya stabil. Láz, hidegrázás nem volt.",
    pap_treatments: "Fizikális vizsgálat során a mellkas kopogtatási hangja éles, nem dobos. Hallgatózva a jobb tüdőfél felett elszórtan apróhólyagos szörtyzörejek hallhatók, sípolás-búgás nem észlelhető. Szívhangok tiszták, ritmusosak, zörej nincs. Vérnyomás: 145/90 mmHg. Pulzus: 82/min.\nEKG készült, ami sinus ritmust mutat repolarizációs zavar nélkül.\nJavasolt mellkas röntgen elkészítése a pneumonia kizárása céljából.",
    pap_drugs: "1. Augmentin 1000mg filmtabletta, 2x1 (12 óránként) 7 napig.\n2. Paracetamol 500mg, szükség esetén napi 3x1 (láz és fájdalomcsillapításra).\n3. Vérnyomáscsökkentő terápiát (Coverex-AS) szigorúan folytatni kell.\nBő folyadékfogyasztás, pihenés javasolt.",
    diagnoses: [
      {
        bno10: "J1890",
        text_label: "Pneumonia, k.m.n.",
        evidence: "jobb oldali apróhólyagos szörtyzörejek, mellkasi fájdalom",
        confidence: 0.85,
        _bno_name: "Pneumonia k.m.n."
      },
      {
        bno10: "I10X0",
        text_label: "Magasvérnyomás-betegség (Esszenciális hypertonia)",
        evidence: "kórelőzményben szerepel, jelenlegi vérnyomás 145/90",
        confidence: 0.95,
        _bno_name: "Magasvérnyomás-betegség"
      }
    ],
    procedures: [
      {
        oeno: "11100",
        text_label: "Orvosi vizsgálat",
        quantity_me: 1,
        evidence: "fizikális vizsgálat",
        confidence: 0.99
      },
      {
        oeno: "85223",
        text_label: "Nyugalmi EKG",
        quantity_me: 1,
        evidence: "EKG készült",
        confidence: 0.98
      }
    ],
    fields: {
      ellatas_tipusa: "1",
      tovabbkuldes: "0",
      baleset_minositese: "00",
      beavatkozas_jellege: "V",
      labor_keres: "0",
      kepalkoto_keres: "1",
      ct_mri_pet: "0",
      keresokepesseg: "0",
      utikoltseg: "0",
      teritesi_kategoria: "01",
      fizioterapia: "0",
      veny_segedeszkoz: "0",
      veny_gyogyszer: "2",
      veny_gyogyfurdo: "0"
    },
    orchestrator_summary: "ÖSSZEFOGLALÁS: A páciens 2 hete tartó mellkasi fájdalommal és légúti tünetekkel jelentkezett. A fizikális vizsgálat során a jobb tüdőfél felett hallható szörtyzörejek alapján pneumonia gyanúja merült fel. Széles spektrumú antibiotikum (Augmentin) felírása történt. EKG eltérést nem mutatott. Mellkas röntgen javasolt.\n\nADATMINŐSÉGI FIGYELMEZTETÉS: A beutalás adatai nincsenek részletezve a diktálásban, így a 'továbbküldve' mező alapértelmezett marad."
  };

  const { data, error } = await supabase
    .from('voice_jobs')
    .insert({
      patient_id: patient.id,
      status: 'completed',
      result: mockResult,
      raw_audio_text: "A beteg kb. két hete kezdődő, tompa jellegű mellkasi fájdalomról számol be, amely köhögéskor és mélylégvételkor fokozódik. Korábbi betegségei között hypertonia és enyhe fokú asztma szerepel. Rendszeresen szedi a vérnyomáscsökkentőit, de a legutóbbi hetekben kihagyott pár adagot a sok munka miatt. Étvágya rendben van, testsúlya stabil. Láz, hidegrázás nem volt. Fizikális vizsgálat során a mellkas kopogtatási hangja éles, nem dobos. Hallgatózva a jobb tüdőfél felett elszórtan apróhólyagos szörtyzörejek hallhatók, sípolás-búgás nem észlelhető. Szívhangok tiszták, ritmusosak, zörej nincs. Vérnyomás: 145/90 mmHg. Pulzus: 82/min. EKG készült, ami sinus ritmust mutat repolarizációs zavar nélkül. Javasolt mellkas röntgen elkészítése a pneumonia kizárása céljából. Gyógyszeresen: Augmentin 1000mg filmtabletta, 2x1 7 napig. Paracetamol 500mg, szükség esetén napi 3x1. Vérnyomáscsökkentő terápiát szigorúan folytatni kell. Bő folyadékfogyasztás, pihenés javasolt."
    });

  if (error) {
    console.error('Error inserting job:', error);
  } else {
    console.log('Successfully inserted mock job.');
  }
}

main();
