import classes from './LocalReportsList.module.css';
import { formatSize } from '../services/reports.service';

export interface LocalReportItem {
  id: string;
  displayName: string;
  fileName?: string;
  fileSizeBytes: number;
  isLocalCopy: boolean;
  publicUrl?: string;
}

interface Props {
  items: LocalReportItem[];
  // eslint-disable-next-line no-unused-vars
  onOpen: (guid: string) => void;
  // eslint-disable-next-line no-unused-vars
  onMakePublic: (guid: string) => void;
}

export default function LocalReportsList({
  items,
  onOpen,
  onMakePublic,
}: Props) {
  if (items.length === 0) {
    return <div className={classes.emptyState}>No local reports yet.</div>;
  }

  return (
    <div className={classes.grid}>
      {items.map((c) => (
        <div key={c.id} className={classes.card}>
          <div className={classes.cardHeader}>
            <strong className={classes.cardTitle}>{c.displayName}</strong>
            <span className={classes.cardSize}>
              {formatSize(c.fileSizeBytes)}
            </span>
          </div>

          <div className={classes.cardFileName}>{c.fileName}</div>

          <div className={classes.cardActions}>
            <button onClick={() => onOpen(c.id)}>Open</button>

            {c.isLocalCopy && (
              <button onClick={() => onMakePublic(c.id)}>Make Public</button>
            )}

            {c.publicUrl && (
              <a
                href={c.publicUrl}
                target="_blank"
                rel="noreferrer"
                className={classes.link}
              >
                View Public Link
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
