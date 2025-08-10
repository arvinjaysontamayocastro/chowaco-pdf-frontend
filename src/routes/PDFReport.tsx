import { useState, useEffect } from 'react';
import axios from 'axios';
import classes from './PDFReport.module.css';
import ChartsComponent from '../components/Charts';
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

function PDFReport() {
  const loadedReport: ExtractedReport = useLoaderData();
  const [report, setReport] = useState<ExtractedReport>({ ...loadedReport });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const keys = [
    'goals',
    'bmps',
    'implementation',
    'monitoring',
    'outreach',
    'geographicAreas',
    'summary',
  ] as const;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const extractFromPdfReport = () => {
    setReport({ ...loadedReport });
  };

  const extractAll = async () => {
    setIsLoadingData(true);

    if (report.isLoaded) {
      extractFromPdfReport();
    } else {
      try {
        const updatedReport = { ...report };

        // Batch size for parallel requests
        const batchSize = 1;

        for (let i = 0; i < keys.length; i += batchSize) {
          const batchKeys = keys.slice(i, i + batchSize);

          // Show which keys are being processed
          setCurrentStep(batchKeys.join(', '));
          setProgress(Math.round((i / keys.length) * 100));

          const results = await Promise.all(
            batchKeys.map(async (key) => {
              const res = await axios.post(`${API_BASE}/ask`, {
                guid: report.id,
                key,
              });
              const parsed = JSON.parse(res.data.answer);
              return { key, value: parsed[key] };
            })
          );
          for (const { key, value } of results) {
            switch (key) {
              case 'goals':
                updatedReport.goals = value as Goal[];
                break;
              case 'bmps':
                updatedReport.bmps = value as BMP[];
                break;
              case 'implementation':
                updatedReport.implementationActivities =
                  value as ImplementationActivity[];
                break;
              case 'monitoring':
                updatedReport.monitoringMetrics = value as MonitoringMetric[];
                break;
              case 'outreach':
                updatedReport.outreachActivities = value as OutreachActivity[];
                break;
              case 'geographicAreas':
                updatedReport.geographicAreas = value as GeographicArea[];
                break;
              case 'summary':
                updatedReport.summary = value as Summary;
                break;
              default:
                alert(`Unknown key: ${key}`);
            }
          }

          // Wait 1 second before next batch
          // if (i + batchSize < keys.length) {
          //   await sleep(1000);
          // }
        }

        updatedReport.isLoaded = true;
        setReport(updatedReport);
        DataService.setData(report.id, updatedReport);
      } catch (err) {
        console.error('Extraction failed', err);
      }
    }

    setIsLoadingData(false);
  };

  useEffect(() => {
    extractAll();
  }, [loadedReport]);

  return (
    <main className={classes.main}>
      <form className={classes.form}>
        {isLoadingData && <div className={classes.loading}>&nbsp;</div>}
        <h1>PDF Report</h1>
        <div>
          {isLoadingData ? (
            <div>
              <h2>Building Structured Data for {report.name}</h2>
              <p>Extracting: {currentStep || 'Starting...'}</p>
              <div className={classes.progressBar}>
                <div
                  className={classes.progress}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <h2>Structured Data</h2>
          )}
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
        </div>
      </form>
      <div className={classes.charts}>
        <ChartsComponent extractedReport={report} />
      </div>
    </main>
  );
}

export default PDFReport;

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return null;

  const localData = DataService.getData(id);
  if (localData) return localData;

  // Fetch fresh data from API if not in cache
  const res = await fetch(`${API_BASE}/pdf/${id}`);
  if (!res.ok) throw new Response('Not Found', { status: 404 });
  return res.json();
}
