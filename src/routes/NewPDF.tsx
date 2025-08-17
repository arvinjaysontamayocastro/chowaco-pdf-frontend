// src/routes/NewPDF.tsx (Production-safe)
import { useState, useEffect } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import Snowfall from '../components/Snowfall';
import UploadedReportsList from '../components/UploadedReportsList';

// ✅ unified service import
import {
  loadReportsIndex,
  saveReportsIndex,
  ReportsIndex,
} from '../services/reports.service';

function NewPDF() {
  const [reportsIndex, setReportsIndex] = useState<ReportsIndex>(() =>
    loadReportsIndex()
  );
  const navigate = useNavigate();

  useEffect(() => {
    setReportsIndex(loadReportsIndex());
  }, []);

  return (
    <main className={classes.main}>
      <Snowfall count={13} />
      {/* PDF Upload Form */}
      <UploadForm
        onUploadSuccess={(id, file) => {
          const nextIdx = loadReportsIndex();
          nextIdx[id] = {
            id,
            fileName: file.name,
            fileSizeBytes: file.size,
            isPublicKey: false,
            publicKey: null,
            publicUrl: null,
            createdAt: new Date().toISOString(),
          };
          saveReportsIndex(nextIdx);
          setReportsIndex(nextIdx);
          navigate(`/${id}`);
        }}
      />

      {/* Uploaded PDF Reports */}
      <UploadedReportsList
        reportsIndex={reportsIndex}
        setReportsIndex={setReportsIndex}
      />
    </main>
  );
}

export default NewPDF;
