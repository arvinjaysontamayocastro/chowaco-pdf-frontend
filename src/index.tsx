import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import Posts, { loader as postLoader } from './routes/Posts.tsx';
import NewPDF from './routes/NewPDF.tsx'; //, { action as NewPDFAction }
import RootLayout from './routes/RootLayout';

import './index.css';
import PDFReport, { loader as pdfReportLoader } from './routes/PDFReport.tsx';
import ReadMePage from './routes/ReadMePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Posts />,
        loader: postLoader,
        children: [
          { path: '/', element: <NewPDF /> }, //, action: NewPDFAction
          { path: '/:id', element: <PDFReport />, loader: pdfReportLoader },
        ],
      },
    ],
  },
  {
    path: '/readme',
    element: <ReadMePage />,
  },
]);
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    {/* <App /> */}
    <RouterProvider router={router} />
  </StrictMode>
);
