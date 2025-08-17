import { useState, useRef } from 'react';
import classes from './UploadForm.module.css';
import KeyService from '../services/key.service';
import DataService from '../services/data.service';
import api from '../services/api';
import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import { ExtractedReport, Summary } from '../types/types';

const MAX_SIZE_MB = 20;
const PDF_MIME = 'application/pdf';

interface Props {
  onUploadSuccess: (id: string, file: File) => void;
}

export default function UploadForm({ onUploadSuccess }: Props) {
  const [pdfMessage, setPdfMessage] = useState(
    'Click here or drag your file in the box'
  );
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function validateFile(file: File): string | null {
    const sizeMb = file.size / (1024 * 1024);
    if (file.type !== PDF_MIME && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Please select a PDF file (.pdf).';
    }
    if (sizeMb > MAX_SIZE_MB) {
      return `File too large. Max ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const err = validateFile(file);
      if (err) {
        alert(err);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setPdfMessage(`${file.name}, ${sizeMb} MB`);
      void uploadPdf(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoadingPDF) setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoadingPDF) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setPdfMessage(`${file.name}, ${sizeMb} MB`);
    void uploadPdf(file);
  };

  async function uploadPdf(file: File) {
    if (!file || isLoadingPDF) return;
    setIsLoadingPDF(true);

    try {
      const _id = KeyService.createGUID();
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('guid', _id);

      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxBodyLength: Infinity,
        onUploadProgress: (evt: AxiosProgressEvent) => {
          const total = evt.total ?? 0;
          if (!total) return;
          const pct = Math.round((evt.loaded / total) * 100);
          setPdfMessage(`${file.name} — uploading ${pct}%`);
        },
      });

      // seed minimal ExtractedReport
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
        summary: {
          totalGoals: 0,
          totalBMPs: 0,
          completionRate: 0,
        } as Summary,
      };
      DataService.setData(_id, seed);

      onUploadSuccess(_id, file);
    } catch (err) {
      alert('Upload failed.');
    } finally {
      setIsLoadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <form
      className={classes.form}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={!isLoadingPDF ? openPicker : undefined}
      role="button"
      aria-label="Click or drop a PDF to upload"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isLoadingPDF && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          openPicker();
        }
      }}
    >
      {isLoadingPDF && (
        <div className={classes.loadingcontainer}>
          <div className={classes.loading} aria-hidden="true">
            &nbsp;
          </div>
        </div>
      )}

      <div
        className={classes.titlecontainer}
        data-dragover={isDragOver ? 'true' : 'false'}
      >
        {isLoadingPDF ? (
          <>
            <h1>Your PDF is uploading...</h1>
            <p>{pdfMessage}</p>
          </>
        ) : (
          <>
            <h1>Insert PDF</h1>
            <p>
              {isDragOver
                ? 'Drop the file to upload'
                : 'Click here or drag your file in the box'}
            </p>
            <p>before winter comes</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className={classes.file}
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
