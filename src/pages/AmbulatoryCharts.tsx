import { useState } from 'react';
import { VoiceRecordingPanel } from '@/components/VoiceRecordingPanel';
import { AmbulansllapReviewPanel } from '@/components/AmbulansllapReviewPanel';
import { useAmbulatoryCharts } from '@/hooks/useAmbulatoryCharts';
import { Loader2, RefreshCcw } from 'lucide-react';

export default function AmbulatoryCharts() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { jobs, isLoading, pollJob } = useAmbulatoryCharts();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ambuláns Lap Generálás</h1>
      </div>

      <VoiceRecordingPanel 
        onJobStarted={(jobId) => {
          setSelectedJobId(jobId);
          // fetch it immediately so it appears in the list
          pollJob(jobId);
          // start polling
          const interval = setInterval(async () => {
            const updated = await pollJob(jobId);
            if (updated && updated.status !== 'processing') {
              clearInterval(interval);
            }
          }, 3000);
        }}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Korábbi Ambuláns Lapok</h2>
        
        {isLoading && <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
        
        {!isLoading && jobs.length === 0 && (
          <div className="py-12 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
            Még nincsenek generált ambuláns lapok.
          </div>
        )}

        <div className="grid gap-4">
          {jobs.map(job => (
            <div 
              key={job.id} 
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedJobId === job.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'bg-card hover:bg-muted/30'}`}
              onClick={() => setSelectedJobId(job.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">
                  {new Date(job.created_at).toLocaleString('hu-HU')}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                  job.status === 'error' ? 'bg-red-500/10 text-red-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {job.status === 'completed' ? 'Kész' : job.status === 'error' ? 'Hiba' : 'Feldolgozás...'}
                </span>
              </div>
              
              {selectedJobId === job.id && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  {job.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <RefreshCcw className="w-8 h-8 animate-spin mb-4 opacity-50" />
                      <p>Hangfelvétel feldolgozása folyamatban...</p>
                      {job.progress_message && <p className="text-xs mt-2 opacity-70">{job.progress_message}</p>}
                    </div>
                  ) : job.status === 'completed' && job.result ? (
                    <AmbulansllapReviewPanel resultJson={job.result} />
                  ) : job.status === 'error' ? (
                    <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">
                      {job.error || 'Ismeretlen hiba történt a feldolgozás során.'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
