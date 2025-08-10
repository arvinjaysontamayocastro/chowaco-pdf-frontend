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
  // const response = await fetch("http://localhost:8080/posts");
  // const resData = await response.json();
  // return resData.posts;
  return [];
}
