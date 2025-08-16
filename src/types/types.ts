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
  county?: string;
  centroid?: { lat: number; lng: number };
  areaUnits?: string;
}

export interface Pollutant {
  name: string;
  currentLoad?: number | string;
  targetLoad?: number | string;
  unit?: string;
}

export interface Goal {
  id: number;
  description: string;
  completionRate: string;
  category?: string;
  targetDate?: string;
  relatedPollutants?: string[];
  successMetrics?: string[];
}

export interface BMP {
  name: string;
  sizeAmount: number;
  sizeUnits: string;
  estimatedCost: number;
  estimatedCurrency: string;
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
  responsibleParties?: string[];
  dependencies?: number[];
}

export interface MonitoringMetric {
  parameter: string;
  threshold: string;
  method?: string;
  frequency?: string;
  location?: { lat: number; lng: number } | string;
  baseline?: number;
  target?: number;
  unit?: string;
}

export interface OutreachActivity {
  id: number;
  description: string;
  intendedAudience: string;
  date?: string;
  location?: string;
  budget?: number;
  materials?: string[];
  partners?: string[];
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
}
export interface MetaJson {
  guid: string;
  name?: string;
  totals?: { goals: number; bmps: number };
  completionRate?: number;
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
