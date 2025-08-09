import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import Posts, { loader as postLoader } from "./routes/Posts.tsx";
import NewPost from "./routes/NewPost.tsx"; //, { action as newPostAction }
import RootLayout from "./routes/RootLayout";

import "./index.css";
import PDFReport, { loader as pdfReportLoader } from "./routes/PDFReport.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Posts />,
        loader: postLoader,
        children: [
          { path: "/create-post", element: <NewPost /> }, //, action: newPostAction
          { path: "/:id", element: <PDFReport />, loader: pdfReportLoader },
        ],
      }, // our domain
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App /> */}
    <RouterProvider router={router} />
  </StrictMode>
);
