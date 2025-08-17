import { Outlet } from 'react-router-dom';
import ExtractedReportsList from '../components/ExtractedReportsList';

function Posts() {
  return (
    <>
      <main>
        <Outlet />
        <ExtractedReportsList />
      </main>
    </>
  );
}

export default Posts;

export async function loader() {
  return [];
}
