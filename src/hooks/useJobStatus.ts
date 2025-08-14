// frontend/src/hooks/useJobStatus.ts
// Polls /status/:guid every intervalMs and returns {status, progress, error}
// Enhancements: stop on terminal states, 404→missing, backoff on errors, pause when hidden, configurable basePath.

import { useEffect, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';

export type JobStatus = 'queued' | 'processing' | 'ready' | 'error' | 'missing';

type Options = {
  intervalMs?: number; // base poll interval
  basePath?: string; // defaults to '/.netlify/functions'
  onReady?: () => void; // optional callback when job becomes ready
};

export function useJobStatus(guid: string, intervalMs = 2500) {
  // Backward-compatible wrapper
  return useJobStatusEx(guid, { intervalMs });
}

export function useJobStatusEx(
  guid: string,
  { intervalMs = 2500, basePath = '/.netlify/functions', onReady }: Options = {}
) {
  const [status, setStatus] = useState<JobStatus>('queued');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const stoppedRef = useRef(false);
  const backoffRef = useRef(intervalMs); // start at base interval
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stoppedRef.current = false;
    backoffRef.current = intervalMs;
    setError(null);

    const endpoint = `${basePath}/status/${guid}`;

    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const schedule = (ms: number) => {
      clear();
      if (stoppedRef.current) return;
      timerRef.current = setTimeout(tick, ms);
    };

    const onVisibility = () => {
      // When hidden, poll slower; when visible, reset to base
      backoffRef.current =
        document.visibilityState === 'hidden'
          ? Math.max(intervalMs * 4, 5000)
          : intervalMs;
      // If we just became visible, kick an immediate refresh
      if (document.visibilityState === 'visible') schedule(0);
    };

    async function tick() {
      if (stoppedRef.current) return;

      try {
        const res = await axios.get(endpoint, {
          timeout: 5000,
          validateStatus: () => true,
        });
        if (res.status === 404) {
          setStatus('missing');
          setProgress(0);
          setError(null);
          // keep polling a bit in case the job just got created
          return schedule(backoffRef.current);
        }
        if (res.status >= 400) {
          setError(`Status request failed (${res.status})`);
          backoffRef.current = Math.min(backoffRef.current * 2, 30000); // cap at 30s
          return schedule(backoffRef.current);
        }

        const data = res.data ?? {};
        const newStatus = (data.status as JobStatus) || 'missing';
        const newProgress =
          typeof data.progress === 'number' ? data.progress : 0;
        const newError = data.error ?? null;

        setStatus(newStatus);
        setProgress(newProgress);
        setError(newError);

        if (newStatus === 'ready') {
          stoppedRef.current = true;
          if (onReady) onReady();
          return clear();
        }
        if (newStatus === 'error') {
          stoppedRef.current = true;
          return clear();
        }

        // Healthy poll cadence
        backoffRef.current = intervalMs;
        schedule(backoffRef.current);
      } catch (e) {
        const msg =
          (e as AxiosError)?.message ||
          (e as Error)?.message ||
          'Status request failed';
        setError(msg);
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        schedule(backoffRef.current);
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    // kick off immediately
    schedule(0);

    return () => {
      stoppedRef.current = true;
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [guid, intervalMs, basePath, onReady]);

  return { status, progress, error };
}
