import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import classes from './PDFReport.module.css';
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  ExtractedReport,
  Summary,
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import DataService from '../services/data.service';
import { useReportData } from '../hooks/useReportData';
import { parseStrict } from '../utils/parser';
import Charts from '../components/Charts';

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

// Compute Summary from a report (no side effects)
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

// Expanded keys list (adapter names on the right side of the switch)
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

/** Phase 2: Orchestration hook (moved from component to keep UI thin) */
function usePdfReportOrchestrator(initialReport: ExtractedReport | null) {
  const [report, setReport] = useState<ExtractedReport | null>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AskKey | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  // Private-only behavior: if no local copy on this device, stop loading and show a back screen
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
            console.debug(`[ask:${key}] failed`, err);
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

function PDFReport() {
  const initialReport = useLoaderData() as ExtractedReport | null;
  const { id: idParam } = useParams();
  const navigate = useNavigate();

  // Single source of truth for id
  const id = initialReport?.id ?? idParam ?? '';

  // Phase 2: thin component — orchestration moved into hook
  const { report, loading, progress, currentStep, hasLocalCopy } =
    usePdfReportOrchestrator(initialReport);

  // View & link states
  const [viewMode, setViewMode] = useState<'json' | 'tree'>('json');
  const [openLink, setOpenLink] = useState<string | null>(null);

  // build the JSON object used in both views (and for copy)
  const extra = report as unknown;
  const structuredObject = useMemo(
    () =>
      report
        ? {
            id: report.id,
            name: report.name,
            isLoaded: report.isLoaded,
            fileName: report.fileName,
            fileSizeBytes: report.fileSizeBytes,
            identity: report.identity,
            geographicAreas: report.geographicAreas,
            pollutants: report.pollutants,
            goals: report.goals,
            bmps: report.bmps,
            implementationActivities: report.implementationActivities,
            monitoringMetrics: report.monitoringMetrics,
            outreachActivities: report.outreachActivities,
            requiredReductions: getProp<unknown>(extra, 'requiredReductions'),
            goalsTotals: getProp<unknown>(extra, 'goalsTotals'),
            bmpsTotals: getProp<unknown>(extra, 'bmpsTotals'),
            implementationTotals: getProp<unknown>(
              extra,
              'implementationTotals'
            ),
            monitoringTotals: getProp<unknown>(extra, 'monitoringTotals'),
            outreachTotals: getProp<unknown>(extra, 'outreachTotals'),
            funding: getProp<unknown>(extra, 'funding'),
            milestones: getProp<unknown>(extra, 'milestones'),
            stakeholders: getProp<unknown>(extra, 'stakeholders'),
            figures: getProp<unknown>(extra, 'figures'),
            summary: report.summary,
          }
        : null,
    [report, extra]
  );

  // ----- Button handlers -----
  const handleTreeView = () => setViewMode('tree');
  const handleJsonView = () => setViewMode('json');

  const handleCopyJson = async () => {
    if (!structuredObject) return;
    const text = JSON.stringify(structuredObject, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied JSON to clipboard');
    } catch {
      alert('Copy failed');
    }
  };

  // ----- Open link creation / clipboard -----
  const handleCreateOpenLink = async () => {
    if (!report || !structuredObject) {
      alert('No data to publish');
      return;
    }
    try {
      const meta: MetaJson = {
        guid: id,
        name: (report as unknown as { name?: string })?.name,
        totals: {
          goals: report?.goals?.length ?? 0,
          bmps: report?.bmps?.length ?? 0,
        },
        completionRate: report?.summary?.completionRate ?? 0,
      };
      const body: CreateOpenLinkRequest = {
        guid: id,
        meta,
        data: structuredObject as Record<string, unknown>,
      };

      const res = await api.post<CreateOpenLinkResponse>('/open-links', body);
      if (res?.data) {
        const url = res.data?.url;
        if (url) setOpenLink(url);
        if (res.data?.publicId) {
          // optionally persist or notify — left as-is to keep behavior
        }
      }
    } catch {
      alert('Create Open Link failed');
    }
  };

  const handleCopyOpenLink = async () => {
    if (!openLink) return;
    try {
      await navigator.clipboard.writeText(openLink);
      alert('Open link copied');
    } catch {
      alert('Copy failed');
    }
  };

  const handleGoToLink = () => {
    if (!openLink) return;
    alert(`Navigate to: ${openLink}`);
  };

  // ----- Minimal recursive Tree View (collapsible) -----
  type TreeProps = { data: unknown; label?: string };
  const isPlainObject = (x: unknown): x is Record<string, unknown> =>
    typeof x === 'object' && x !== null && !Array.isArray(x);

  const Primitive = ({ value }: { value: unknown }) => {
    let display: string;
    switch (typeof value) {
      case 'string':
        display = `"${value}"`;
        break;
      case 'number':
      case 'boolean':
        display = String(value);
        break;
      case 'object':
        display = value === null ? 'null' : '[Object]';
        break;
      case 'undefined':
        display = 'undefined';
        break;
      default:
        display = String(value);
    }
    return <span className={classes.treeValue}>{display}</span>;
  };

  const TreeNode = ({ data, label }: TreeProps) => {
    if (Array.isArray(data)) {
      return (
        <details className={classes.treeNode} open>
          <summary className={classes.treeSummary}>
            {label ?? 'Array'}{' '}
            <span className={classes.treeMeta}>[{data.length}]</span>
          </summary>
          <div className={classes.treeChildren}>
            {data.map((v, i) => (
              <div key={i} className={classes.treeRow}>
                <span className={classes.treeKey}>[{i}]</span>{' '}
                {isPlainObject(v) || Array.isArray(v) ? (
                  <TreeNode data={v} label={String(i)} />
                ) : (
                  <Primitive value={v} />
                )}
              </div>
            ))}
          </div>
        </details>
      );
    }

    if (isPlainObject(data)) {
      const entries = Object.entries(data);
      return (
        <details className={classes.treeNode} open>
          <summary className={classes.treeSummary}>
            {label ?? 'Object'}{' '}
            <span className={classes.treeMeta}>{{}.toString.call(data)}</span>
          </summary>
          <div className={classes.treeChildren}>
            {entries.map(([k, v]) => (
              <div key={k} className={classes.treeRow}>
                <span className={classes.treeKey}>{k}:</span>{' '}
                {isPlainObject(v) || Array.isArray(v) ? (
                  <TreeNode data={v} label={k} />
                ) : (
                  <Primitive value={v} />
                )}
              </div>
            ))}
          </div>
        </details>
      );
    }

    return (
      <div className={classes.treeRow}>
        <span className={classes.treeKey}>{label}</span>{' '}
        <Primitive value={data} />
      </div>
    );
  };

  // ---- Private-only view: no local copy in this browser ----
  if (!hasLocalCopy) {
    return (
      <main className={classes.main}>
        <div className={classes.structuredData}>
          <div className={classes.container}>
            <h1>PDF Report</h1>
            <h2>Private on this device</h2>
            <div className={classes.structured}>
              <div
                style={{
                  padding: '1rem',
                  background: '#f9f9f9',
                  border: '1px solid #e6e6e6',
                  borderRadius: 12,
                }}
              >
                <p>
                  This report is private to the device where it was first
                  generated. Open it there to share/export.
                </p>
                <div className={classes.actionsRow}>
                  <button
                    type="button"
                    className={classes.btn}
                    onClick={() => navigate('/')}
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={classes.main}>
      <div className={classes.structuredData}>
        <div className={classes.container}>
          {loading || !report ? (
            <>
              <h1>PDF Report</h1>
              <h2>Building Structured Data for {report?.name ?? '...'}</h2>
              <p>Extracting: {currentStep || 'Starting...'}</p>
              <div className={classes.statusBar}>
                <div className={classes.progressBar}>
                  <div
                    className={classes.progress}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p>
                  Processing… <strong>{progress}%</strong>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1>PDF Report</h1>
              <h2>Structured Data for {report?.name}</h2>

              <div className={classes.actionsRow}>
                <div className={classes.btnGroup}>
                  <button
                    type="button"
                    className={`${classes.btn} ${
                      viewMode === 'tree' ? classes.active : ''
                    }`}
                    aria-pressed={viewMode === 'tree'}
                    onClick={handleTreeView}
                  >
                    TreeView
                  </button>
                  <button
                    type="button"
                    className={`${classes.btn} ${
                      viewMode === 'json' ? classes.active : ''
                    }`}
                    aria-pressed={viewMode === 'json'}
                    onClick={handleJsonView}
                  >
                    JsonView
                  </button>
                  <button
                    type="button"
                    className={classes.btn}
                    onClick={handleCopyJson}
                  >
                    Copy Json
                  </button>
                  {!openLink && false && (
                    <button
                      type="button"
                      className={classes.btn}
                      onClick={handleCreateOpenLink}
                    >
                      Create Open Link
                    </button>
                  )}
                </div>
              </div>

              {/* Open Link card (shown after Create Open Link) */}
              {openLink && (
                <div className={classes.structured}>
                  <div className={classes.openLinkCard}>
                    <p className={classes.openLinkTitle}>Public Open Link</p>
                    <pre className={classes.openLinkText}>{openLink}</pre>
                    <div className={classes.actionsRow}>
                      <button
                        type="button"
                        className={classes.btn}
                        onClick={handleCopyOpenLink}
                      >
                        Copy Open Link
                      </button>
                      <button
                        type="button"
                        className={classes.btn}
                        onClick={handleGoToLink}
                      >
                        Go to Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={classes.structured}>
                {viewMode === 'json' ? (
                  <pre
                    className={classes.pre}
                    style={{ background: '#f0f0f0', padding: '1rem' }}
                  >
                    {JSON.stringify(structuredObject, null, 2)}
                  </pre>
                ) : (
                  <div
                    className={classes.treeRoot}
                    style={{ background: '#f0f0f0', padding: '1rem' }}
                  >
                    <TreeNode data={structuredObject} label="root" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className={classes.charts}>
        <div className={classes.containerfull}>
          <Charts data={report} />
        </div>
      </div>
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
