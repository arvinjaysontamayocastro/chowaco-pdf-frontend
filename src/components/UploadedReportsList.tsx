// src/components/UploadedReportsList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './UploadedReportsList.module.css';
import DataService from '../services/data.service';
import api from '../services/api';
import {
  ExtractedReport,
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import {
  ReportsIndex,
  saveReportsIndex,
  formatSize,
} from '../services/reports.service';

interface UploadedReportsListProps {
  reportsIndex: ReportsIndex;
  setReportsIndex: () => void; //next: ReportsIndex
}

interface PublicReport {
  id: string;
  guid: string;
  meta?: MetaJson;
  url: string;
  createdAt?: string;
}

export default function UploadedReportsList({
  reportsIndex,
  setReportsIndex,
}: UploadedReportsListProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'public'>('local');
  const [publicReports, setPublicReports] = useState<PublicReport[]>([]);

  // eslint-disable-next-line no-unused-vars
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'public') {
      api
        .get('/open-links')
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          setPublicReports(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((x: any) => ({
              id: x.id ?? '',
              guid: x.guid ?? '',
              meta: x.meta ?? undefined,
              url: x.url ?? '',
              createdAt: x.createdAt ?? undefined,
            }))
          );
        })
        .catch(() => {
          setPublicReports([]);
        });
    }
  }, [activeTab]);

  // ---- make it public
  const handleMakePublic = async (guid: string) => {
    const local = DataService.getData(guid) as ExtractedReport | null;
    if (!local || !local.isLoaded) {
      navigate(`/${guid}`);
      return;
    }

    try {
      // console.log('reportsIndex', reportsIndex);

      const meta: MetaJson = {
        guid,
        name: local.name,
        totals: {
          goals: Array.isArray(local.goals) ? local.goals.length : 0,
          bmps: Array.isArray(local.bmps) ? local.bmps.length : 0,
        },
        completionRate: local.summary?.completionRate ?? 0,
        fileName: local.fileName,
        fileSizeBytes: local.fileSizeBytes,
        note: noteById[guid]?.slice(0, 300) || '',
      };

      const body: CreateOpenLinkRequest = {
        guid,
        meta,
        data: local as unknown as Record<string, unknown>,
      };

      const res = await api.post<CreateOpenLinkResponse>('/open-links', body);
      const url = res.data?.url;
      const publicId = res.data?.publicId;

      if (url && publicId) {
        const next: ReportsIndex = {
          ...reportsIndex,
          [guid]: {
            ...(reportsIndex[guid] ?? {
              id: guid,
              fileName: local.name ?? 'PDF',
              fileSizeBytes: 0,
            }),
            isPublicKey: true,
            publicKey: publicId,
            publicUrl: url,
          },
        };
        setReportsIndex(next);
        saveReportsIndex(next);
        alert('✅ Public link created!');
      }
    } catch {
      alert('❌ Make Public failed');
    }
  };

  // ---- sorted local reports
  const localCards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <section className={classes.container}>
      <header className={classes.header}>
        <h2>Uploaded Reports</h2>
      </header>

      {/* Tabs */}
      <div className={classes.tabbuttons}>
        <button
          className={activeTab === 'local' ? classes.active : ''}
          onClick={() => setActiveTab('local')}
        >
          Local Reports
        </button>
        <button
          className={activeTab === 'public' ? classes.active : ''}
          onClick={() => setActiveTab('public')}
        >
          Public Reports
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'local' && (
        <>
          {localCards.length === 0 && (
            <div className={classes.emptyState}>No local reports yet.</div>
          )}

          {localCards.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              {localCards.map((c) => {
                const guid = c.id;
                const local = DataService.getData(
                  guid
                ) as ExtractedReport | null;
                const isLocalCopy = Boolean(local);
                const displayName = local?.name ?? `PDF ${guid.slice(0, 6)}`;

                return (
                  <div
                    key={c.id}
                    style={{
                      border: '1px solid #e6e6e6',
                      borderRadius: 12,
                      padding: '0.85rem',
                      background: '#ffffff',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>{displayName}</strong>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        {formatSize(c.fileSizeBytes)}
                      </span>
                    </div>

                    <div
                      style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}
                    >
                      {c.fileName}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => navigate(`/${guid}`)}>Open</button>
                      {isLocalCopy && (
                        <button onClick={() => handleMakePublic(guid)}>
                          Make Public
                        </button>
                      )}
                      {c.publicUrl && (
                        <a
                          href={c.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.35rem 0.6rem',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                          }}
                        >
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
      )}

      {activeTab === 'public' && (
        <>
          {publicReports.length === 0 && (
            <div className={classes.emptyState}>No public reports found.</div>
          )}

          {publicReports.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              {publicReports.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #e6e6e6',
                    borderRadius: 12,
                    padding: '0.85rem',
                    background: '#ffffff',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>
                      {p.meta?.name ?? `Public ${p.id.slice(0, 6)}`}
                    </strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                    {p.meta?.fileName} •{' '}
                    {formatSize(p.meta?.fileSizeBytes ?? 0)}
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.35rem 0.6rem',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                    }}
                  >
                    View Public Link
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
