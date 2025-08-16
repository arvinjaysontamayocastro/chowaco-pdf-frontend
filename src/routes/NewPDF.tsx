// src/routes/NewPDF.tsx  (Production-safe)
import { useState, ChangeEvent, useRef, useEffect } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport, Summary } from '../types/types';
import type {
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import KeyService from '../services/key.service';
import DataService from '../services/data.service';
import api from '../services/api';
import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import Snowfall from '../components/Snowfall';

const MAX_SIZE_MB = 20; // production-safe default
const PDF_MIME = 'application/pdf';

// ---- Local index for uploaded reports (cards) ----
interface ReportsIndexItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  isPublicKey?: boolean;
  publicKey?: string | null;
  publicUrl?: string | null;
  createdAt?: string;
}
type ReportsIndex = Record<string, ReportsIndexItem>;

const INDEX_KEY = 'reports_index';

function loadReportsIndex(): ReportsIndex {
  try {
    const s = localStorage.getItem(INDEX_KEY);
    if (!s) return {};
    const obj = JSON.parse(s) as unknown;
    if (obj && typeof obj === 'object') return obj as ReportsIndex;
  } catch {
    /* noop */
  }
  return {};
}

function saveReportsIndex(idx: ReportsIndex) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

function NewPDF() {
  const [pdfMessage, setPdfMessage] = useState(
    'Click here or drag your file in the box'
  );
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [reportsIndex, setReportsIndex] = useState<ReportsIndex>(() =>
    loadReportsIndex()
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    // Refresh the index on mount (in case another tab updated it)
    setReportsIndex(loadReportsIndex());
    // Cleanup: cancel any in-flight upload on unmount
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function validateFile(file: File): string | null {
    const sizeMb = file.size / (1024 * 1024);
    if (file.type !== PDF_MIME && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Please select a PDF file (.pdf).';
    }
    if (sizeMb > MAX_SIZE_MB) {
      return `File too large. Max ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const err = validateFile(file);
      if (err) {
        alert(err);
        // Reset so the same file can be chosen again
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setPdfMessage(`${file.name}, ${sizeMb} MB`);
      void uploadPdf(file); // auto-upload
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoadingPDF) setIsDragOver(true);
  };
  const onDragLeave = () => {
    setIsDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoadingPDF) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setPdfMessage(`${file.name}, ${sizeMb} MB`);
    void uploadPdf(file);
  };

  const uploadPdf = async (file: File) => {
    if (!file || isLoadingPDF) return;
    setIsLoadingPDF(true);

    // Properly typed AbortController + AxiosProgressEvent
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const _id = KeyService.createGUID();
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('guid', _id);

      // multipart upload with cancel support
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxBodyLength: Infinity,
        signal: controller.signal,
        onUploadProgress: (evt: AxiosProgressEvent) => {
          const total = evt.total ?? 0;
          if (!total) return;
          const pct = Math.round((evt.loaded / total) * 100);
          setPdfMessage(`${file.name} — uploading ${pct}%`);
        },
      });

      // allow backend to do initial processing before first ask
      await sleep(1000);

      // seed minimal ExtractedReport shell (so page loads instantly)
      const seed: ExtractedReport = {
        id: _id,
        identity: { huc: '' },
        pollutants: [],
        goals: [],
        bmps: [],
        implementationActivities: [],
        monitoringMetrics: [],
        outreachActivities: [],
        geographicAreas: [],
        summary: {
          totalGoals: 0,
          totalBMPs: 0,
          completionRate: 0,
        } as Summary,
      };
      DataService.setData(_id, seed);

      // record to local index so it appears in Uploaded PDF Reports
      const nextIdx = loadReportsIndex();
      nextIdx[_id] = {
        id: _id,
        fileName: file.name,
        fileSizeBytes: file.size,
        isPublicKey: false,
        publicKey: null,
        publicUrl: null,
        createdAt: new Date().toISOString(),
      };
      saveReportsIndex(nextIdx);
      setReportsIndex(nextIdx);

      navigate(`/${_id}`);
    } catch (err: unknown) {
      let msg = 'Unknown error';

      // Distinguish aborts for nicer UX
      if (axios.isCancel?.(err)) {
        msg = 'Upload canceled.';
      } else if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data && typeof data === 'object') {
          const rec = data as Record<string, unknown>;
          const fromError = rec.error;
          const fromMessage = rec.message;
          if (typeof fromError === 'string') msg = fromError;
          else if (typeof fromMessage === 'string') msg = fromMessage;
          else msg = err.message ?? 'Request failed';
        } else {
          msg = err.message ?? 'Request failed';
        }
      } else if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }

      alert(`Upload failed: ${msg}`);
    } finally {
      setIsLoadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      abortRef.current = null;
    }
  };

  // ---- Make it Public (from card list)
  const handleMakePublic = async (guid: string) => {
    const local = DataService.getData(guid) as ExtractedReport | null;
    // If no or not-yet-loaded local copy, route user to the detailed page
    if (!local || !local.isLoaded) {
      navigate(`/${guid}`);
      return;
    }

    try {
      const meta: MetaJson = {
        guid,
        // if you later add 'name' into ExtractedReport, this will pick it up
        name: (local as unknown as { name?: string }).name,
        totals: {
          goals: Array.isArray(local.goals) ? local.goals.length : 0,
          bmps: Array.isArray(local.bmps) ? local.bmps.length : 0,
        },
        completionRate: local.summary?.completionRate ?? 0,
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

  // Helpers for list UI
  function formatSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Build display list sorted by createdAt desc
  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <main className={classes.main}>
      {isLoadingPDF ? <Snowfall count={20} /> : null}

      <form
        className={classes.form}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={!isLoadingPDF ? openPicker : undefined}
        role="button"
        aria-label="Click or drop a PDF to upload"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!isLoadingPDF && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        {isLoadingPDF ? (
          <div className={classes.loadingcontainer}>
            <div className={classes.loading} aria-hidden="true">
              &nbsp;
            </div>
          </div>
        ) : null}

        <div
          className={classes.titlecontainer}
          data-dragover={isDragOver ? 'true' : 'false'}
        >
          {isLoadingPDF ? (
            <>
              <h1>Your PDF is uploading...</h1>
              <p>{pdfMessage}</p>
            </>
          ) : (
            <>
              <h1>Insert PDF</h1>
              <p>
                {isDragOver
                  ? 'Drop the file to upload'
                  : 'Click here or drag your file in the box'}
              </p>
              <p>before winter comes</p>
            </>
          )}
        </div>

        {/* Invisible but present input for browser-native file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className={classes.file}
          aria-hidden="true"
          tabIndex={-1}
        />

        <p className={classes.actions}>{/* auto-upload */}</p>
      </form>

      {/* Uploaded PDF Reports */}
      <section className={classes.structured} aria-label="Uploaded PDF Reports">
        <h2 style={{ textAlign: 'left', marginTop: '1rem' }}>
          Uploaded PDF Reports
        </h2>

        {cards.length === 0 ? (
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
            {cards.map((c, idx) => {
              const local = DataService.getData(c.id) as ExtractedReport | null;
              const isLocalCopy = Boolean(local);
              const displayName =
                (local as unknown as { name?: string })?.name ??
                `PDF ${idx + 1}`;

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
                    <strong>{displayName}</strong>
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
                    <div>
                      Local Copy:{' '}
                      {isLocalCopy ? (
                        <strong>Yes</strong>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert('Create Local Copy (todo)')}
                          style={{
                            appearance: 'none',
                            border: '1px solid #dcdcdc',
                            background: '#ffffff',
                            color: '#222',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            marginLeft: 6,
                          }}
                        >
                          Create Local Copy
                        </button>
                      )}
                    </div>
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

                    {isLocalCopy && !c.isPublicKey && false && (
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

                    {c.isPublicKey && c.publicUrl ? (
                      <a
                        href={c.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: 'none',
                          appearance: 'none',
                          border: '1px solid #dcdcdc',
                          background: '#ffffff',
                          color: '#222',
                          padding: '0.35rem 0.8rem',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'inline-block',
                        }}
                      >
                        View Public Link
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default NewPDF;
