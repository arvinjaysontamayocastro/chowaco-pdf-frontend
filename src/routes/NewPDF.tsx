// src/routes/NewPDF.tsx  (Production-safe)
import { useState, ChangeEvent, useRef } from 'react';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport, Summary } from '../types/types';
import KeyService from '../services/key.service';
import DataService from '../services/data.service';
import api from '../services/api';
import axios from 'axios';

function NewPDF() {
  // const [pdf, setPdf] = useState<File | null>(null);
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
    // setPdf(file);
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
      await sleep(1000);

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
        summary: { totalGoals: 0, totalBMPs: 0, completionRate: 0 } as Summary, // your Summary type here
      };
      DataService.setData(_id, seed);

      navigate(`/${_id}`);
    } catch (err: unknown) {
      let msg = 'Unknown error';

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (typeof data === 'string') {
          msg = data;
        } else if (data && typeof data === 'object') {
          const rec = data as Record<string, unknown>;
          const fromError = rec.error;
          const fromMessage = rec.message;

          if (typeof fromError === 'string') msg = fromError;
          else if (typeof fromMessage === 'string') msg = fromMessage;
          else msg = err.message;
        } else {
          msg = err.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      alert(`Upload failed: ${msg}`);
    } finally {
      setIsLoadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // setPdf(null);
    }
  };

  return (
    <main className={classes.main}>
      <div className={classes.snowflakeContainer}>
        {new Array(16).fill('').map((_, index) => (
          <div key={index} className={classes.snowflake}></div>
        ))}
      </div>
      {/* <div className={giantText}></div> */}
      <form className={classes.form}>
        {isLoadingPDF ? (
          <div className={classes.loadingcontainer}>
            <div className={classes.loading}>&nbsp;</div>
          </div>
        ) : null}
        <div className={classes.titlecontainer}>
          {isLoadingPDF ? (
            <>
              <h1>Your PDF is uploading...</h1>
              <p>{pdfMessage}</p>
            </>
          ) : null}
          {!isLoadingPDF ? (
            <>
              <h1>Insert PDF</h1>
              <p>Click here or drag your file in the box</p>
            </>
          ) : null}
        </div>
        {/* <FileUploadComponent name="file" required /> */}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className={classes.file}
        />
        <p className={classes.actions}>
          {/* <Link to=".." type="button">
            Cancel
          </Link> */}
          {/* <button type="button" onClick={uploadPdf} disabled={isLoadingPDF}>
            Upload PDF
          </button> */}
        </p>
      </form>
    </main>
  );
}

export default NewPDF;
