import { useRef, useState } from 'react';
import { FileText, Pill, Stethoscope, AlertCircle, CheckCircle2, ClipboardList, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { PrintableAmbulatoryChart } from './PrintableAmbulatoryChart';

interface Diagnosis {
  bno10?: string | null;
  text_label?: string | null;
  evidence?: string | null;
  confidence?: number;
  _bno_name?: string;
}
interface Procedure {
  oeno?: string | null;
  text_label?: string | null;
  quantity_me?: number | null;
  evidence?: string | null;
  confidence?: number;
}
interface AmbulansResult {
  pap_history?: string;
  pap_treatments?: string;
  pap_drugs?: string;
  diagnoses?: Diagnosis[];
  procedures?: Procedure[];
  fields?: Record<string, string>;
  validation?: { errors: any[]; warnings: any[] };
  contradictions?: any[];
  orchestrator_summary?: string;
}

interface Props {
  resultJson: AmbulansResult | null;
  patient?: any;
  job?: any;
}

const TABS = [
  { key: 'history', label: 'Anamnézis', icon: FileText },
  { key: 'treatments', label: 'Kezelések', icon: Stethoscope },
  { key: 'drugs', label: 'Gyógyszerek', icon: Pill },
  { key: 'transcription', label: 'Felvett Szöveg', icon: FileText },
] as const;

const FIELD_LABELS: Record<string, string> = {
  ellatas_tipusa: "Ellátás típusa",
  tovabbkuldes: "Továbbküldés",
  baleset_minositese: "Baleset minősítése",
  beavatkozas_jellege: "Beavatkozás jellege",
  labor_keres: "Labor kérés",
  kepalkoto_keres: "Képalkotó kérés",
  ct_mri_pet: "CT/MRI/PET",
  keresokepesseg: "Keresőképesség",
  utikoltseg: "Útiköltség térítés",
  teritesi_kategoria: "Térítési kategória",
  fizioterapia: "Fizioterápiás utalás",
  veny_segedeszkoz: "Gyógyászati segédeszköz vény",
  veny_gyogyszer: "Gyógyszer vény",
  veny_gyogyfurdo: "Gyógyfürdő vény"
};

const VALUE_MAPS: Record<string, Record<string, string>> = {
  ellatas_tipusa: {
    "1": "Első szakellátás", "2": "Visszarendelés", "3": "Szakorvosi konzílium", "4": "Elsősegélynyújtás",
    "5": "Tartósan gondozott kontroll", "6": "Szűrés", "7": "Gondozásba vétel", "8": "Gondozott beteg ellátása",
    "9": "Nappali ellátás", "K": "Soron kívüli", "T": "Telemedicinális"
  },
  tovabbkuldes: {
    "0": "Nem történt", "1": "Más járóbeteg-szakrendelésre", "2": "Háziorvosi szolgálathoz",
    "3": "Beküldő háziorvoshoz", "4": "Meghalt", "5": "Saját rendelésre visszarendelve",
    "6": "Beküldő szakrendeléshez vissza", "7": "Fekvőbeteg-gyógyintézetbe", "8": "Házi szakápolásra"
  },
  baleset_minositese: {
    "00": "Nem baleset", "11": "Munkahelyi", "16": "Eü intézményben", "20": "Foglalkozási megbetegedés",
    "21": "Közúti baleset (Gépjármű)", "22": "Közúti (Tömegközlekedés)", "31": "Háztartási",
    "32": "Sportbaleset", "34": "Állat okozta", "40": "Közterületi", "41": "Feltételezhető baleset",
    "42": "Idegenkezűség", "43": "Egyéb baleset"
  },
  beavatkozas_jellege: {
    "A": "Akut", "V": "Választott (Tervezett)", "C": "Kutatás során akut",
    "D": "Kutatás során tervezett", "K": "Kúraszerű", "R": "Meddőségi vizsgálat"
  },
  labor_keres: {
    "0": "Nem történt", "1": "Labor és kémia", "2": "Szerológia", "3": "Labor és szerológia (1+2)",
    "4": "Tenyésztés", "5": "Tenyésztés és rezisztencia", "6": "Izotóp in vitro",
    "7": "Izotóp in vivo", "8": "Vérellátótól kérve", "9": "Egyéb labor"
  },
  kepalkoto_keres: {
    "0": "Nem történt", "1": "Csak mellkas rtg", "2": "Egyéb natív rtg", "3": "Kontrasztanyagos rtg",
    "4": "Angiográfia", "5": "Többféle rtg", "6": "Angiográfia és egyéb", "7": "Ultrahang",
    "8": "Izotóp", "9": "Egyéb képalkotó"
  },
  ct_mri_pet: {
    "0": "Nem történt", "1": "CT", "2": "MRI", "3": "PET", "4": "CT+MRI+PET kombó"
  },
  keresokepesseg: {
    "0": "Nem történt elbírálás", "1": "Keresőképtelen (Táppénzre vétel)", "2": "Táppénz kontroll",
    "3": "Újbóli keresőképes", "4": "Lezárás halál miatt", "5": "Lezárás egyéb okból"
  },
  utikoltseg: {
    "0": "Nem történt", "1": "Rendelés igazolta", "2": "Utalványt állított ki", "3": "Betegszállítás rendelése"
  },
  teritesi_kategoria: {
    "01": "Magyar biztosítás alapján", "03": "Államközi szerződés alapján", "04": "Térítésköteles ellátás",
    "06": "Fekvőbeteg részére végzett", "61": "Innovatív diagnosztikai szűrés", "09": "Külföldön élő magyar",
    "0A": "Befogadott külföldi", "0D": "Menekült, menedékes", "00": "Élsportoló speciális ellátása",
    "0R": "Részleges térítés", "0X": "Várólista csökkentési többlet"
  },
  fizioterapia: {
    "0": "Nem történt", "1": "Száraz egyéni", "2": "Száraz csoportos", "3": "Nedves egyéni",
    "4": "Nedves csoportos", "5": "Száraz és nedves együttes", "6": "Elektroterápia",
    "7": "Nedves és elektromos", "8": "Fény- és klímaterápia"
  }
};

const formatValue = (key: string, val: string) => {
  if (key.startsWith("veny_")) {
    if (val === "0") return "Nem történt felírás";
    return `${val} db`;
  }
  return VALUE_MAPS[key]?.[val] || val;
};

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-red-400';
  return <span className={cn('text-xs font-mono', color)}>{pct}%</span>;
}

