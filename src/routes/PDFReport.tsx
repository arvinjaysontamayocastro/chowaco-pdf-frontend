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
  Summary,
} from '../types/types';
import DataService from '../services/data.service';

const API_BASE = process.env.REACT_APP_API_BASE;

const keys = [
  'goals',
  'bmps',
  'implementation',
  'monitoring',
  'outreach',
  'geographicAreas',
  'summary',
] as const;

function PDFReport() {
  const initialReport: ExtractedReport = useLoaderData();
  const [report, setReport] = useState<ExtractedReport>(initialReport);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialReport?.isLoaded);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only fetch if report exists and is not loaded
    if (!report) return;

    if (report.isLoaded) {
      return;
    }
    const fetchData = async () => {
      try {
        const total = keys.length;
        let completed = 0;

        // Fetch all keys in parallel
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
                case 'goals':
                  report.goals = parsed[key] as Goal[];
                  break;
                case 'bmps':
                  report.bmps = parsed[key] as BMP[];
                  break;
                case 'implementation':
                  report.implementationActivities = parsed[
                    key
                  ] as ImplementationActivity[];
                  break;
                case 'monitoring':
                  report.monitoringMetrics = parsed[key] as MonitoringMetric[];
                  break;
                case 'outreach':
                  report.outreachActivities = parsed[key] as OutreachActivity[];
                  break;
                case 'geographicAreas':
                  report.geographicAreas = parsed[key] as GeographicArea[];
                  break;
                case 'summary':
                  report.summary = parsed[key] as Summary;
                  break;
              }
            } catch (err) {
              // console.error(`Failed to fetch key: ${key}`, err);
            } finally {
              completed++;
              setProgress(Math.round((completed / total) * 100));
            }
          })
        );

        // Mark as loaded & save to DataService
        report.isLoaded = true;
        DataService.setData(report.id, report);
        setReport({ ...report });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  });

  return (
    <main className={classes.main}>
      <form className={classes.form}>
        {loading ? (
          <>
            <h1>PDF Report</h1>
            <h2>Building Structured Data for {report?.name}</h2>
            <p>Extracting: {currentStep || 'Starting...'}</p>
            <div className={classes.progressBar}>
              <div
                className={classes.progress}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <h1>PDF Report</h1>
            <h2>Structured Data</h2>
            <div className={classes.structured}>
              <pre
                style={{ background: '#f0f0f0', padding: '1rem' }}
                className={classes.pre}
              >
                {JSON.stringify(
                  {
                    goals: report.goals,
                    bmps: report.bmps,
                    implementation: report.implementationActivities,
                    monitoring: report.monitoringMetrics,
                    outreach: report.outreachActivities,
                    geographicAreas: report.geographicAreas,
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
  // console.log('report', report);

  // Always return whatever we have in DataService
  return report || null;
}
