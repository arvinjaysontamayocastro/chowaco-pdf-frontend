import classes from './ExtractedReportsList.module.css';
import { useLoaderData } from 'react-router-dom';
import { ExtractedReport } from '../types/types';

function ExtractedReportsList() {
  const extractedReports = useLoaderData();

  return (
    <>
      {extractedReports.length > 0 && (
        <ul className={classes.extractedreports}>
          {extractedReports.map((report: ExtractedReport) => (
            <p key={report.id}>Test</p>
          ))}
        </ul>
      )}
      {extractedReports.length === 0 && (
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>There are no posts yet.</h2>
          <p>Start adding some!</p>
        </div>
      )}
    </>
  );
}

export default ExtractedReportsList;