function TextSection({ text }: { text?: string }) {
  if (!text) return <p className="text-sm text-muted-foreground italic">Nincs adat.</p>;
  return (
    <pre className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
      {text}
    </pre>
  );
}

export function AmbulansllapReviewPanel({ resultJson, patient, job }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ambulans_Lap_${patient?.vezeteknev}_${patient?.keresztnev}`,
  });

  if (!resultJson) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <FileText className="h-6 w-6 mr-3 opacity-50" />
        <span className="text-sm font-medium">Az ambuláns lap adatai nem elérhetők.</span>
      </div>
    );
  }

  const diagnoses = resultJson.diagnoses?.filter(d => d.bno10 || d.text_label) || [];
  const procedures = resultJson.procedures?.filter(p => p.oeno || p.text_label) || [];
  const hasErrors = (resultJson.validation?.errors?.length ?? 0) > 0;
  const hasContradictions = (resultJson.contradictions?.length ?? 0) > 0;
  const fields = resultJson.fields || {};

  const transcription = job?.claude_cleaned_text || job?.raw_audio_text || "A felvett szöveg nem érhető el.";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => handlePrint()} variant="outline" size="sm" className="gap-2 shadow-sm bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
          <Printer className="h-4 w-4" />
          PDF Mentése / Nyomtatás
        </Button>
      </div>

      <div className="hidden">
        <PrintableAmbulatoryChart ref={printRef} job={job} patient={patient} />
      </div>

      {/* ── Validation warnings ── */}
      {hasErrors && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-sm flex gap-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-700 dark:text-amber-400">Érvényesítési figyelmeztetések:</span>
            <ul className="mt-2 space-y-1">
              {resultJson.validation!.errors.map((e, i) => (
                <li key={i} className="text-amber-900/80 dark:text-amber-200/80 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                  <span><span className="font-medium">{e.field}:</span> {e.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Contradictions ── */}
      {hasContradictions && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 shadow-sm animate-in fade-in">
          <h4 className="text-base font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            Észlelt Ellentmondások a Diktálásban
          </h4>
          <div className="space-y-4">
            {resultJson.contradictions!.map((c, i) => (
              <div key={i} className="bg-background/80 backdrop-blur-sm rounded-lg border border-rose-500/20 p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eredeti állítás</p>
                    <p className="text-foreground text-sm font-medium">{c.statement}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ezzel mond ellent</p>
                    <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">{c.contradicted_by}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-rose-500/10">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Orvosi Kiértékelés</p>
                  <p className="text-foreground/80 text-sm italic">{c.medical_assessment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Orvosi Dokumentáció ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Klinikai Szövegek</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Anamnézis */}
          <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-background via-muted/10 to-muted/30 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Anamnézis
            </h4>
            <TextSection text={resultJson.pap_history} />
          </div>
          
          {/* Kezelések */}
          <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-background via-muted/10 to-muted/30 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Kezelések
            </h4>
            <TextSection text={resultJson.pap_treatments} />
          </div>
          
          {/* Gyógyszerek */}
          <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-background via-muted/10 to-muted/30 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4" /> Gyógyszerek
            </h4>
            <TextSection text={resultJson.pap_drugs} />
          </div>
          
          {/* Felvett Szöveg */}
          <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-background via-muted/10 to-muted/30 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Felvett Szöveg (Diktálás)
            </h4>
            <TextSection text={transcription} />
          </div>
        </div>
      </div>

      {/* ── Diagnózisok és Beavatkozások ── */}
      <div className="space-y-6 pt-6 mt-6 border-t border-border/50">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Diagnózisok és Beavatkozások</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagnózisok */}
          <div className="space-y-3 bg-card/40 backdrop-blur-sm rounded-xl p-5 border border-border/50 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Diagnózisok (BNO)
            </h4>
            {diagnoses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 mt-3">
                {diagnoses.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background/50 border border-border/40 shadow-sm">
                    <div className="flex items-start gap-3 min-w-0">
                      {d.bno10 ? (
                        <Badge variant="outline" className="font-mono text-sm shrink-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5">
                          {d.bno10}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs shrink-0 border-red-500/40 text-red-500 bg-red-500/10 px-2 py-0.5">
                          HIÁNYZÓ BNO
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{d._bno_name || d.text_label || '—'}</p>
                        {d.evidence && <p className="text-xs text-muted-foreground mt-1 bg-muted/30 px-2 py-1 rounded-md inline-block">{d.evidence}</p>}
                      </div>
                    </div>
                    <ConfidenceBadge value={d.confidence} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mt-3">Nincs rögzített diagnózis.</p>
            )}
          </div>

          {/* Beavatkozások */}
          <div className="space-y-3 bg-card/40 backdrop-blur-sm rounded-xl p-5 border border-border/50 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
              <Pill className="h-4 w-4 text-blue-500" />
              Beavatkozások (OENO)
            </h4>
            {procedures.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 mt-3">
                {procedures.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background/50 border border-border/40 shadow-sm">
                    <div className="flex items-start gap-3 min-w-0">
                      {p.oeno ? (
                        <Badge variant="outline" className="font-mono text-sm shrink-0 border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5">
                          {p.oeno}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs shrink-0 border-red-500/40 text-red-500 bg-red-500/10 px-2 py-0.5">
                          HIÁNYZÓ OENO
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.text_label || '—'}</p>
                        {p.quantity_me != null && (
                          <p className="text-xs text-muted-foreground mt-1">Mennyiség: <span className="font-medium text-foreground/80">{p.quantity_me}</span></p>
                        )}
                      </div>
                    </div>
                    <ConfidenceBadge value={p.confidence} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mt-3">Nincs rögzített beavatkozás.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── NEAK Adminisztráció ── */}
      <div className="space-y-6 pt-6 mt-6 border-t border-border/50">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-foreground">NEAK Adminisztráció</h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border/40 bg-background/50 shadow-sm overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Beteg és Alapadatok (NEAK 1-21)</h4>
            </div>
            <div className="p-5 grid grid-cols-1 gap-y-1.5 text-sm font-mono">
              <NEAKRow num="1" label="Javítás" val="0" />
              <NEAKRow num="5" label="Naplósorszám" val="Nincs megadva" />
              <NEAKRow num="6" label="Rendelő neve" val="ClinicNote Rendszer" />
              <NEAKRow num="11" label="Ellátó orvos kódja" val="Nincs megadva" />
              <NEAKRow num="12" label="Biztosítás országa" val="HU" />
              <NEAKRow num="13" label="TAJ szám" val={patient?.taj_szam || "Nincs megadva"} />
              <NEAKRow num="15" label="Beteg neve" val={patient ? `${patient.titulus ? patient.titulus+' ' : ''}${patient.vezeteknev} ${patient.keresztnev}` : "Nincs megadva"} />
              <NEAKRow num="16" label="Születési dátum" val={patient?.szuletesi_ido || "Nincs megadva"} />
              <NEAKRow num="19" label="Lakcím" val={patient ? `${patient.iranyitoszam || ''} ${patient.varos || ''}, ${patient.utca_hazszam || ''}`.trim() || "Nincs megadva" : "Nincs megadva"} />
              <NEAKRow num="20" label="Kezelés ideje" val={job?.created_at ? new Date(job.created_at).toLocaleString('hu-HU') : "Nincs megadva"} />
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/50 shadow-sm overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ellátás és Vizsgálatok (NEAK 22-36)</h4>
            </div>
            <div className="p-5 grid grid-cols-1 gap-y-1.5 text-sm font-mono">
              <NEAKRow num="10" label="Térítési kategória" val={formatValue('teritesi_kategoria', fields.teritesi_kategoria || '01')} />
              <NEAKRow num="22" label="Ellátás típusa" val={formatValue('ellatas_tipusa', fields.ellatas_tipusa || '1')} />
              <NEAKRow num="23" label="Továbbküldés" val={formatValue('tovabbkuldes', fields.tovabbkuldes || '0')} />
              <NEAKRow num="24" label="Baleset minősítése" val={formatValue('baleset_minositese', fields.baleset_minositese || '00')} />
              <NEAKRow num="27/A" label="Beavatkozás jellege" val={formatValue('beavatkozas_jellege', fields.beavatkozas_jellege || 'V')} />
              <NEAKRow num="28" label="Labor kérés" val={formatValue('labor_keres', fields.labor_keres || '0')} />
              <NEAKRow num="29" label="Képalkotó kérés" val={formatValue('kepalkoto_keres', fields.kepalkoto_keres || '0')} />
              <NEAKRow num="31" label="Fizioterápiára utalás" val={formatValue('fizioterapia', fields.fizioterapia || '0')} />
              <NEAKRow num="33" label="Keresőképesség" val={formatValue('keresokepesseg', fields.keresokepesseg || '0')} />
              <NEAKRow num="35" label="Felírt vények száma" val={formatValue('veny_gyogyszer', fields.veny_gyogyszer || '0')} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Orchestrator Összefoglaló ── */}
      {resultJson.orchestrator_summary && (
        <div className="space-y-6 pt-6 mt-6 border-t border-border/50">
          <div className="flex items-center gap-3 pb-2 border-b border-indigo-500/30">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-300">Orchestrator Összefoglaló</h3>
          </div>
          <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap shadow-inner">
            {resultJson.orchestrator_summary}
          </div>
        </div>
      )}

    </div>
  );
}

function NEAKRow({ num, label, val }: { num: string, label: string, val: string }) {
  return (
    <div className="flex items-start py-2 border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors rounded-sm px-2">
      <span className="w-8 shrink-0 text-muted-foreground opacity-60 text-xs mt-0.5 font-bold">{num}.</span>
      <span className="w-48 lg:w-56 shrink-0 text-foreground/80 pr-3 leading-tight">{label}:</span>
      <span className={cn(
        "flex-1 break-words font-medium leading-tight",
        val === "-" || val === "Nincs megadva" ? "text-muted-foreground/40 italic font-normal" : "text-foreground"
      )}>
        {val}
      </span>
    </div>
  );
}
