import React, { useState } from 'react';
import classes from './Charts.module.css';
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

  const renderTable = (
    data: Array<
      string | Record<string, unknown> | Array<Record<string, unknown>>
    >
  ) => {
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

    return <div>No data available</div>;
  };

  return (
    <div className={classes.container}>
      {/* <table className='charts-css column show-labels show-data-on-hover'>
        <caption>Monthly Sales</caption>
        <thead>
          <tr>
            <th scope='col'>Month</th>
            <th scope='col'>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope='row'>January</th>
            <td style={{ '--size': 0.6 } as React.CSSProperties}></td>
          </tr>
          <tr>
            <th scope='row'>February</th>
            <td style={{ '--size': 0.9 } as React.CSSProperties}></td>
          </tr>
          <tr>
            <th scope='row'>March</th>
            <td style={{ '--size': 0.4 } as React.CSSProperties}></td>
          </tr>
        </tbody>
      </table> */}
      <div className={classes.tabbuttons}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? classes.active : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={classes.tabcontent}>
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <div key={tab.id}>{renderTable(tab.content)}</div>
            )
        )}
      </div>
    </div>
  );
}

export default ChartsComponent;
