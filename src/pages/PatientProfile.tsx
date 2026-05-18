import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, Phone, Activity, FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/useToastMessage';
import { VoiceRecordingPanel } from '@/components/VoiceRecordingPanel';
import { useAmbulatoryCharts } from '@/hooks/useAmbulatoryCharts';
import { AmbulansllapReviewPanel } from '@/components/AmbulansllapReviewPanel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NEAK_DECODE = {
  ellatas: { '1': 'Első szakellátás', '2': 'Visszarendelés', '3': 'Konzílium', '4': 'Elsősegély' },
  tovabbkuldes: { '0': 'Nem történt', '1': 'Más szakrendelésre', '2': 'Háziorvoshoz', '7': 'Fekvőbeteg-intézetbe' },
  baleset: { '00': 'Nem baleset', '11': 'Munkahelyi', '21': 'Közúti', '31': 'Háztartási', '32': 'Sport' },
  labor: { '0': 'Nem', '1': 'Kémiai labor', '4': 'Tenyésztés' },
  kepalkoto: { '0': 'Nem', '1': 'Mellkas RTG', '2': 'RTG', '7': 'Ultrahang' },
  kereso: { '0': 'Nem', '1': 'Táppénzre vétel', '2': 'Táppénz kontroll' },
} as any;

function NEAKBadge({ label, value, map }: { label: string, value: string | null, map: any }) {
  if (!value || value === '0' || value === '00') return null; // Default values ignored for display
  const translated = map[value] || value;
  return (
    <Badge variant="outline" className="bg-secondary/20">
      <span className="opacity-70 mr-1">{label}:</span> {translated}
    </Badge>
  );
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHistoryJobId, setSelectedHistoryJobId] = useState<string | null>(null);
  
  const { jobs, pollJob, fetchJobs } = useAmbulatoryCharts(id);

  useEffect(() => {
    async function fetchPatient() {
      if (!id) return;
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error) {
        toast.error('Hiba a páciens betöltésekor');
      } else {
        setPatient(data);
      }
      setLoading(false);
    }
    fetchPatient();
  }, [id]);

  useEffect(() => {
    // Polling active jobs
    const activeJobs = jobs.filter(j => j.status === 'processing');
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      activeJobs.forEach(job => pollJob(job.id));
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs, pollJob]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Betöltés...</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center text-destructive">A páciens nem található.</div>;
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Back button and Hero Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="-ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Vissza a páciensekhez
        </Button>
        
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-md shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <User className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
            </div>
            
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {patient.titulus ? `${patient.titulus} ` : ''}{patient.vezeteknev} {patient.keresztnev}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {patient.taj_szam && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-2.5 py-0.5">
                    TAJ: <span className="ml-1 font-mono">{patient.taj_szam}</span>
                  </Badge>
                )}
                {patient.szuletesi_ido && (
                  <div className="flex items-center text-muted-foreground bg-muted/30 px-2.5 py-0.5 rounded-full border border-border/50">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    <span>{patient.szuletesi_ido}</span>
                  </div>
                )}
                {patient.telefon_1_hivoszam && (
                  <div className="flex items-center text-muted-foreground bg-muted/30 px-2.5 py-0.5 rounded-full border border-border/50">
                    <Phone className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    <span>+{patient.telefon_1_orszagkod} {patient.telefon_1_korzet} {patient.telefon_1_hivoszam}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Voice Recorder & History */}
        <div className="space-y-6 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-6 space-y-6">
            {/* Voice Recorder */}
            <VoiceRecordingPanel 
              patientId={patient.id} 
              onJobStarted={() => fetchJobs()} 
            />

            {/* History List */}
            {jobs.length > 0 && (
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Előzmények
                    <Badge variant="secondary" className="ml-auto text-xs bg-background/50">{jobs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-400px)] overflow-y-auto p-2 space-y-1">
                    {jobs.map(job => {
                      const isSelected = (selectedHistoryJobId === job.id) || (!selectedHistoryJobId && job === jobs[0]);
                      const dt = new Date(job.created_at);
                      return (
                        <button
                          key={job.id}
                          onClick={() => setSelectedHistoryJobId(job.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden",
                            isSelected 
                              ? "bg-primary/10 border-primary/30 shadow-sm" 
                              : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                          )}
                          <div className="flex items-center gap-2 mb-1.5 pl-1">
                            <Calendar className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground/70")} />
                            <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-foreground/80")}>
                              {dt.toLocaleDateString('hu-HU', {month: 'short', day: 'numeric'})} {dt.toLocaleTimeString('hu-HU', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {job === jobs[0] && !isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />
                            )}
                          </div>
                          <div className="text-xs pl-1 truncate text-muted-foreground/90 group-hover:text-foreground transition-colors">
                            {job.status === 'processing' ? 'Feldolgozás alatt...' : (job.result?.diagnoses?.[0]?.text_label || "Ismeretlen diagnózis")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Ambulatory Charts Main Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {jobs.length === 0 ? (
            <Card className="bg-muted/10 border-dashed border-2 h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center max-w-sm">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 opacity-40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground/80 mb-2">Nincs rögzített adat</h3>
                <p className="text-sm">Használja a bal oldali felvevőt egy új vizsgálat indításához, amely automatikusan generálja az ambuláns lapot.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              {(() => {
                const activeJob = jobs.find(j => j.id === selectedHistoryJobId) || jobs[0];
                return <JobCard job={activeJob} patient={patient} />;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, patient }: { job: any, patient: any }) {
  if (job.status === 'processing') {
    return (
      <Card className="border-primary/30 bg-primary/5 shadow-md backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <span className="font-medium text-lg text-primary">A hangfelvétel feldolgozása folyamatban...</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-2 max-w-sm mx-auto overflow-hidden">
            <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${job.progress_percent || 0}%` }}></div>
          </div>
          <p className="text-sm text-primary/70">{job.progress_message}</p>
        </CardContent>
      </Card>
    );
  }

  if (job.status === 'error') {
    return (
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <div className="font-bold text-lg mb-2">Hiba történt a feldolgozás során</div>
          <div className="text-sm opacity-80 max-w-md mx-auto bg-destructive/10 p-3 rounded-md">{job.error || 'Ismeretlen hiba'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-card/60 backdrop-blur-md border border-border/60 rounded-2xl p-0 shadow-sm relative overflow-hidden">
      <div className="bg-gradient-to-r from-muted/50 to-transparent px-6 py-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ambuláns Lap
          </h2>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(job.created_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {job.result?.fields && Object.keys(job.result.fields).length > 0 && (
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {job.result.fields.beavatkozas_jellege === 'A' && <Badge variant="destructive" className="shadow-sm px-2.5">Akut Ellátás</Badge>}
            <Badge variant="outline" className="bg-background shadow-sm px-2.5">{NEAK_DECODE.ellatas[job.result.fields.ellatas_tipusa] || 'Szakellátás'}</Badge>
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-6">
        <AmbulansllapReviewPanel resultJson={job.result} patient={patient} job={job} />
      </div>
    </div>
  );
}
