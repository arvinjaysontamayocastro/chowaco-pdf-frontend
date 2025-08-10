// import ExtractedReportItem from './ExtractedReportItem';
import classes from './ExtractedReportsList.module.css';
import { useLoaderData } from 'react-router-dom';
import { ExtractedReport } from '../types/types';

function ExtractedReportsList() {
  const extractedReports = useLoaderData();

  // useEffect(() => {
  //   async function fetchPosts() {
  //     setIsFetching(true);
  //     const response = await fetch("http://localhost:8080/posts");
  //     const resData = await response.json();
  //     setPosts(resData.posts);
  //     setIsFetching(false);
  //   }

  //   fetchPosts();
  // }, []);

  return (
    <>
      {extractedReports.length > 0 && (
        <ul className={classes.extractedreports}>
          {extractedReports.map((report: ExtractedReport) => (
            // <ExtractedReportItem
            //   key={report.id}
            //   id={report.id}
            //   goals={report.goals}
            //   bmps={report.bmps}
            //   outreachActivities={report.outreachActivities}
            //   monitoringMetrics={report.monitoringMetrics}
            //   implementationActivities={report.implementationActivities}
            //   geographicAreas={report.geographicAreas}
            //   summary={report.summary}
            // ></ExtractedReportItem>
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
