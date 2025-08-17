// src/routes/NewPDF.tsx  (Production-safe, refactored)
import { useState, useEffect } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import Snowfall from '../components/Snowfall';
import UploadedReportsList from '../components/UploadedReportsList';

import {
  loadReportsIndex,
  saveReportsIndex,
  makeReportPublic,
  ReportsIndex,
} from '../services/reportService';

function NewPDF() {
  const [reportsIndex, setReportsIndex] = useState<ReportsIndex>(() =>
    loadReportsIndex()
  );

  const navigate = useNavigate();

  useEffect(() => {
    setReportsIndex(loadReportsIndex());
  }, []);

  // ---- Make it Public (delegated to service)
  const handleMakePublic = async (guid: string) => {
    const next = await makeReportPublic(guid, reportsIndex);
    if (!next) {
      navigate(`/${guid}`);
      return;
    }
    setReportsIndex(next);
    alert('Public link created!');
  };

  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <main className={classes.main}>
      <Snowfall count={10} />

      {/* 🟢 PDF Upload Form */}
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
        onMakePublic={handleMakePublic}
      />
    </main>
  );
}

export default NewPDF;
