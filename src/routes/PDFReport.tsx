import { usePdfReportOrchestrator } from '../hooks/usePdfReportOrchestrator';
import { useMemo, useState } from 'react';
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
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import DataService from '../services/data.service';
import Charts from '../components/Charts';
import { getProp } from '../utils/safeGet';

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
