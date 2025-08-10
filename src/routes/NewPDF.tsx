import { useState, ChangeEvent } from 'react';
import axios from 'axios';
import classes from './NewPDF.module.css';
import { useNavigate } from 'react-router-dom';
import { ExtractedReport } from '../types/types';
import KeyService from '../services/key.service';
import DataService from '../services/data.service';
const API_BASE = process.env.REACT_APP_API_BASE;

function NewPDF() {
  let pdf;
  const [pdfMessage, setPdfMessage] = useState(
    'Click here or drag your file in the box'
  );
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      pdf = e.target.files[0];
      let pdfSize =
        pdf.size / 1024 <= 1024
          ? Number(pdf.size / 1024).toFixed(2) + 'KB'
          : Number(pdf.size / 1024 / 1024).toFixed(2) + 'MB';
      setPdfMessage(pdf.name + ', ' + pdfSize);
    }
    uploadPdf();
  };
  const navigate = useNavigate();

  const uploadPdf = async () => {
    // if (!pdf || isLoadingPDF) return;
    setIsLoadingPDF(true);

    let _id = KeyService.createGUID();
    console.log(_id);

    const formData = new FormData();
    formData.append('pdf', pdf);
    formData.append('guid', _id); // Add GUID so server gets req.body.guid

    try {
      axios
        .post(`${API_BASE}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((res) => {
          setExtractedReportPre(_id, pdf.name);
        })
        .catch((er) => {
          setIsLoadingPDF(false);
        });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload PDF.');
      setIsLoadingPDF(false);
    }
  };
  const setExtractedReportPre = async (id: string, pdfName: string) => {
    // console.log("id", id);
    // console.log("pdfName", pdfName);
    let extractedReport: ExtractedReport = {
      id: id,
      isLoaded: false,
      name: pdfName,
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
      },
    };
    // console.log("extractedReport", extractedReport);
    DataService.setData(id, extractedReport);
    // console.log("redirecting to /" + id);
    await sleep(1000);
    navigate('/' + id);
  };

  return (
    <main className={classes.main}>
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
