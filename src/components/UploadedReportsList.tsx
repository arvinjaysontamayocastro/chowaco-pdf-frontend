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
  loadReportsIndex,
  saveReportsIndex,
  formatSize,
} from '../services/reports.service';

interface UploadedReportsListProps {
  reportsIndex: Record<string, any>;
  setReportsIndex: (next: Record<string, any>) => void;
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
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // ---- fetch public reports
  useEffect(() => {
    if (activeTab === 'public') {
      api
        .get<PublicReport[]>('/openlinks')
        .then((res) => {
          setPublicReports(res.data || []);
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
      console.log('reportsIndex', reportsIndex);

      const meta: MetaJson = {
        guid,
        name: (local as any).name,
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

      const res = await api.post<CreateOpenLinkResponse>('/openlinks', body, {
        headers: { 'Content-Type': 'application/json' },
      });

      const url = res.data?.url;
      const publicId = res.data?.publicId;

      if (url && publicId) {
        const next = {
          ...reportsIndex,
          [guid]: {
            ...(reportsIndex[guid] ?? {
              id: guid,
              fileName: (local as any).name ?? 'PDF',
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
    <section className={classes.structured} aria-label="Uploaded PDF Reports">
      <h2 style={{ textAlign: 'left', marginTop: '1rem' }}>
        Uploaded PDF Reports
      </h2>

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

      {/* Local Reports */}
      {activeTab === 'local' && (
        <>
          {localCards.length === 0 ? (
            <p style={{ textAlign: 'left' }}>No uploads yet.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              {localCards.map((c, idx) => {
                const local = DataService.getData(
                  c.id
                ) as ExtractedReport | null;
                const isLocalCopy = Boolean(local);
                const displayName = (local as any)?.name ?? `PDF ${idx + 1}`;

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
                      <strong className={classes.filename}>
                        {displayName}
                      </strong>

                      {c.isPublicKey ? (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background:
                              'linear-gradient(to right, rgb(250, 204, 21), rgb(45, 212, 191))',
                            color: '#101010',
                            fontWeight: 700,
                          }}
                        >
                          Public
                        </span>
                      ) : null}
                    </div>

                    <div style={{ fontSize: 14, color: '#444' }}>
                      <div>File: {c.fileName}</div>
                      <div>Size: {formatSize(c.fileSizeBytes)}</div>
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <textarea
                        rows={2}
                        placeholder="Optional note (max 300 chars)"
                        maxLength={300}
                        value={noteById[c.id] || ''}
                        onChange={(e) =>
                          setNoteById({ ...noteById, [c.id]: e.target.value })
                        }
                        style={{
                          width: '100%',
                          fontSize: 12,
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: 6,
                          resize: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {isLocalCopy && (
                        <button
                          type="button"
                          onClick={() => navigate(`/${c.id}`)}
                          style={{
                            appearance: 'none',
                            border: '1px solid #dcdcdc',
                            background: '#ffffff',
                            color: '#222',
                            padding: '0.35rem 0.8rem',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                          }}
                        >
                          Open
                        </button>
                      )}

                      {isLocalCopy && !c.isPublicKey && (
                        <button
                          type="button"
                          onClick={() => handleMakePublic(c.id)}
                          style={{
                            appearance: 'none',
                            border: '1px solid #101010',
                            background: '#101010',
                            color: '#fff',
                            padding: '0.35rem 0.8rem',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                          }}
                        >
                          Make it Public
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Public Reports */}
      {activeTab === 'public' && (
        <>
          {publicReports.length === 0 ? (
            <p style={{ textAlign: 'left' }}>No public reports yet.</p>
          ) : (
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
                  <strong>{p.meta?.name ?? 'Untitled PDF'}</strong>
                  <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>
                    <div>File: {p.meta?.fileName}</div>
                    <div>Size: {formatSize(p.meta?.fileSizeBytes)}</div>
                    {p.meta?.note && <p>Note: {p.meta.note}</p>}
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '0.35rem 0.8rem',
                        borderRadius: 10,
                        border: '1px solid #dcdcdc',
                        background: '#ffffff',
                        color: '#222',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                      }}
                    >
                      View Public Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
