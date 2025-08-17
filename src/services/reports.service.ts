// src/services/reportService.ts
import api from './api';
import DataService from './data.service';
import type {
  ExtractedReport,
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';

export interface ReportsIndexItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  isPublicKey?: boolean;
  publicKey?: string | null;
  publicUrl?: string | null;
  createdAt?: string;
}
export type ReportsIndex = Record<string, ReportsIndexItem>;

const INDEX_KEY = 'reports_index';

export function loadReportsIndex(): ReportsIndex {
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

export function saveReportsIndex(idx: ReportsIndex) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

/**
 * Create a public link for a given report.
 * Returns updated index or null if failed.
 */
export async function makeReportPublic(
  guid: string,
  reportsIndex: ReportsIndex
): Promise<ReportsIndex | null> {
  const local = DataService.getData(guid) as ExtractedReport | null;
  if (!local || !local.isLoaded) {
    return null; // caller can decide to navigate to detail
  }

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
    saveReportsIndex(next);
    return next;
  }

  return null;
}
