// src/components/UploadedReportsList.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportsIndex } from '../services/reports.service';
import classes from './UploadedReportsList.module.css';

interface Props {
  reportsIndex: ReportsIndex;
  onMakePublic: (guid: string) => void;
}

export default function UploadedReportsList({
  reportsIndex,
  onMakePublic,
}: Props) {
  const [viewMode, setViewMode] = useState<'local' | 'public'>('local');
  const navigate = useNavigate();

  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  const filtered =
    viewMode === 'local'
      ? cards.filter((c) => !c.isPublicKey)
      : cards.filter((c) => c.isPublicKey);

  function formatSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <section className={classes.structured} aria-label="Uploaded PDF Reports">
      <h2>Uploaded PDF Reports</h2>
      <div className={classes.togglebar}>
        <button
          className={viewMode === 'local' ? classes.active : ''}
          onClick={() => setViewMode('local')}
        >
          Local Reports
        </button>
        <button
          className={viewMode === 'public' ? classes.active : ''}
          onClick={() => setViewMode('public')}
        >
          Public Reports
        </button>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'left' }}>
          {viewMode === 'local'
            ? 'No local uploads yet.'
            : 'No public links yet.'}
        </p>
      ) : (
        <div className={classes.grid}>
          {filtered.map((c, idx) => (
            <div key={c.id} className={classes.card}>
              <div className={classes.cardHeader}>
                <strong>{c.fileName ?? `PDF ${idx + 1}`}</strong>
                {c.isPublicKey && (
                  <span className={classes.publicBadge}>Public</span>
                )}
              </div>

              <div className={classes.cardBody}>
                <div>File: {c.fileName}</div>
                <div>Size: {formatSize(c.fileSizeBytes)}</div>
              </div>

              <div className={classes.cardActions}>
                <button
                  type="button"
                  onClick={() => navigate(`/${c.id}`)}
                  className={classes.actionBtn}
                >
                  Open
                </button>

                {!c.isPublicKey && (
                  <button
                    type="button"
                    onClick={() => onMakePublic(c.id)}
                    className={classes.actionBtn}
                  >
                    Make Public
                  </button>
                )}

                {c.isPublicKey && c.publicUrl && (
                  <a
                    href={c.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={classes.actionBtn}
                  >
                    View Link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
