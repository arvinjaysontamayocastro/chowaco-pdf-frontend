import { useEffect, useState } from 'react';
import api from '../services/api';
import classes from './PDFReport.module.css';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { ExtractedReport, Summary } from '../types/types';
import DataService from '../services/data.service';

function parseStrict(answer: string, key: string) {
  try {
    const obj = JSON.parse(answer) as unknown;
    if (obj && typeof obj === 'object') {
      const val = (obj as Record<string, unknown>)[key];
      return typeof val === 'undefined' ? null : val;
    }
    return null;
  } catch {
    return null;
  }
}

// safe getter for optional/unknown extra fields
function getProp<T>(obj: unknown, key: string): T | undefined {
  if (
    obj &&
    typeof obj === 'object' &&
    key in (obj as Record<string, unknown>)
  ) {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

// type guard for goal objects that might include completionRate
function hasCompletionRate(x: unknown): x is { completionRate?: unknown } {
  return typeof x === 'object' && x !== null && 'completionRate' in x;
}

function computeSummary(report: ExtractedReport): Summary {
  const totalGoals = Array.isArray(report.goals) ? report.goals.length : 0;
  const totalBMPs = Array.isArray(report.bmps) ? report.bmps.length : 0;

  const toPct = (v: unknown): number | null => {
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();

      const m = s.match(/(-?\d+(\.\d+)?)\s*%/);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
      }
      if (/(^|\b)(complete|completed|done)\b/.test(s)) return 100;
      if (/\b(in[-\s]?progress|ongoing|underway)\b/.test(s)) return 50;
      if (/\b(not\s*started|pending|tbd)\b/.test(s)) return 0;

      const n2 = Number(s);
      if (Number.isFinite(n2)) {
        if (n2 <= 1 && n2 >= 0) return Math.round(n2 * 100);
        if (n2 >= 0 && n2 <= 100) return Math.round(n2);
      }
    }
    return null;
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

  const completionRate = count > 0 ? Math.round(sum / count) : 0;

  return {
    totalGoals,
    totalBMPs,
    completionRate,
  } as Summary;
}

// Expanded keys list (adapter names on the right side of the switch)
const keys = [
  'identity',
  'pollutants',
  'goals',
  'bmps',
  'implementationActivities', // -> implementationActivities
  'monitoringMetrics', // -> monitoringMetrics
  'outreachActivities', // -> outreachActivities
  'geographicAreas',
] as const;

type AskKey = (typeof keys)[number];

function PDFReport() {
  const initialReport = useLoaderData() as ExtractedReport | null;
  const [report, setReport] = useState<ExtractedReport | null>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AskKey | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  // helpers
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const ASK_DELAY_MS = 1000; // set 500 or 1000 as you prefer
  const ASK_TIMEOUT_MS = 20000; // 20s per request

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!report || report.isLoaded) return;

    const fetchData = async () => {
      try {
        const total = keys.length;
        let completed = 0;
        const draft: ExtractedReport = { ...report };

        for (const key of keys) {
          setCurrentStep(key);
          try {
            const parsed = await askWithTimeout(draft.id, key);

            // assign parsed value to the correct field, with no `any`
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
            // continue on timeout/failure (no `any` used)
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.debug(`[ask:${key}] failed`, err);
            }
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

  // prepare extra (unknown) fields for preview without `any`
  const extra = report as unknown;

  return (
    <main className={classes.main}>
      <form className={classes.form}>
        {loading || !report ? (
          <>
            <h1>PDF Report</h1>
            <h2>Building Structured Data for {report?.name ?? '...'}</h2>
            <p>Extracting: {currentStep || 'Starting...'}</p>
            <div className={classes.progressBar}>
              <div
                className={classes.progress}
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <h1>PDF Report</h1>
            <h2>Structured Data</h2>
            <div className={classes.structured}>
              <pre
                className={classes.pre}
                style={{ background: '#f0f0f0', padding: '1rem' }}
              >
                {JSON.stringify(
                  {
                    identity: report.identity,
                    geographicAreas: report.geographicAreas,
                    landUse: getProp<unknown>(extra, 'landUse'),
                    impairments: getProp<unknown>(extra, 'impairments'),
                    pollutants: report.pollutants,
                    requiredReductions: getProp<unknown>(
                      extra,
                      'requiredReductions'
                    ),
                    goals: report.goals,
                    bmps: report.bmps,
                    implementationActivities: report.implementationActivities,
                    monitoringMetrics: report.monitoringMetrics,
                    outreachActivities: report.outreachActivities,
                    funding: getProp<unknown>(extra, 'funding'),
                    milestones: getProp<unknown>(extra, 'milestones'),
                    stakeholders: getProp<unknown>(extra, 'stakeholders'),
                    figures: getProp<unknown>(extra, 'figures'),
                    summary: report.summary,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </>
        )}
      </form>
    </main>
  );
}

export default PDFReport;

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return null;
  const report = DataService.getData(id);
  return report || null;
}
