// src/components/UploadedReportsList.tsx
import { useNavigate } from 'react-router-dom';
import DataService from '../services/data.service';
import { ExtractedReport } from '../types/types';
import classes from './UploadedReportsList.module.css';

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

interface Props {
  reportsIndex: ReportsIndex;
  onMakePublic: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadedReportsList({
  reportsIndex,
  onMakePublic,
}: Props) {
  const navigate = useNavigate();

  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <section className={classes.reports} aria-label="Uploaded PDF Reports">
      <h2>Uploaded PDF Reports</h2>

      {cards.length === 0 ? (
        <p className={classes.muted}>No uploads yet.</p>
      ) : (
        <div className={classes.reportGrid}>
          {cards.map((c, idx) => {
            const local = DataService.getData(c.id) as ExtractedReport | null;
            const isLocalCopy = Boolean(local);
            const displayName =
              (local as unknown as { name?: string })?.name ?? `PDF ${idx + 1}`;

            return (
              <div key={c.id} className={classes.card}>
                <div className={classes.cardHeader}>
                  <strong>{displayName}</strong>
                  {c.isPublicKey ? (
                    <span className={classes.badge}>Public</span>
                  ) : null}
                </div>

                <div className={classes.meta}>
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
                        className={classes.smallBtn}
                      >
                        Create Local Copy
                      </button>
                    )}
                  </div>
                </div>

                <div className={classes.cardActions}>
                  {isLocalCopy && (
                    <button type="button" onClick={() => navigate(`/${c.id}`)}>
                      Open
                    </button>
                  )}

                  {isLocalCopy && !c.isPublicKey && false && (
                    <button type="button" onClick={() => onMakePublic(c.id)}>
                      Make it Public
                    </button>
                  )}

                  {c.isPublicKey && c.publicUrl ? (
                    <a href={c.publicUrl} target="_blank" rel="noreferrer">
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
  );
}
