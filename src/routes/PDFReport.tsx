import { useEffect, useState } from 'react';
import axios from 'axios';
import classes from './PDFReport.module.css';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import {
  BMP,
  ExtractedReport,
  GeographicArea,
  Goal,
  ImplementationActivity,
  MonitoringMetric,
  OutreachActivity,
  Pollutant,
  ReportIdentity,
  Summary,
} from '../types/types';
import DataService from '../services/data.service';

const API_BASE = process.env.REACT_APP_API_BASE;

// Expanded keys list (adapter names on the right side of the switch)
const keys = [
  'identity',
  'pollutants',
  'goals',
  'bmps',
  'implementation', // -> implementationActivities
  'monitoring', // -> monitoringMetrics
  'outreach', // -> outreachActivities
  'geographicAreas',
  // 'summary',  we'll use computation here
] as const;

type AskKey = (typeof keys)[number];

function PDFReport() {
  const initialReport = useLoaderData() as ExtractedReport | null;
  const [report, setReport] = useState<ExtractedReport | null>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AskKey | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!report || report.isLoaded) return;

    const fetchData = async () => {
      try {
        const total = keys.length;
        let completed = 0;
        const draft: ExtractedReport = { ...report };

        await Promise.all(
          keys.map(async (key) => {
            setCurrentStep(key);

            try {
              const res = await axios.post(
                `${API_BASE}/ask`,
                { guid: report.id, key },
                { headers: { 'Content-Type': 'application/json' } }
              );

              const parsed = JSON.parse(res.data.answer);

              switch (key) {
                case 'identity':
                  draft.identity =
                    (parsed[key] as ReportIdentity) ?? draft.identity;
                  break;
                case 'pollutants':
                  draft.pollutants = (parsed[key] as Pollutant[]) ?? [];
                  break;
                case 'goals':
                  draft.goals = (parsed[key] as Goal[]) ?? [];
                  break;
                case 'bmps':
                  draft.bmps = (parsed[key] as BMP[]) ?? [];
                  break;
                case 'implementation':
                  draft.implementationActivities =
                    (parsed[key] as ImplementationActivity[]) ?? [];
                  break;
                case 'monitoring':
                  draft.monitoringMetrics =
                    (parsed[key] as MonitoringMetric[]) ?? [];
                  break;
                case 'outreach':
                  draft.outreachActivities =
                    (parsed[key] as OutreachActivity[]) ?? [];
                  break;
                case 'geographicAreas':
                  draft.geographicAreas =
                    (parsed[key] as GeographicArea[]) ?? [];
                  break;
                // case 'summary':
                //   draft.summary = (parsed[key] as Summary) ?? draft.summary;
                //   break;
              }
            } catch (_err) {
              // swallow per-key errors to keep the batch going
            } finally {
              completed++;
              setProgress(Math.round((completed / total) * 100));
            }
          })
        );

        draft.isLoaded = true;
        DataService.setData(draft.id, draft);
        setReport(draft);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [report]);

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
                    landUse: report.landUse,
                    impairments: report.impairments,
                    pollutants: report.pollutants,
                    requiredReductions: report.requiredReductions,
                    goals: report.goals,
                    bmps: report.bmps,
                    implementation: report.implementationActivities,
                    monitoring: report.monitoringMetrics,
                    outreach: report.outreachActivities,
                    funding: report.funding,
                    milestones: report.milestones,
                    stakeholders: report.stakeholders,
                    figures: report.figures,
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
