import { useState, ChangeEvent, useEffect } from "react";
import axios from "axios";
import classes from "./PDFReport.module.css";
import ChartsComponent from "../components/Charts";
import { useLoaderData } from "react-router-dom";
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
import DataService from "../services/data.service";
const API_BASE = process.env.REACT_APP_API_BASE;

function PDFReport() {
  const pdfReport: ExtractedReport = useLoaderData();

  const [id, setId] = useState(pdfReport.id);
  setId(pdfReport.id);
  const [reportName, setReportName] = useState("");
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

  let extractedReport = DataService.getData(id);

  const keys = [
    "goals",
    "bmps",
    "implementation",
    "monitoring",
    "outreach",
    "geographicAreas",
    "summary",
  ] as const;

  const extractAll = async () => {
    setIsLoadingData(true);
    console.log("id", id);
    for (const key of keys) {
      try {
        const res = await axios.post(`${API_BASE}/ask`, { guid: id, key: key });
        const parsed = JSON.parse(res.data.answer);

        switch (key) {
          case "goals":
            extractedReport.goals = parsed[key] as Goal[];
            setGoals(parsed[key] as Goal[]);
            break;
          case "bmps":
            extractedReport.bmps = parsed[key] as BMP[];
            setBmps(parsed[key] as BMP[]);
            break;
          case "implementation":
            extractedReport.implementationActivities = parsed[
              key
            ] as ImplementationActivity[];
            setImplementation(parsed[key] as ImplementationActivity[]);
            break;
          case "monitoring":
            extractedReport.monitoringMetrics = parsed[
              key
            ] as MonitoringMetric[];
            setMonitoring(parsed[key] as MonitoringMetric[]);
            break;
          case "outreach":
            extractedReport.outreachActivities = parsed[
              key
            ] as OutreachActivity[];
            setOutreach(parsed[key] as OutreachActivity[]);
            break;
          case "geographicAreas":
            extractedReport.geographicAreas = parsed[key] as GeographicArea[];
            setGeographicAreas(parsed[key] as GeographicArea[]);
            break;
          case "summary":
            extractedReport.summary = parsed[key] as Summary;
            setSummary(parsed[key] as Summary);
            break;
          default:
            console.warn(`Unknown key: ${key}`);
        }
        // ⏱️ Wait 1 seconds before continuing
        await sleep(1000);
      } catch (err) {
        console.error(`Failed to extract ${key}`, err);
      }
    }
    setIsLoadingData(false);
    console.log("goals", goals);
    setExtractedReport();
  };

  const setExtractedReport = () => {
    console.log("setExtractedReport", extractedReport);
    extractedReport.isLoaded = true;
    DataService.setData(id, extractedReport);
  };

  useEffect(() => {
    // console.log("pdfReport", pdfReport);
    if (pdfReport.isLoaded == true) {
      setReportName(pdfReport.name as string);
      setGoals(pdfReport.goals as Goal[]);
      setBmps(pdfReport.bmps as BMP[]);
      setImplementation(
        pdfReport.implementationActivities as ImplementationActivity[]
      );
      setMonitoring(pdfReport.monitoringMetrics as MonitoringMetric[]);
      setOutreach(pdfReport.outreachActivities as OutreachActivity[]);
      setGeographicAreas(pdfReport.geographicAreas as GeographicArea[]);
      setSummary(pdfReport.summary as Summary);
    } else {
      extractAll();
    }
  }, []);

  return (
    <main className={classes.main}>
      <form className={classes.form}>
        {isLoadingData ? <div className={classes.loading}>&nbsp;</div> : null}
        <h1>PDF Report</h1>
        <div>
          {isLoadingData ? (
            <h2>Building Structured Data for {reportName}</h2>
          ) : (
            <h2>Structured Data</h2>
          )}
          {/* <p className={classes.actions}>
            <button onClick={extractAll} disabled={isLoadingData}>
              {isLoadingData ? "Extracting..." : "Extract All"}
            </button>
          </p> */}
          <div className={classes.structured}>
            <pre
              style={{ background: "#f0f0f0", padding: "1rem" }}
              className={classes.pre}
            >
              {JSON.stringify(
                {
                  goals,
                  bmps,
                  implementation,
                  monitoring,
                  outreach,
                  geographicAreas,
                  summary,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </form>
      <div className={classes.charts}>
        <ChartsComponent extractedReport={extractedReport} />
      </div>
    </main>
  );
}

export default PDFReport;

export async function loader({ params }: any) {
  // try get from memory
  let id = params.id;
  if (id == null || id == undefined) {
    return false;
  }
  let localData = DataService.getData(id);
  if (localData != null && localData != undefined) {
    return localData;
  }
}
