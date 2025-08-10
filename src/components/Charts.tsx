import React, { useState } from 'react';
import classes from './Charts.module.css';
import 'charts.css';

interface ReportData {
  summary?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  bmps?: Array<Record<string, unknown>>;
  implementationActivities?: Array<Record<string, unknown>>;
  monitoringMetrics?: Array<Record<string, unknown>>;
  outreachActivities?: Array<Record<string, unknown>>;
  geographicAreas?: Array<Record<string, unknown>>;
}
interface ChartsProps {
  pdfReport?: ReportData;
}

function ChartsComponent({ pdfReport }: ChartsProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const tabs = [
    { id: 'summary', label: 'Summary', content: pdfReport?.summary },
    { id: 'goals', label: 'Goals', content: pdfReport?.goals },
    { id: 'bmps', label: 'BMPs', content: pdfReport?.bmps },
    {
      id: 'implementationActivities',
      label: 'Implementations',
      content: pdfReport?.implementationActivities,
    },
    {
      id: 'monitoringMetrics',
      label: 'Monitoring Metrics',
      content: pdfReport?.monitoringMetrics,
    },
    {
      id: 'outreachActivities',
      label: 'Outreach Activities',
      content: pdfReport?.outreachActivities,
    },
    {
      id: 'geographicAreas',
      label: 'Geographic Areas',
      content: pdfReport?.geographicAreas,
    },
  ];

  const isNumericDataset = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstRow = Object.values(data[0]);
    return firstRow.every((val) => typeof val === 'number');
  };

  const renderTable = (data: any) => {
    if (!data) return <div>No data available</div>;

    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]);
      return (
        <table className={classes.table}>
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                {keys.map((key) => (
                  <td key={key}>{String(item[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (typeof data === 'object') {
      return (
        <table className={classes.table}>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return <div>{String(data)}</div>;
  };

  const renderChart = (data: any, label: string) => {
    if (!isNumericDataset(data)) {
      return <div>No chart available for this data</div>;
    }

    const keys = Object.keys(data[0]);
    return (
      <table
        className="charts-css column show-labels show-data-on-hover"
        style={{ height: '300px' }}
      >
        <caption>{label}</caption>
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} scope="col">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {keys.map((key) => (
                <td
                  key={key}
                  style={
                    {
                      '--size': String(
                        row[key] / Math.max(...data.map((r) => r[key]))
                      ),
                    } as React.CSSProperties
                  }
                >
                  <span>{row[key]}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className={classes.container}>
      {/* Tab Buttons */}
      <div className={classes.tabbuttons}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setViewMode('table');
            }}
            className={activeTab === tab.id ? classes.active : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className={classes.viewtoggle}>
        <button
          onClick={() => setViewMode('table')}
          className={viewMode === 'table' ? classes.active : ''}
        >
          Table View
        </button>
        <button
          onClick={() => setViewMode('chart')}
          className={viewMode === 'chart' ? classes.active : ''}
        >
          Chart View
        </button>
      </div>

      {/* Tab Content */}
      <div className={classes.tabcontent}>
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <div key={tab.id} className={classes.contentwrapper}>
                {viewMode === 'table'
                  ? renderTable(tab.content)
                  : renderChart(tab.content, tab.label)}
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default ChartsComponent;
