import classes from './SourcesModal.module.css';

interface SourcesModalProps {
  sources: any[];
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
            <ul>
              {sources.map((src:any, idx:number) => (
                <li key={idx}>
                  <span>{src?.snippet || (typeof src === 'string' ? src : '')}</span> {typeof src?.page==='number' && <em> (p.{src.page})</em>}
                    {src}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </dialog>
    </>
  );
}
