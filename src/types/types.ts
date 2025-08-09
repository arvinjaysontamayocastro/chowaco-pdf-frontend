export type Goal = {
  id: number; // Identifier for the goal \n
  description: string; // Description of the goal \n
  completionRate: string; // Completion rate of the goal \n
};

export type BMP = {
  // From Cost Estimate table \n
  name: string; // Name of the BMP or Practice Name \n
  sizeAmount: number; // Amount or size indicator for the BMP or units \n
  sizeUnits: string; // Unit of size (e.g., "each", "tns", "ac", "ft", "cuyd", "cu yd") \n
  estimatedCost: number; // Estimated cost for the BMP \n
  estimatedCurrency: string; // Currency of the estimated cost \n
};

export type ImplementationActivity = {
  id: number; // Identifier for the implementation activity \n
  description: string; // Description of the activity \n
  timeline: string; // Proposed timeline for the activity \n
};

export type MonitoringMetric = {
  parameter: string; // The water quality parameter to be monitored \n
  threshold: string; // The compliance threshold \n
};

export type OutreachActivity = {
  id: number; // Identifier for the outreach activity \n
  description: string; // Description of the activity \n
  intendedAudience: string; // The audience for the outreach activity \n
};

export type GeographicArea = {
  name: string; // Name of the geographic area \n
  size: number; // Size of the area in acres or relevant units \n
};

export type Summary = {
  totalGoals: number; // Total number of goals identified in the watershed plan \n
  totalBMPs: number; // Total number of BMPs proposed \n
  completionRate: number; // Estimated completion rate of projects as a percentage \n
};

export type ExtractedReport = {
  id: string;
  isLoaded: boolean;
  name: string;
  goals: Goal[];
  bmps: BMP[];
  implementationActivities: ImplementationActivity[];
  monitoringMetrics: MonitoringMetric[];
  outreachActivities: OutreachActivity[];
  geographicAreas: GeographicArea[];
  summary: Summary;
};
