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
import Charts from '../components/Charts';

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

// Expanded keys list
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

function PDFReport() {
  const initialReport = useLoaderData() as ExtractedReport | null;
  const { id: idParam } = useParams();
  const navigate = useNavigate();

  // Single source of truth for id
  const id = initialReport?.id ?? idParam ?? '';

  const [report, setReport] = useState<ExtractedReport | null>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AskKey | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  // Private-only behavior: if no local copy on this device, stop loading and show a back screen
  const hasLocalCopy = Boolean(initialReport);
  useEffect(() => {
    if (!hasLocalCopy) setLoading(false);
  }, [hasLocalCopy]);

  // View & link states
  const [viewMode, setViewMode] = useState<'json' | 'tree'>('json');
  const [openLink, setOpenLink] = useState<string | null>(null);

  // helpers
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

  // build the JSON object used in both views (and for copy)
  const extra = report as unknown;
  const structuredObject = useMemo(
    () =>
      report && report.isLoaded
        ? {
            identity: report.identity,
            geographicAreas: report.geographicAreas,
            landUse: getProp<unknown>(extra, 'landUse'),
            impairments: getProp<unknown>(extra, 'impairments'),
            pollutants: report.pollutants,
            requiredReductions: getProp<unknown>(extra, 'requiredReductions'),
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

  const handleCreateOpenLink = async () => {
    if (!structuredObject) {
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
      const res = await api.post<CreateOpenLinkResponse>('/openlinks', body, {
        headers: { 'Content-Type': 'application/json' },
      });
      const url = res.data?.url;
      if (url) setOpenLink(url);

      // Optional explicit cleanup (server also cleans up inside create)
      try {
        await api.delete(`/documents/${id}`);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('Cleanup after open link failed', err);
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
    return <span className={classes.treePrimitive}>{display}</span>;
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
            {data.map((item, idx) => (
              <TreeNode key={idx} data={item} label={String(idx)} />
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
            <span className={classes.treeMeta}>
              {'{'}
              {entries.length}
              {'}'}
            </span>
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
    // primitive
    return (
      <div className={classes.treeRow}>
        {label ? <span className={classes.treeKey}>{label}:</span> : null}{' '}
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
                  border: '1px solid #e6e6e6',
                  borderRadius: 12,
                  padding: '0.85rem',
                  background: '#ffffff',
                  textAlign: 'left',
                }}
              >
                <p style={{ marginTop: 0 }}>
                  This report can only be opened on the device where it was
                  created.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    appearance: 'none',
                    border: '1px solid #dcdcdc',
                    background: '#ffffff',
                    color: '#222',
                    padding: '0.45rem 0.8rem',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Back to Upload
                </button>
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
              <h2>Structured Data</h2>

              {/* Minimalist/wow actions row */}
              <div className={classes.actionsRow}>
                <button
                  type="button"
                  className={`${classes.btn} ${
                    viewMode === 'tree' ? classes.btnActive : classes.btnGhost
                  }`}
                  aria-pressed={viewMode === 'tree'}
                  onClick={handleTreeView}
                >
                  TreeView
                </button>
                <button
                  type="button"
                  className={`${classes.btn} ${
                    viewMode === 'json' ? classes.btnActive : classes.btnGhost
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
                    className={classes.btnAccent}
                    onClick={handleCreateOpenLink}
                  >
                    Create Open Link
                  </button>
                )}
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
                    className={classes.pre}
                    style={{ background: '#f9f9f9', padding: '1rem' }}
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
