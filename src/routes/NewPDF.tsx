// src/routes/NewPDF.tsx  (Production-safe)
import { useState, ChangeEvent, useRef } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport } from '../types/types';
import KeyService from '../services/key.service';
import DataService from '../services/data.service';
import api from '../services/api';

function NewPDF() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfMessage, setPdfMessage] = useState(
    'Click here or drag your file in the box'
  );
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPdf(file);
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setPdfMessage(`${file.name}, ${sizeMb} MB`);
      void uploadPdf(file); // auto-upload
    }
  };

  const uploadPdf = async (file: File) => {
    if (!file || isLoadingPDF) return;
    setIsLoadingPDF(true);
    try {
      const _id = KeyService.createGUID();
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('guid', _id);

      // multipart upload
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxBodyLength: Infinity,
      });

      // allow backend to finish processing before first ask
      await sleep(500);

      // seed minimal ExtractedReport shell (so page loads instantly)
      const seed: ExtractedReport = {
        id: _id,
        identity: { huc: '' },
        pollutants: [],
        goals: [],
        bmps: [],
        implementationActivities: [],
        monitoringMetrics: [],
        outreachActivities: [],
        geographicAreas: [],
        summary: { text: '' } as any, // your Summary type here
      };
      DataService.setData(_id, seed);

      navigate(`/${_id}`);
    } catch (err: any) {
      console.error('Upload PDF failed', err);
      alert(`Upload failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPdf(null);
    }
  };

  return (
    <main>
      <form className={classes.form} onSubmit={(e) => e.preventDefault()}>
        <div className={classes.control}>
          <label htmlFor="pdf">PDF File</label>
          <input
            id="pdf"
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isLoadingPDF}
          />
          <small>{pdfMessage}</small>
        </div>

        <p className={classes.actions}>
          {/* Optional manual trigger
          <button type="button" onClick={() => pdf && uploadPdf(pdf)} disabled={isLoadingPDF || !pdf}>
            Upload PDF
          </button> */}
        </p>
      </form>
    </main>
  );
}

export default NewPDF;
