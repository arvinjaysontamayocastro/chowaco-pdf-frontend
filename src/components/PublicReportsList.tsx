import classes from './PublicReportsList.module.css';
import { formatSize } from '../services/reports.service';

interface PublicReport {
  id: string;
  guid: string;
  meta?: {
    name?: string;
    fileName?: string;
    fileSizeBytes?: number;
  };
  url: string;
  createdAt?: string;
}

interface Props {
  publicReports: PublicReport[];
}

export default function PublicReportsList({ publicReports }: Props) {
  if (publicReports.length === 0) {
    return <div className={classes.emptyState}>No public reports found.</div>;
  }

  return (
    <div className={classes.grid}>
      {publicReports.map((p) => (
        <div key={p.id} className={classes.card}>
          <div className={classes.cardHeader}>
            <strong className={classes.cardTitle}>
              {p.meta?.name ?? `Public ${p.id.slice(0, 6)}`}
            </strong>
            <span className={classes.cardDate}>
              {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
            </span>
          </div>
          <div className={classes.cardFileName}>
            {p.meta?.fileName} • {formatSize(p.meta?.fileSizeBytes ?? 0)}
          </div>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            View Public Link
          </a>
        </div>
      ))}
    </div>
  );
}
