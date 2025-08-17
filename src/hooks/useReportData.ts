
// hooks/useReportData.ts
// Encapsulates data fetching + state logic for PDFReport

import { useEffect, useState } from 'react';
import api from '../services/api';
import { ExtractedReport } from '../types/types';

export function useReportData(reportId: string) {
  const [data, setData] = useState<ExtractedReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get(`/reports/${reportId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    if (reportId) fetchData();
  }, [reportId]);

  return { data, loading, error };
}
