import { useEffect, useState } from 'react';
import api from '../services/api';
import DataService from '../services/data.service';
import { ExtractedReport, Summary } from '../types/types';
import { parseStrict } from '../utils/parser';

const keys = [
  'identity',
  'pollutants',
  'goals',
  'bmps',
  'implementationActivities',
  'monitoringMetrics',
  'outreachActivities',
  'geographicAreas',
] as const;

type AskKey = (typeof keys)[number];

function computeSummary(report: ExtractedReport): Summary {
  const toPct = (v: unknown): number | null => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    // allow 0–1 or 0–100 inputs; normalize to 0–100
    if (v >= 0 && v <= 1) return Math.round(v * 100);
    if (v >= 0 && v <= 100) return Math.round(v);
    return null;
  };

  const hasCompletionRate = (
    g: unknown
  ): g is { completionRate?: number | null } => {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      g !== null && typeof g === 'object' && 'completionRate' in (g as any)
    );
  };

  let sum = 0;
  let count = 0;
  const goals = Array.isArray(report.goals) ? report.goals : [];
  for (const g of goals as ReadonlyArray<unknown>) {
    const cr = hasCompletionRate(g) ? g.completionRate : undefined;
    const v = toPct(cr);
    if (v !== null) {
      sum += v;
      count++;
    }
  }

  const avg = count > 0 ? Math.round(sum / count) : null;

  return {
    totalGoals: Array.isArray(report.goals) ? report.goals.length : 0,
    totalBMPs: Array.isArray(report.bmps) ? report.bmps.length : 0,
    completionRate: avg,
  } as Summary;
}

function usePdfReportOrchestratorInternal(
  initialReport: ExtractedReport | null
) {
  const [report, setReport] = useState<ExtractedReport | null>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AskKey | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  const hasLocalCopy = Boolean(initialReport);
  useEffect(() => {
    if (!hasLocalCopy) setLoading(false);
  }, [hasLocalCopy]);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const ASK_DELAY_MS = 1000;
  const ASK_TIMEOUT_MS = 20000;

  async function askWithTimeout(guid: string, key: AskKey) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(`Timeout: ${key}`),
      ASK_TIMEOUT_MS
    );
    try {
      const res = await api.post(
        '/ask',
        { guid, key },
        {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        }
      );
      const parsed = parseStrict(res.data?.answer ?? '', key);
      return parsed ?? null;
    } finally {
      clearTimeout(timer);
    }
  }

  useEffect(() => {
    if (!report || report.isLoaded) return;

    const fetchData = async () => {
      try {
        // small head-start for backend to stabilize if needed
        await wait(500);

        const total = keys.length;
        let completed = 0;
        const draft: ExtractedReport = { ...report };

        for (const key of keys) {
          setCurrentStep(key);
          try {
            const parsed = await askWithTimeout(draft.id, key);

            switch (key) {
              case 'identity':
                draft.identity =
                  (parsed as ExtractedReport['identity']) ?? draft.identity;
                break;
              case 'pollutants':
                draft.pollutants = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['pollutants'])
                  : draft.pollutants ?? [];
                break;
              case 'goals':
                draft.goals = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['goals'])
                  : draft.goals ?? [];
                break;
              case 'bmps':
                draft.bmps = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['bmps'])
                  : draft.bmps ?? [];
                break;
              case 'implementationActivities':
                draft.implementationActivities = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['implementationActivities'])
                  : draft.implementationActivities ?? [];
                break;
              case 'monitoringMetrics':
                draft.monitoringMetrics = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['monitoringMetrics'])
                  : draft.monitoringMetrics ?? [];
                break;
              case 'outreachActivities':
                draft.outreachActivities = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['outreachActivities'])
                  : draft.outreachActivities ?? [];
                break;
              case 'geographicAreas':
                draft.geographicAreas = Array.isArray(parsed)
                  ? (parsed as ExtractedReport['geographicAreas'])
                  : draft.geographicAreas ?? [];
                break;
            }
          } catch (err) {
            // console.debug(`[ask:${key}] failed`, err);
          } finally {
            completed++;
            setProgress(Math.round((completed / total) * 100));
          }

          await wait(ASK_DELAY_MS);
        }

        draft.summary = computeSummary(draft);
        draft.isLoaded = true;

        DataService.setData(draft.id, draft);
        setReport(draft);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [report]);

  return { report, loading, progress, currentStep, hasLocalCopy };
}

export function usePdfReportOrchestrator(
  initialReport: ExtractedReport | null
) {
  return usePdfReportOrchestratorInternal(initialReport);
}
