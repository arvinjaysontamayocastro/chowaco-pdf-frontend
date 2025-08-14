// frontend/src/hooks/useJobStatus.ts
// Polls /status/:guid every intervalMs and returns {status, progress, error}
import { useEffect, useState } from 'react';
import axios from 'axios';

export type JobStatus = 'queued' | 'processing' | 'ready' | 'error' | 'missing';

export function useJobStatus(guid: string, intervalMs = 2500) {
  const [status, setStatus] = useState<JobStatus>('queued');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    let mounted = true;

    async function tick() {
      try {
        const res = await axios.get(`/.netlify/functions/status/${guid}`, { timeout: 5000 });
        const data = res.data || {};
        if (!mounted) return;
        setStatus(data.status || 'missing');
        setProgress(typeof data.progress === 'number' ? data.progress : 0);
        setError(data.error || null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Status request failed');
      } finally {
        timer = setTimeout(tick, intervalMs);
      }
    }

    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [guid, intervalMs]);

  return { status, progress, error };
}
