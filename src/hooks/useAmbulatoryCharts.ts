import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AmbulatoryJob {
  id: string;
  status: 'processing' | 'completed' | 'error';
  audio_path: string | null;
  raw_audio_text: string | null;
  claude_cleaned_text: string | null;
  result: any;
  error: string | null;
  progress_percent: number;
  progress_message: string | null;
  created_at: string;
}

export function useAmbulatoryCharts(patientId?: string) {
  const [jobs, setJobs] = useState<AmbulatoryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('voice_jobs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
      
    const { data, error } = await query;
    
    if (data && !error) {
      setJobs(data as AmbulatoryJob[]);
    }
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const pollJob = useCallback(async (jobId: string): Promise<AmbulatoryJob | null> => {
    const { data, error } = await supabase
      .from('voice_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !data) return null;
    
    // Update local state to reflect progress, and add if it's new
    setJobs(current => {
      const exists = current.some(j => j.id === jobId);
      if (exists) {
        return current.map(j => j.id === jobId ? data as AmbulatoryJob : j);
      }
      return [data as AmbulatoryJob, ...current];
    });
    return data as AmbulatoryJob;
  }, []);

  return { jobs, isLoading, fetchJobs, pollJob };
}
