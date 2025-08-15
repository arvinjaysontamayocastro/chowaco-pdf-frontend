import React, { useMemo, useState } from 'react';
import classes from './Charts.module.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
} from 'recharts';

type TabKey =
  | 'summary'
  | 'goals'
  | 'bmps'
  | 'pollutants'
  | 'implementationActivities'
  | 'monitoringMetrics'
  | 'outreachActivities'
  | 'geographicAreas';

interface Goal {
  name?: string;
  completionRate?: number | string | null;
}

interface BMP {
  name?: string;
  sizeAmount?: number | string | null;
  sizeUnit?: string | null;
  estimatedCurrency?: string | null;
  estimatedCost?: number | string | null;
  unitCost?: number | string | null;
}

interface Pollutant {
  name?: string;
  concentration?: number | string | null;
}

interface ChartsProps {
  data: {
    goals?: Goal[];
    bmps?: BMP[];
    pollutants?: Pollutant[];
    implementationActivities?: Record<string, unknown>[];
    monitoringMetrics?: Record<string, unknown>[];
    outreachActivities?: Record<string, unknown>[];
    geographicAreas?: Record<string, unknown>[];
    [k: string]: unknown; // ← was any
  };
}

function toNumber(n: unknown): number {
  if (typeof n === 'number') return isFinite(n) ? n : 0;
  if (typeof n === 'string') {
    const m = n.match(/-?\d+(\.\d+)?/);
    if (m) {
      const v = parseFloat(m[0]);
      return isFinite(v) ? v : 0;
    }
  }
  return 0;
}

