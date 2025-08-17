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
  saveReportsIndex, // still used in PublicReportsList; safe to keep
} from '../services/reports.service';

import LocalReportsList, { LocalReportItem } from './LocalReportsList';
import PublicReportsList from './PublicReportsList';

interface UploadedReportsListProps {
  reportsIndex: ReportsIndex;
  setReportsIndex: (next: ReportsIndex) => void;
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
  const [noteById] = useState<Record<string, string>>({});
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
        .catch(() => setPublicReports([]));
    }
  }, [activeTab]);

  const handleMakePublic = async (guid: string) => {
    const local = DataService.getData(guid) as ExtractedReport | null;
    if (!local || !local.isLoaded) {
      navigate(`/${guid}`);
      return;
    }

    try {
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

  const openReport = (guid: string) => navigate(`/${guid}`);

  // Sorted local reports → map into presentational items for LocalReportsList
  const localCardsSorted = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  const localItems: LocalReportItem[] = localCardsSorted.map((c) => {
    const guid = c.id;
    const local = DataService.getData(guid) as ExtractedReport | null;
    const isLocalCopy = Boolean(local);
    const displayName = local?.name ?? `PDF ${guid.slice(0, 6)}`;

    return {
      id: guid,
      displayName,
      fileName: c.fileName,
      fileSizeBytes: c.fileSizeBytes,
      isLocalCopy,
      publicUrl: c.publicUrl,
    };
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
          Public Reports <span className={classes.badge}>Soon</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'local' && (
        <LocalReportsList
          items={localItems}
          onOpen={openReport}
          onMakePublic={handleMakePublic}
        />
      )}

      {activeTab === 'public' && (
        <PublicReportsList publicReports={publicReports} />
      )}
    </section>
  );
}
