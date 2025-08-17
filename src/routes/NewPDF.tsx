// src/routes/NewPDF.tsx (Production-safe)
import { useState, useEffect } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport } from '../types/types';
import type {
  MetaJson,
  CreateOpenLinkRequest,
  CreateOpenLinkResponse,
} from '../types/types';
import DataService from '../services/data.service';
import api from '../services/api';
import UploadForm from '../components/UploadForm';
import Snowfall from '../components/Snowfall';
import BackendStatusCard from '../components/BackendStatusCard';
import UploadedReportsList from '../components/UploadedReportsList';

// ✅ unified service import
import {
  loadReportsIndex,
  saveReportsIndex,
  ReportsIndex,
  ReportsIndexItem,
} from '../services/reports.service';

function NewPDF() {
  const [reportsIndex, setReportsIndex] = useState<ReportsIndex>(() =>
    loadReportsIndex()
  );
  const navigate = useNavigate();

  useEffect(() => {
    setReportsIndex(loadReportsIndex());
  }, []);

  const cards = Object.values(reportsIndex).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return (
    <main className={classes.main}>
      <Snowfall count={10} />
      <BackendStatusCard />

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
