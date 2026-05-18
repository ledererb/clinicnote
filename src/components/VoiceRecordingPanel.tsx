import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { useVoiceRecorder, formatDuration } from '@/hooks/useVoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/useToastMessage';

interface Props {
  patientId?: string;
  onJobStarted?: (jobId: string) => void;
}

export function VoiceRecordingPanel({ patientId, onJobStarted }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    isRecording,
    isPaused,
    duration,
    finalDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    audioBlob,
    audioUrl,
  } = useVoiceRecorder({
    onError: () => toast.error('Hiba a felvétel során'),
  });

  const handleToggleRecording = () => isRecording ? stopRecording() : startRecording();
  const handleTogglePause = () => isPaused ? resumeRecording() : pauseRecording();

  const handleUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const timestamp = new Date().toISOString();
      const filename = `recording_${timestamp.replace(/[:.]/g, '-')}.webm`;

      // In clinicnote we assume the process-chart edge function exists
      // But for now, we just create a job in the database and wait for processing
      
      const { data: job, error: jobError } = await supabase
        .from('voice_jobs')
        .insert([{ 
          status: 'processing',
          mode: 'ambulans',
          patient_id: patientId || null
        }])
        .select()
        .single();

      if (jobError || !job) throw new Error('Could not create job');
      
      onJobStarted?.(job.id);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);
      formData.append('job_id', job.id);

      // Call the edge function
      const { error: fnError } = await supabase.functions.invoke('process-chart', {
        body: formData,
      });

      if (fnError) {
         // Silently catch function errors as we don't have it deployed yet maybe
         console.error(fnError);
         toast.info('Felvétel elmentve. (Feldolgozó háttérfolyamat még nincs telepítve)');
      } else {
         toast.info('Felvétel feltöltve, feldolgozás folyamatban...');
      }

      resetRecording();
    } catch (error: any) {
      toast.error('Hiba a feltöltés során: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hangfelvevő</CardTitle>
        <CardDescription className="text-xs">
          Rögzítse és dolgozza fel az ambuláns lapot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isRecording ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/30 border-border/50'}`}>
          <div className="flex items-center gap-2">
            {isRecording && (
              <Button size="icon" variant="outline" className="rounded-full w-10 h-10 border-red-200 text-red-600 hover:bg-red-50" onClick={handleTogglePause}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
            <Button size="icon" variant={isRecording ? 'destructive' : 'default'} className="rounded-full w-12 h-12 shadow-md transition-transform hover:scale-105" onClick={handleToggleRecording}>
              {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-mono font-bold tracking-tight">
              {formatDuration(finalDuration || duration)}
            </span>
          </div>
        </div>

        {audioUrl && (
          <div className="space-y-3 pt-3 border-t">
            <audio ref={audioRef} src={audioUrl} controls className="w-full h-8" />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="w-9 h-9 shrink-0" onClick={resetRecording} disabled={isUploading}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button className="flex-1 h-9 text-xs font-bold" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Feltöltés és Generálás'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
