export interface ReportIdentity {
  huc: string;
  mwsId?: string;
  basinGroup?: string;
  subbasin?: string;
  planYear?: number;
  planType?: string;
}

export interface GeographicArea {
  name: string;
  size: number;
  huc?: string;
  ecoregionLevel3?: string;
  ecoregionLevel4?: string;
}

export interface Pollutant {
  name: string;
  loadUnit?: string;
  baselineLoad?: number;
  targetLoad?: number;
  currentLoad?: number;
}

export interface Goal {
  id: number;
  description: string;
  targetYear?: number;
  completionRate?: number | null;
}

export interface BMP {
  id: number;
  name: string;
  description?: string;
  bmptype?: string;
  location?: { lat: number; lng: number } | string;
  expectedLoadReduction?: { pollutant: string; amount: number; unit: string }[];
  unitCost?: number;
  lifecycleYears?: number;
  oAndM?: string;
}

export interface ImplementationActivity {
  id: number;
  description: string;
  timeline: string;
  phase?: string;
  start?: string;
  end?: string;
  status?: string;
  cost?: number;
  currency?: string;
}

export interface MonitoringMetric {
  id: number;
  metric: string;
  unit?: string;
  method?: string;
  frequency?: string;
  baseline?: number;
  target?: number;
  current?: number;
}

export interface OutreachActivity {
  id: number;
  name: string;
  targetAudience?: string;
  description?: string;
  date?: string;
  location?: string;
}

export interface Summary {
  totalGoals: number;
  totalBMPs: number;
  completionRate: number | null;
}

export interface ExtractedReport {
  id: string;
  isLoaded: boolean;
  name: string;
  identity?: ReportIdentity;
  geographicAreas: GeographicArea[];
  pollutants?: Pollutant[];
  goals: Goal[];
  bmps: BMP[];
  implementationActivities?: ImplementationActivity[];
  monitoringMetrics: MonitoringMetric[];
  outreachActivities?: OutreachActivity[];
  summary: Summary;
  fileName: string;
  fileSizeBytes: number;
}

export interface MetaJson {
  guid: string;
  name?: string;
  totals?: {
    goals: number;
    bmps: number;
    completionRate: number;
  };
  completionRate?: number;
  fileName?: string;
  fileSizeBytes?: number;
  note?: string; // up to 300 chars
}

export interface CreateOpenLinkRequest {
  guid: string;
  meta: MetaJson;
  data: Record<string, unknown>;
}

export interface CreateOpenLinkResponse {
  publicId: string;
  url: string;
  createdAt: string;
}

/** Generic source/citation item for displays */
export interface SourceItem {
  label?: string;
  page?: number;
  url?: string;
  note?: string;
  [k: string]: unknown;
}
