// src/components/UploadedReportsList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../services/data.service';
import api from '../services/api';
import { ExtractedReport } from '../types/types';
import {
  ReportsIndex,
  ReportsIndexItem,
  saveReportsIndex,
  formatSize,
} from '../services/reports.service';
import classes from './UploadedReportsList.module.css';

interface UploadedReportsListProps {
  reportsIndex: ReportsIndex;
  setReportsIndex: (next: ReportsIndex) => void;
}

interface PublicReport {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  url: string;
  createdAt?: string;
}

export default function UploadedReportsList({
  reportsIndex,
  setReportsIndex,
}: UploadedReportsListProps) {
  const [tab, setTab] = useState<'local' | 'public'>('local');
  const [publicReports, setPublicReports] = useState<PublicReport[]>([]);
  const navigate = useNavigate();

  // 🔹 Fetch public reports
  useEffect(() => {
    if (tab === 'public') {
      (async () => {
        try {
          const res = await api.get<PublicReport[]>('/openlinks');

          console.log('res', res.data);
          setPublicReports(res.data ?? []);
        } catch (err) {
          console.error('Failed to fetch public reports', err);
        }
      })();
    }
  }, [tab]);

  const handleMakePublic = async (guid: string) => {
    const local = DataService.getData(guid) as ExtractedReport | null;
    if (!local || !local.isLoaded) {
      navigate(`/${guid}`);
      return;
    }

    try {
      console.log('public local', local);
      const body = {
        guid,
        meta: {
          guid,
          name: (local as unknown as { name?: string }).name,
          totals: {
            goals: Array.isArray(local.goals) ? local.goals.length : 0,
            bmps: Array.isArray(local.bmps) ? local.bmps.length : 0,
          },
          completionRate: local.summary?.completionRate ?? 0,
        },
        data: local as unknown as Record<string, unknown>,
      };

      const res = await api.post<{ url: string; publicId: string }>(
        '/openlinks',
        body,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const url = res.data?.url;
      const publicId = res.data?.publicId;
      if (url && publicId) {
        const next: ReportsIndex = {
          ...reportsIndex,
          [guid]: {
            ...(reportsIndex[guid] ?? {
              id: guid,
              fileName: (local as unknown as { name?: string }).name ?? 'PDF',
              fileSizeBytes: 0,
            }),
            isPublicKey: true,
            publicKey: publicId,
            publicUrl: url,
          },
        };
        setReportsIndex(next);
        saveReportsIndex(next);

        alert('Public link created!');
      }
    } catch {
      alert('Make Public failed');
    }
  };

  const localCards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <section className={classes.structured} aria-label="Uploaded PDF Reports">
      <div className={classes.tabs}>
        <button
          className={tab === 'local' ? classes.active : ''}
          onClick={() => setTab('local')}
        >
          Local Reports
        </button>
        <button
          className={tab === 'public' ? classes.active : ''}
          onClick={() => setTab('public')}
        >
          Public Reports
        </button>
      </div>

      {tab === 'local' ? (
        <>
          <h2>Local Reports</h2>
          {localCards.length === 0 ? (
            <p>No uploads yet.</p>
          ) : (
            <div className={classes.grid}>
              {localCards.map((c, idx) => {
                const local = DataService.getData(
                  c.id
                ) as ExtractedReport | null;
                const isLocalCopy = Boolean(local);
                const displayName =
                  (local as unknown as { name?: string })?.name ??
                  `PDF ${idx + 1}`;

                return (
                  <div key={c.id} className={classes.card}>
                    <div className={classes.cardHeader}>
                      <strong>{displayName}</strong>
                      {c.isPublicKey && (
                        <span className={classes.publicBadge}>Public</span>
                      )}
                    </div>
                    <div className={classes.cardBody}>
                      <div>File: {c.fileName}</div>
                      <div>Size: {formatSize(c.fileSizeBytes)}</div>
                      <div>
                        Local Copy:{' '}
                        {isLocalCopy ? (
                          <strong>Yes</strong>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert('Create Local Copy (todo)')}
                          >
                            Create Local Copy
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={classes.cardActions}>
                      {isLocalCopy && (
                        <button
                          type="button"
                          onClick={() => navigate(`/${c.id}`)}
                        >
                          Open
                        </button>
                      )}
                      {isLocalCopy && !c.isPublicKey && (
                        <button
                          type="button"
                          onClick={() => handleMakePublic(c.id)}
                        >
                          Make it Public
                        </button>
                      )}
                      {c.isPublicKey && c.publicUrl && (
                        <a href={c.publicUrl} target="_blank" rel="noreferrer">
                          View Public Link
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Public Reports</h2>
          {publicReports.length === 0 ? (
            <p>No public reports yet.</p>
          ) : (
            <div className={classes.grid}>
              {publicReports.map((p) => (
                <div key={p.id} className={classes.card}>
                  <div className={classes.cardHeader}>
                    <strong>{p.fileName}</strong>
                    <span className={classes.publicBadge}>Public</span>
                  </div>
                  <div className={classes.cardBody}>
                    <div>Size: {formatSize(p.fileSizeBytes)}</div>
                  </div>
                  <div className={classes.cardActions}>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
