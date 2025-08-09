import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import classes from "./NewPost.module.css";
import Modal from "../components/Modal";
import { Link, Form, redirect, useNavigate } from "react-router-dom";
import FileUploadComponent from "../components/FileUploadComponent.module";
import {
  BMP,
  ExtractedReport,
  GeographicArea,
  Goal,
  ImplementationActivity,
  MonitoringMetric,
  OutreachActivity,
  Summary,
} from "../types/types";
import KeyService from "../services/key.service";
import DataService from "../services/data.service";
const API_BASE = process.env.REACT_APP_API_BASE;

function NewPost() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [id, setId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [reportName, setReportName] = useState("");
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isLoadedPDF, setIsLoadedPDF] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bmps, setBmps] = useState<BMP[]>([]);
  const [implementation, setImplementation] = useState<
    ImplementationActivity[]
  >([]);
  const [monitoring, setMonitoring] = useState<MonitoringMetric[]>([]);
  const [outreach, setOutreach] = useState<OutreachActivity[]>([]);
  const [geographicAreas, setGeographicAreas] = useState<GeographicArea[]>([]);
  const [summary, setSummary] = useState<Summary>();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdf(e.target.files[0]);
    }
  };
  const navigate = useNavigate();

  const uploadPdf = async () => {
    if (!pdf || isLoadingPDF) return;
    setIsLoadingPDF(true);

    let _id = KeyService.createGUID();
    console.log(_id);

    const formData = new FormData();
    formData.append("pdf", pdf);
    formData.append("guid", _id); // Add GUID so server gets req.body.guid

    try {
      setId(_id);
      axios
        .post(`${API_BASE}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          console.log("PDF uploaded and processed!" + JSON.stringify(res));
          console.log(res);
          setIsLoadingPDF(false);
          setIsLoadedPDF(true);
          setExtractedReportPre(_id, pdf.name);
        })
        .catch((er) => {
          console.log(er);

          setIsLoadingPDF(false);
        });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload PDF.");
      setIsLoadingPDF(false);
    }
  };
  const askQuestion = async () => {
    try {
      const res = await axios.post(`${API_BASE}/ask`, { question });
      setAnswer(res.data.answer);
      console.log(res.data.answer);
      console.log(res.data);
    } catch (err) {
      console.error("Question failed:", err);
      alert("Failed to get an answer.");
    }
  };
  const setExtractedReportPre = async (id: string, pdfName: string) => {
    console.log("id", id);
    console.log("pdfName", pdfName);
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
    console.log("extractedReport", extractedReport);
    DataService.setData(id, extractedReport);
    console.log("redirecting to /" + id);
    await sleep(1000);
    navigate("/" + id);
  };

  return (
    <main className={classes.main}>
      <form className={classes.form}>
        {isLoadingData || isLoadingPDF ? (
          <div className={classes.loading}>&nbsp;</div>
        ) : null}
        <h1>PDF Text Extractor</h1>
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
          <button type="button" onClick={uploadPdf} disabled={isLoadingPDF}>
            Upload PDF
          </button>
        </p>
      </form>
    </main>
  );
}

export default NewPost;