export default function Charts({ data }: ChartsProps) {
  const tableOnlyTabs: TabKey[] = [
    'implementationActivities',
    'monitoringMetrics',
    'outreachActivities',
    'geographicAreas',
  ];

  const tabDefaults: Record<TabKey, 'cards' | 'table'> = {
    summary: 'cards',
    goals: 'cards',
    bmps: 'cards',
    pollutants: 'cards',
    implementationActivities: 'table',
    monitoringMetrics: 'table',
    outreachActivities: 'table',
    geographicAreas: 'table',
  };

  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [view, setView] = useState<'cards' | 'table'>(tabDefaults['summary']);

  const counts = useMemo(() => {
    const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);
    return {
      goals: arrLen(data?.goals),
      bmps: arrLen(data?.bmps),
      pollutants: arrLen(data?.pollutants),
      implementationActivities: arrLen(data?.implementationActivities),
      monitoringMetrics: arrLen(data?.monitoringMetrics),
      outreachActivities: arrLen(data?.outreachActivities),
      geographicAreas: arrLen(data?.geographicAreas),
    };
  }, [data]);

  const tabs: { key: TabKey; label: string; count?: number }[] = useMemo(
    () => [
      { key: 'summary', label: 'Summary' },
      { key: 'goals', label: 'Goals', count: counts.goals },
      { key: 'bmps', label: 'BMPs', count: counts.bmps },
      { key: 'pollutants', label: 'Pollutants', count: counts.pollutants },
      {
        key: 'implementationActivities',
        label: 'Implementation',
        count: counts.implementationActivities,
      },
      {
        key: 'monitoringMetrics',
        label: 'Monitoring',
        count: counts.monitoringMetrics,
      },
      {
        key: 'outreachActivities',
        label: 'Outreach',
        count: counts.outreachActivities,
      },
      {
        key: 'geographicAreas',
        label: 'Geographic Areas',
        count: counts.geographicAreas,
      },
    ],
    [counts]
  );

  const handleTabClick = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setView(tabDefaults[tabKey]);
  };

  const goalsChartData = useMemo(() => {
    const list = Array.isArray(data?.goals) ? data.goals : [];
    return list.map((g) => ({
      name: g?.name || 'Unnamed Goal',
      completionRate: toNumber(g?.completionRate),
    }));
  }, [data?.goals]);

  const bmpSizeChartData = useMemo(() => {
    const list = Array.isArray(data?.bmps) ? data.bmps : [];
    return list
      .filter((bmp) => bmp?.sizeAmount && bmp?.sizeUnit)
      .map((bmp) => ({
        name: bmp?.name || 'Unnamed BMP',
        amount: toNumber(bmp?.sizeAmount),
        unit: bmp?.sizeUnit ?? '',
      }));
  }, [data?.bmps]);

  const bmpCostChartData = useMemo(() => {
    const list = Array.isArray(data?.bmps) ? data.bmps : [];
    return list
      .filter(
        (bmp) => bmp?.estimatedCurrency && (bmp?.estimatedCost || bmp?.unitCost)
      )
      .map((bmp) => ({
        name: bmp?.name || 'Unnamed BMP',
        estimatedCost: toNumber(bmp?.estimatedCost),
        unitCost: toNumber(bmp?.unitCost),
        currency: bmp?.estimatedCurrency ?? '',
      }));
  }, [data?.bmps]);

  const pollutantChartData = useMemo(() => {
    const list = Array.isArray(data?.pollutants) ? data.pollutants : [];
    const rows = list
      .map((p) => ({
        name: p?.name || 'Unnamed Pollutant',
        value: toNumber(p?.concentration),
      }))
      .filter((d) => Number.isFinite(d.value) && d.value > 0);
    return rows;
  }, [data?.pollutants]);

  const renderGoalsChart = () => {
    if (!goalsChartData.length) {
      return <div className={classes.noChart}>No Chart Available</div>;
    }
    return (
      <div className={classes.chartSection}>
        <strong>Goals Completion Rate</strong>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={goalsChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              height={80}
              textAnchor="end"
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completionRate" name="Completion Rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBMPCharts = () => {
    const hasSize = bmpSizeChartData.length > 0;
    const hasCost = bmpCostChartData.length > 0;

    if (!hasSize && !hasCost) {
      return <div className={classes.noChart}>No Chart Available</div>;
    }

    return (
      <>
        {hasSize && (
          <div className={classes.chartSection}>
            <strong>Size Amount by BMP</strong>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bmpSizeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  height={80}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" name="Size Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasCost && (
          <div className={classes.chartSection}>
            <strong>Estimated Cost & Unit Cost by BMP</strong>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bmpCostChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  height={80}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimatedCost" name="Estimated Cost" />
                <Bar dataKey="unitCost" name="Unit Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    );
  };

  const renderPollutantsChart = () => {
    if (!pollutantChartData.length) {
      return (
        <div className={classes.noChart}>
          {Array.isArray(data?.pollutants) && data.pollutants.length > 0
            ? 'No valid concentration data'
            : 'No Chart Available'}
        </div>
      );
    }

    return (
      <div className={classes.chartSection}>
        <strong>Pollutants Concentration</strong>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pollutantChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(e) => `${e.name}: ${e.value}`}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderCharts = () => {
    if (activeTab === 'summary') {
      return (
        <>
          {renderGoalsChart()}
          {renderBMPCharts()}
          {renderPollutantsChart()}
        </>
      );
    }
    if (tableOnlyTabs.includes(activeTab)) return null;
    if (activeTab === 'goals') return renderGoalsChart();
    if (activeTab === 'bmps') return renderBMPCharts();
    if (activeTab === 'pollutants') return renderPollutantsChart();
    return <div className={classes.noChart}>No Chart Available</div>;
  };

  const activeDataArray = useMemo(() => {
    const v = data?.[activeTab];
    return Array.isArray(v) ? v : [];
  }, [data, activeTab]);

  return (
    <div className={classes.container}>
      <div className={classes.tabbuttons}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? classes.active : ''}
            onClick={() => handleTabClick(tab.key)}
            aria-pressed={activeTab === tab.key}
          >
            {tab.label}
            {tab.key !== 'summary' && (
              <span className={classes.badge}>{tab.count ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      <div className={classes.tabcontent}>
        <div className={classes.viewControls}>
          {/* Search input hook-up can go here when needed */}
          {activeTab !== 'summary' && !tableOnlyTabs.includes(activeTab) && (
            <button
              onClick={() => setView(view === 'cards' ? 'table' : 'cards')}
            >
              Switch to {view === 'cards' ? 'Table' : 'Cards'}
            </button>
          )}
        </div>

        <div className={classes.flexRow}>
          {(!tableOnlyTabs.includes(activeTab) || activeTab === 'summary') && (
            <div
              className={
                view === 'table' && activeTab !== 'summary'
                  ? classes.chartContainerFull
                  : classes.chartContainer
              }
            >
              {renderCharts()}
            </div>
          )}

          {activeTab !== 'summary' && (
            <div
              className={
                view === 'table'
                  ? `${classes.dataContainerFull} ${classes.fullWidthTable}`
                  : classes.dataContainer
              }
            >
              {view === 'cards' ? (
                <div className={classes.cardGrid}>
                  {activeDataArray.map(
                    (item: Record<string, unknown>, idx: number) => (
                      <div key={idx} className={classes.card}>
                        <div className={classes.cardImage}>Photo</div>
                        <div className={classes.cardContent}>
                          {(Object.entries(item) as [string, unknown][]).map(
                            ([k, v]) => (
                              <div key={k} className={classes.cardRow}>
                                <strong>{k}:</strong> {String(v)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <>
                  <strong style={{ marginBottom: '4px' }}>
                    {tabs.find((t) => t.key === activeTab)?.label} Table
                  </strong>
                  <div
                    style={{
                      marginBottom: '12px',
                      fontSize: '0.9rem',
                      color: '#666',
                    }}
                  >
                    This table shows detailed data for{' '}
                    {tabs.find((t) => t.key === activeTab)?.label}.
                  </div>
                  <table className={`${classes.table} ${classes.wrapTable}`}>
                    <thead>
                      <tr>
                        {activeDataArray[0] &&
                          Object.keys(activeDataArray[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeDataArray.map(
                        (item: Record<string, unknown>, idx: number) => (
                          <tr key={idx}>
                            {Object.values(item).map(
                              (val: unknown, i: number) => (
                                <td key={i}>{String(val)}</td>
                              )
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
