import classes from './SourcesModal.module.css';
import type { SourceItem } from '../types/types';

interface SourcesModalProps {
  sources: SourceItem[];
  onClose: () => void;
}

export default function SourcesModal({ sources, onClose }: SourcesModalProps) {
  return (
    <>
      <div className={classes.backdrop} onClick={onClose} />
      <dialog open className={classes.modal}>
        <header className={classes.header}>
          <h2>Sources</h2>
          <button onClick={onClose} className={classes.closeBtn}>
            ✕
          </button>
        </header>

        <section className={classes.content}>
          {sources.length === 0 && <p>No sources available.</p>}
          {sources.length > 0 && (
            <ul className={classes.list}>
              {sources.map((src: SourceItem, idx: number) => (
                <li key={idx} className={classes.item}>
                  <div className={classes.itemTitle}>
                    {src.label ?? src.url ?? `Source #${idx + 1}`}
                  </div>
                  {typeof src.page === 'number' && (
                    <div className={classes.itemMeta}>p. {src.page}</div>
                  )}
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noreferrer">
                      Open link
                    </a>
                  )}
                  {src.note && (
                    <p className={classes.itemNote}>{String(src.note)}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </dialog>
    </>
  );
}
