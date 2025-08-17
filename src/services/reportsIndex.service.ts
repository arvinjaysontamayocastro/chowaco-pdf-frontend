// src/services/reportsIndex.service.ts
interface ReportsIndexItem {
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
