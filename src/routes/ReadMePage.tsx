import classes from './ReadMePage.module.css';

export default function ReadMePage() {
  return (
    <div className={classes.container}>
      <h2>📖 Welcome to Juicy Extracts</h2>
      <p>
        This tool extracts and summarizes content from PDF reports. Use it to
        quickly view summaries, goals, BMPs, pollutants, and more.
      </p>

      <h3>How to use:</h3>
      <ol>
        <li>
          Click <strong>Process New PDF</strong> to upload and analyze a file.
        </li>
        <li>Wait for the backend to process and generate insights.</li>
        <li>View results under each tab (Summary, Goals, BMPs, etc.).</li>
        <li>Access public reports if available.</li>
      </ol>

      <h3>Tips:</h3>
      <ul>
        <li>Large PDFs may take longer to process.</li>
        <li>
          Use the <strong>Public Reports</strong> section to view shared
          reports.
        </li>
        <li>
          All extracted data is AI-assisted — verify before using officially.
        </li>
      </ul>
    </div>
  );
}
