import { useEffect, useState } from 'react';
import api from '../services/api';

export function useReportData(reportId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get(`/reports/${reportId}`);
        setData(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    if (reportId) fetchData();
  }, [reportId]);

  return { data, loading, error };
}
