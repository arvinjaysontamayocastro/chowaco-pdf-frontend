// src/routes/NewPDF.tsx  (Production-safe)
import { useState, useEffect } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport } from '../types/types';
import type {
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import DataService from '../services/data.service';
import api from '../services/api';
import UploadForm from '../components/UploadForm';
import Snowfall from '../components/Snowfall';
import UploadedReportsList from '../components/UploadedReportsList';

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
  const [reportsIndex, setReportsIndex] = useState<ReportsIndex>(() =>
    loadReportsIndex()
  );

  const navigate = useNavigate();

  useEffect(() => {
    setReportsIndex(loadReportsIndex());
  }, []);

  // ---- Make it Public (from card list)
  const handleMakePublic = async (guid: string) => {
    const local = DataService.getData(guid) as ExtractedReport | null;
    if (!local || !local.isLoaded) {
      navigate(`/${guid}`);
      return;
    }

    try {
      const meta: MetaJson = {
        guid,
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

  function formatSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <main className={classes.main}>
      <Snowfall count={10} />

      {/* 🟢 PDF Upload Form */}
      <UploadForm
        onUploadSuccess={(id, file) => {
          const nextIdx = loadReportsIndex();
          nextIdx[id] = {
            id,
            fileName: file.name,
            fileSizeBytes: file.size,
            isPublicKey: false,
            publicKey: null,
            publicUrl: null,
            createdAt: new Date().toISOString(),
          };
          saveReportsIndex(nextIdx);
          setReportsIndex(nextIdx);
          navigate(`/${id}`);
        }}
      />

      {/* Uploaded PDF Reports */}
      <UploadedReportsList
        reportsIndex={reportsIndex}
        onMakePublic={handleMakePublic}
      />
    </main>
  );
}

export default NewPDF;
